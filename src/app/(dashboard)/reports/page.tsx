import type { Metadata } from "next";
import { Types } from "mongoose";
import { BarChart3, Package, TrendingUp, Users, Wallet } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Expense } from "@/models/Expense";
import { Customer } from "@/models/Customer";
import { Product } from "@/models/Product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueChart, ProfitChart, DonutChart } from "@/components/charts/revenue-chart";
import { formatCurrency, formatNumber, percentChange } from "@/lib/utils";
import { dailySeries, daysAgo, summarise, topProducts, websiteMetrics } from "@/services/metrics-service";
import { ReportToolbar } from "./report-toolbar";

export const metadata: Metadata = { title: "Reports" };

const RANGES = { "7": 7, "30": 30, "90": 90, "365": 365 } as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { businessId } = await requireBusiness();
  const params = await searchParams;
  const days = RANGES[(params.range as keyof typeof RANGES) ?? "30"] ?? 30;

  await connectDB();
  const oid = new Types.ObjectId(businessId);
  const from = daysAgo(days - 1);
  const previousFrom = daysAgo(days * 2 - 1);

  const [current, previous, series, top, expenseSplit, customerStats, inventoryValue, web] = await Promise.all([
    summarise(businessId, { from, to: new Date() }),
    summarise(businessId, { from: previousFrom, to: from }),
    dailySeries(businessId, days),
    topProducts(businessId, 10, from),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { businessId: oid, date: { $gte: from } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Customer.aggregate<{ _id: null; total: number; repeat: number; spend: number }>([
      { $match: { businessId: oid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          repeat: { $sum: { $cond: [{ $gt: ["$totalOrders", 1] }, 1, 0] } },
          spend: { $sum: "$totalSpent" },
        },
      },
    ]),
    Product.aggregate<{ _id: null; cost: number; retail: number; units: number }>([
      { $match: { businessId: oid, status: { $ne: "archived" }, trackInventory: true } },
      {
        $group: {
          _id: null,
          cost: { $sum: { $multiply: ["$stock", "$costPrice"] } },
          retail: { $sum: { $multiply: ["$stock", "$price"] } },
          units: { $sum: "$stock" },
        },
      },
    ]),
    websiteMetrics(businessId, from),
  ]);

  const customers = customerStats[0] ?? { total: 0, repeat: 0, spend: 0 };
  const inventory = inventoryValue[0] ?? { cost: 0, retail: 0, units: 0 };
  const grossProfit = current.revenue - current.cost;
  const margin = current.revenue > 0 ? (grossProfit / current.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Sales, profit and performance over time. Export any table as a CSV."
        actions={<ReportToolbar range={String(days)} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sales"
          value={formatCurrency(current.revenue, { decimals: false })}
          change={percentChange(current.revenue, previous.revenue)}
          sublabel="vs previous period"
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard
          label="Gross profit"
          value={formatCurrency(grossProfit, { decimals: false })}
          sublabel={`${margin.toFixed(0)}% margin`}
          icon={BarChart3}
        />
        <StatCard
          label="Expenses"
          value={formatCurrency(current.expenses, { decimals: false })}
          change={percentChange(current.expenses, previous.expenses)}
          sublabel="vs previous period"
          icon={Wallet}
          invertChange
        />
        <StatCard
          label="Net profit"
          value={formatCurrency(current.profit, { decimals: false })}
          change={percentChange(current.profit, previous.profit)}
          sublabel="after cost & expenses"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales over time</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RevenueChart data={series} height={280} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit and expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProfitChart data={series} height={280} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle>Best sellers</CardTitle>
            <span className="ml-auto text-[12.5px] text-muted-foreground">Last {days} days</span>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Product</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="pr-5 text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-[13px] text-muted-foreground">
                      No sales in this period.
                    </TableCell>
                  </TableRow>
                )}
                {top.map((row) => (
                  <TableRow key={String(row._id)}>
                    <TableCell className="pl-5 text-[13.5px] font-medium">{row.name}</TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums">{row.quantity}</TableCell>
                    <TableCell className="pr-5 text-right text-[13.5px] font-semibold tabular-nums">
                      {formatCurrency(row.revenue, { decimals: false })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {expenseSplit.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">No expenses in this period.</p>
            ) : (
              <DonutChart data={expenseSplit.map((row) => ({ label: row._id, value: row.total }))} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard
          icon={Users}
          title="Customers"
          rows={[
            { label: "Total customers", value: formatNumber(customers.total) },
            { label: "Ordered more than once", value: formatNumber(customers.repeat) },
            { label: "Lifetime value", value: formatCurrency(customers.spend, { decimals: false }) },
            {
              label: "Repeat rate",
              value: `${customers.total ? Math.round((customers.repeat / customers.total) * 100) : 0}%`,
            },
          ]}
        />
        <SummaryCard
          icon={Package}
          title="Inventory"
          rows={[
            { label: "Units in stock", value: formatNumber(inventory.units) },
            { label: "Value at cost", value: formatCurrency(inventory.cost, { decimals: false }) },
            { label: "Value at retail", value: formatCurrency(inventory.retail, { decimals: false }) },
            {
              label: "Potential profit",
              value: formatCurrency(inventory.retail - inventory.cost, { decimals: false }),
            },
          ]}
        />
        <SummaryCard
          icon={TrendingUp}
          title="Website"
          rows={[
            { label: "Visitors", value: formatNumber(web.visitors) },
            { label: "Product views", value: formatNumber(web.productViews) },
            { label: "Website orders", value: formatNumber(web.orders) },
            { label: "Conversion", value: `${web.conversionRate.toFixed(1)}%` },
          ]}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof Users;
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-[13.5px]">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-semibold tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

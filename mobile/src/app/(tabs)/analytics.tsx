import { useState } from "react";
import { View } from "react-native";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BarChart3, Package, TrendingUp, Users, Wallet, type LucideIcon } from "@/components/icons";
import { ChartLegend, DonutChart, TrendChart } from "@/components/charts";
import { ErrorState, Page, PageHeader } from "@/components/page";
import { Card, CardBody, CardHeader, Segmented, Skeleton, Thumb } from "@/components/primitives";
import { StatCard, StatGrid } from "@/components/stat-card";
import { Text } from "@/components/text";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, percentChange } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme-provider";
import type { Report, SeriesPoint } from "@/lib/types";

type Range = "7" | "30" | "90" | "365";

/** The web reports toolbar's ranges. */
const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A point a day is right for a week or a month; ninety or 365 points on a
 * phone are not. Longer ranges are summed into weeks or months.
 */
function bucket(series: SeriesPoint[], days: number) {
  type Point = { label: string; revenue: number; profit: number; expenses: number };
  if (days <= 31) return series.map(({ label, revenue, profit, expenses }) => ({ label, revenue, profit, expenses }));

  const add = (into: Point, p: SeriesPoint) => {
    into.revenue += p.revenue;
    into.profit += p.profit;
    into.expenses += p.expenses;
  };

  if (days <= 120) {
    const weeks: Point[] = [];
    series.forEach((p, i) => {
      if (i % 7 === 0) weeks.push({ label: p.label, revenue: 0, profit: 0, expenses: 0 });
      add(weeks[weeks.length - 1], p);
    });
    return weeks;
  }

  const months = new Map<string, Point>();
  for (const p of series) {
    const key = p.date.slice(0, 7);
    if (!months.has(key)) months.set(key, { label: `${MONTHS[Number(key.slice(5, 7)) - 1]} ’${key.slice(2, 4)}`, revenue: 0, profit: 0, expenses: 0 });
    add(months.get(key)!, p);
  }
  return [...months.values()];
}

export default function ReportsScreen() {
  const { business } = useSession();
  const { colors: c } = useTheme();
  const [range, setRange] = useState<Range>("30");

  const query = useQuery({
    queryKey: ["report", business?.id, range],
    queryFn: () => api<Report>(`/api/mobile/reports?range=${range}`),
    enabled: Boolean(business),
    // Keep the last range on screen while the next loads, instead of a blank page.
    placeholderData: keepPreviousData,
  });
  const r = query.data;
  const period = RANGES.find((option) => option.value === range)?.label.toLowerCase();
  const points = r ? bucket(r.series, r.days) : [];
  const grouping = r && r.days > 120 ? "By month" : r && r.days > 31 ? "By week" : "By day";

  return (
    <Page refreshing={query.isRefetching && !query.isPlaceholderData} onRefresh={() => query.refetch()}>
      <PageHeader title="Reports" description="Sales, profit and performance over time." />
      <Segmented
        options={RANGES}
        value={range}
        onChange={(next) => {
          haptics.select();
          setRange(next);
        }}
      />

      {!r && query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !r ? (
        <ReportSkeleton />
      ) : (
        <View style={{ gap: 18, opacity: query.isPlaceholderData ? 0.55 : 1 }}>
          <StatGrid>
            <StatCard
              label="Sales"
              value={formatCurrency(r.current.revenue)}
              change={percentChange(r.current.revenue, r.previous.revenue)}
              sublabel="vs previous period"
              icon={TrendingUp}
              tone="primary"
            />
            <StatCard
              label="Gross profit"
              value={formatCurrency(r.grossProfit)}
              sublabel={`${r.margin.toFixed(0)}% margin`}
              icon={BarChart3}
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(r.current.expenses)}
              change={percentChange(r.current.expenses, r.previous.expenses)}
              sublabel="vs previous period"
              icon={Wallet}
              invertChange
            />
            <StatCard
              label="Net profit"
              value={formatCurrency(r.current.profit)}
              change={percentChange(r.current.profit, r.previous.profit)}
              sublabel="after cost & expenses"
            />
          </StatGrid>

          <Card>
            <CardHeader title="Sales over time" description={`${grouping} · last ${period}`} />
            <CardBody>
              <TrendChart
                labels={points.map((p) => p.label)}
                series={[{ name: "Sales", values: points.map((p) => p.revenue), color: c.primary, fill: true }]}
                height={220}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Profit and expenses" description={`${grouping} · last ${period}`} />
            <CardBody>
              <TrendChart
                labels={points.map((p) => p.label)}
                series={[
                  { name: "Profit", values: points.map((p) => p.profit), color: c.primary },
                  { name: "Expenses", values: points.map((p) => p.expenses), color: c.gold },
                ]}
                height={220}
              />
              <ChartLegend items={[{ label: "Profit", color: c.primary }, { label: "Expenses", color: c.gold }]} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Best sellers" description={`Last ${period}`} />
            {r.top.length === 0 ? (
              <CardBody>
                <Text size={13} tone="muted" center style={{ paddingVertical: 18 }}>
                  No sales in this period.
                </Text>
              </CardBody>
            ) : (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    backgroundColor: c.muted,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text size={12} weight="medium" tone="muted" style={{ flex: 1 }}>
                    Product
                  </Text>
                  <Text size={12} weight="medium" tone="muted" style={{ width: 48, textAlign: "right" }}>
                    Units
                  </Text>
                  <Text size={12} weight="medium" tone="muted" style={{ width: 96, textAlign: "right" }}>
                    Revenue
                  </Text>
                </View>
                {r.top.map((row, i) => (
                  <View
                    key={row.id}
                    style={[
                      { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingVertical: 11 },
                      i < r.top.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                    ]}
                  >
                    <Thumb src={row.image} size={32} fallback={Package} />
                    <Text size={13.5} weight="medium" style={{ flex: 1 }} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text size={13} tabular style={{ width: 38, textAlign: "right" }}>
                      {formatNumber(row.quantity)}
                    </Text>
                    <Text size={13.5} weight="semibold" tabular style={{ width: 96, textAlign: "right" }}>
                      {formatCurrency(row.revenue)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card>
            <CardHeader title="Expenses by category" />
            <CardBody>
              {r.expenseSplit.length === 0 ? (
                <Text size={13} tone="muted" center style={{ paddingVertical: 18 }}>
                  No expenses in this period.
                </Text>
              ) : (
                <DonutChart data={r.expenseSplit.map((row) => ({ label: row.category, value: row.total }))} />
              )}
            </CardBody>
          </Card>

          <SummaryCard
            icon={Users}
            title="Customers"
            rows={[
              { label: "Total customers", value: formatNumber(r.customers.total) },
              { label: "Ordered more than once", value: formatNumber(r.customers.repeat) },
              { label: "Lifetime value", value: formatCurrency(r.customers.spend) },
              {
                label: "Repeat rate",
                value: `${r.customers.total ? Math.round((r.customers.repeat / r.customers.total) * 100) : 0}%`,
              },
            ]}
          />
          <SummaryCard
            icon={Package}
            title="Inventory"
            rows={[
              { label: "Units in stock", value: formatNumber(r.inventory.units) },
              { label: "Value at cost", value: formatCurrency(r.inventory.cost) },
              { label: "Value at retail", value: formatCurrency(r.inventory.retail) },
              { label: "Potential profit", value: formatCurrency(r.inventory.retail - r.inventory.cost) },
            ]}
          />
          <SummaryCard
            icon={TrendingUp}
            title="Website"
            rows={[
              { label: "Visitors", value: formatNumber(r.web.visitors) },
              { label: "Product views", value: formatNumber(r.web.productViews) },
              { label: "Website orders", value: formatNumber(r.web.orders) },
              { label: "Conversion", value: `${r.web.conversionRate.toFixed(1)}%` },
            ]}
          />
        </View>
      )}
    </Page>
  );
}

/** The web reports page's `SummaryCard`: an icon title over label/value pairs. */
function SummaryCard({ icon: Icon, title, rows }: { icon: LucideIcon; title: string; rows: { label: string; value: string }[] }) {
  const { colors: c } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 }}>
        <Icon size={16} color={c.primary} />
        <Text size={15} weight="semibold">
          {title}
        </Text>
      </View>
      <CardBody style={{ gap: 10 }}>
        {rows.map((row) => (
          <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text size={13.5} tone="muted">
              {row.label}
            </Text>
            <Text size={13.5} weight="semibold" tabular>
              {row.value}
            </Text>
          </View>
        ))}
      </CardBody>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} style={{ flexGrow: 1, flexBasis: "46%", padding: 16, gap: 12 }}>
            <Skeleton width={70} height={11} />
            <Skeleton width={110} height={22} />
            <Skeleton width={90} height={11} />
          </Card>
        ))}
      </View>
      <Card style={{ padding: 18, gap: 14 }}>
        <Skeleton width={120} height={14} />
        <Skeleton height={190} />
      </Card>
    </View>
  );
}

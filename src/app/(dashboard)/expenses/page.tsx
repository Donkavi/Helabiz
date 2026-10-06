import type { Metadata } from "next";
import { Types } from "mongoose";
import { Wallet } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Expense } from "@/models/Expense";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/revenue-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageTour } from "@/components/dashboard/tour/tour";
import { formatCurrency, percentChange } from "@/lib/utils";
import { monthStart } from "@/services/metrics-service";
import { ExpensesTable } from "./expenses-table";
import { ExpenseDialog } from "./expense-dialog";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const { businessId } = await requireBusiness();
  await connectDB();

  const thisMonth = monthStart();
  const lastMonth = monthStart(new Date(), 1);

  const [expenses, byCategory, monthTotals] = await Promise.all([
    Expense.find({ businessId }).sort({ date: -1 }).limit(300).lean(),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { businessId: new Types.ObjectId(businessId), date: { $gte: thisMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { businessId: new Types.ObjectId(businessId), date: { $gte: lastMonth } } },
      {
        $group: {
          _id: { $cond: [{ $gte: ["$date", thisMonth] }, "current", "previous"] },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const current = monthTotals.find((m) => m._id === "current")?.total ?? 0;
  const previous = monthTotals.find((m) => m._id === "previous")?.total ?? 0;
  const allTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  const rows = serialize(expenses).map((e) => ({
    id: String(e._id),
    title: e.title,
    category: e.category ?? "other",
    amount: e.amount,
    date: String(e.date),
    notes: e.notes ?? "",
    paymentMethod: e.paymentMethod ?? "cash",
    recurring: Boolean(e.recurring),
  }));

  return (
    <div className="space-y-6">
      <PageTour id="expenses" />
      <PageHeader
        title="Expenses"
        description="Record what your business spends so profit is a real number, not a guess."
        actions={<ExpenseDialog />}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses recorded"
          description="Add rent, salaries, packaging, delivery and anything else you spend on. Profit on your dashboard takes them into account."
          action={<ExpenseDialog />}
        />
      ) : (
        <>
          <div data-tour="expenses-summary" className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="This month"
              value={formatCurrency(current, { decimals: false })}
              change={percentChange(current, previous)}
              sublabel="vs last month"
              invertChange
              icon={Wallet}
              tone="primary"
            />
            <StatCard label="Last month" value={formatCurrency(previous, { decimals: false })} />
            <StatCard label="All time" value={formatCurrency(allTime, { decimals: false })} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <ExpensesTable expenses={rows} />

            <Card data-tour="expenses-chart">
              <CardHeader>
                <CardTitle>Where the money goes</CardTitle>
                <p className="text-[12.5px] text-muted-foreground">This month by category</p>
              </CardHeader>
              <CardContent className="pt-0">
                {byCategory.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-muted-foreground">
                    No expenses recorded this month.
                  </p>
                ) : (
                  <DonutChart data={byCategory.map((c) => ({ label: c._id, value: c.total }))} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

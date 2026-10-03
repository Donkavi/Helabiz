"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES, ExpenseDialog, type ExpenseValues } from "./expense-dialog";
import { deleteExpenseAction } from "./actions";

type ExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
  paymentMethod: string;
  recurring: boolean;
};

export function ExpensesTable({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [editing, setEditing] = React.useState<ExpenseValues | null>(null);
  const [pending, startTransition] = React.useTransition();

  const visible = expenses.filter((expense) => {
    if (category !== "all" && expense.category !== category) return false;
    if (query && !`${expense.title} ${expense.notes}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const total = visible.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card data-tour="expenses-table">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>All expenses</CardTitle>
          <span className="text-[13px] text-muted-foreground">
            {visible.length} shown · {formatCurrency(total, { decimals: false })}
          </span>
        </div>
        <div data-tour="expenses-filters" className="flex flex-wrap gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search expenses"
              className="pl-9"
              aria-label="Search expenses"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Expense</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="pl-5">
                  <p className="text-[13.5px] font-medium">{expense.title}</p>
                  {expense.notes && <p className="text-[12px] text-muted-foreground">{expense.notes}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant="muted" className="capitalize">
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{formatDate(expense.date)}</TableCell>
                <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                  {formatCurrency(expense.amount, { decimals: false })}
                </TableCell>
                <TableCell className="pr-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${expense.title}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setEditing({
                            id: expense.id,
                            title: expense.title,
                            category: expense.category,
                            amount: String(expense.amount),
                            date: expense.date.slice(0, 10),
                            notes: expense.notes,
                            paymentMethod: expense.paymentMethod,
                          })
                        }
                      >
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={pending}
                        onSelect={() =>
                          startTransition(async () => {
                            await deleteExpenseAction(expense.id);
                            toast.success("Expense deleted");
                            router.refresh();
                          })
                        }
                      >
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {visible.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">No expenses match those filters.</p>
        )}
      </CardContent>

      {editing && (
        <ExpenseDialog key={editing.id} expense={editing} open onOpenChange={(next) => !next && setEditing(null)} />
      )}
    </Card>
  );
}

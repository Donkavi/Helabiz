"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveExpenseAction } from "./actions";

export const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "salary", label: "Salary" },
  { value: "marketing", label: "Marketing" },
  { value: "packaging", label: "Packaging" },
  { value: "delivery", label: "Delivery" },
  { value: "inventory", label: "Inventory / stock" },
  { value: "utilities", label: "Utilities" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

export type ExpenseValues = {
  id?: string;
  title: string;
  category: string;
  amount: string;
  date: string;
  notes: string;
  paymentMethod: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY: ExpenseValues = {
  title: "",
  category: "other",
  amount: "",
  date: today(),
  notes: "",
  paymentMethod: "cash",
};

export function ExpenseDialog({
  expense,
  open: controlledOpen,
  onOpenChange,
}: {
  expense?: ExpenseValues;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [values, setValues] = React.useState<ExpenseValues>(expense ?? EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  // Reset when opening rather than in an effect. In controlled mode the parent
  // mounts this with a fresh `key`, so the initial state is already correct.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setValues(expense ?? EMPTY);
      setErrors({});
    }
    setOpen(next);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    if (values.id) data.set("id", values.id);
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "id") data.set(key, String(value ?? ""));
    });

    startTransition(async () => {
      const result = await saveExpenseAction(null, data);
      if (result?.ok === false) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Could not save the expense");
        return;
      }
      toast.success(values.id ? "Expense updated" : "Expense recorded");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            Record expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{values.id ? "Edit expense" : "Record an expense"}</DialogTitle>
            <DialogDescription>Expenses are subtracted from sales to work out your profit.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="expense-title">What was it for? *</Label>
              <Input
                id="expense-title"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                placeholder="Shop rent for March"
                required
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-[12.5px] text-destructive">{errors.title}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Amount (Rs.) *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={values.amount}
                  onChange={(e) => setValues({ ...values, amount: e.target.value })}
                  placeholder="25000"
                  required
                  aria-invalid={!!errors.amount}
                />
                {errors.amount && <p className="text-[12.5px] text-destructive">{errors.amount}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={values.date}
                  onChange={(e) => setValues({ ...values, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expense-category">Category</Label>
                <Select value={values.category} onValueChange={(v) => setValues({ ...values, category: v })}>
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-method">Paid by</Label>
                <Select value={values.paymentMethod} onValueChange={(v) => setValues({ ...values, paymentMethod: v })}>
                  <SelectTrigger id="expense-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea
                id="expense-notes"
                rows={2}
                value={values.notes}
                onChange={(e) => setValues({ ...values, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {values.id ? "Save changes" : "Record expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

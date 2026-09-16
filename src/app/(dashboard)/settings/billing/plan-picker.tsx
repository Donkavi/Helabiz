"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAN_LIST, type Plan } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { changePlanAction } from "../actions";

export function PlanPicker({ currentPlan, canManage }: { currentPlan: string; canManage: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<Plan | null>(null);
  const [pending, startTransition] = React.useTransition();

  const change = () => {
    if (!confirm) return;
    startTransition(async () => {
      const result = await changePlanAction(confirm.id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not change your plan");
        return;
      }
      toast.success(result.message ?? "Plan updated");
      setConfirm(null);
      router.refresh();
    });
  };

  const downgrade = confirm ? PLAN_LIST.findIndex((p) => p.id === confirm.id) < PLAN_LIST.findIndex((p) => p.id === currentPlan) : false;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const active = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5",
                active ? "border-primary ring-2 ring-primary/15" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-semibold">{plan.name}</h3>
                {plan.popular && !active && <span className="text-[11px] font-semibold text-primary">Popular</span>}
                {active && <span className="text-[11px] font-semibold text-primary">Current</span>}
              </div>

              <p className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">
                {plan.price === 0 ? "Free" : formatCurrency(plan.price, { decimals: false })}
                {plan.price > 0 && <span className="text-[13px] font-normal text-muted-foreground">/month</span>}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.slice(0, 6).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-5 w-full"
                variant={active ? "outline" : plan.popular ? "default" : "outline"}
                disabled={active || !canManage}
                onClick={() => setConfirm(plan)}
              >
                {active ? "Current plan" : plan.price === 0 ? "Switch to Free" : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {!canManage && (
        <p className="text-[12.5px] text-muted-foreground">Only the business owner can change the plan.</p>
      )}

      <Dialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {downgrade ? `Move down to ${confirm?.name}?` : `Switch to ${confirm?.name}?`}
            </DialogTitle>
            <DialogDescription>
              {downgrade
                ? "Your data stays exactly where it is. If you are over the new plan's limits you will not be able to add more until you are back under them."
                : confirm?.price
                  ? `Your plan changes immediately and we will contact you about the ${formatCurrency(confirm.price, { decimals: false })} monthly payment.`
                  : "Your plan changes immediately."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={change} loading={pending} variant={downgrade ? "destructive" : "default"}>
              {downgrade ? "Move down" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

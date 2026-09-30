import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_LIST } from "@/lib/plans";
import { formatCurrency, cn } from "@/lib/utils";

/**
 * What each plan includes, with the button that starts one.
 *
 * The button does not change the plan — a plan is bought by depositing against
 * a reference and sending the slip. It preselects the plan in the checkout
 * above and jumps to it, so there is never a control here that could grant
 * paid access without a payment behind it.
 */
export function PlanComparison({
  currentPlan,
  canManage,
  paymentReady,
}: {
  currentPlan: string;
  canManage: boolean;
  /** False when no payment method is configured, so nothing here can be acted on. */
  paymentReady: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What each plan includes</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-4 lg:grid-cols-3">
          {PLAN_LIST.map((plan) => {
            const current = plan.id === currentPlan;
            const paid = plan.price > 0;

            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-2xl border p-5",
                  current ? "border-primary/50 bg-primary-muted/25" : "border-border bg-background",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{plan.name}</h3>
                  {current && <Badge variant="soft">Current</Badge>}
                </div>

                <p className="mt-3 text-[22px] font-semibold tracking-[-0.03em]">
                  {plan.price === 0 ? "Free" : formatCurrency(plan.price, { decimals: false })}
                  <span className="text-[12.5px] font-normal text-muted-foreground">
                    {plan.price === 0 ? " for 7 days" : " /month"}
                  </span>
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {paid ? (
                    <Button
                      className="w-full"
                      variant={current ? "outline" : "default"}
                      disabled={!canManage || !paymentReady}
                      asChild={canManage && paymentReady}
                    >
                      {canManage && paymentReady ? (
                        <Link href={`/settings/billing?plan=${plan.id}#checkout`} scroll>
                          {current ? "Renew this plan" : `Choose ${plan.name}`}
                          <ArrowRight className="size-4" />
                        </Link>
                      ) : (
                        <span>{current ? "Renew this plan" : `Choose ${plan.name}`}</span>
                      )}
                    </Button>
                  ) : (
                    // The trial runs once, so there is nothing to click here.
                    <p className="py-2 text-center text-[12.5px] text-muted-foreground">
                      {current ? "Your trial is running" : "One trial per business"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!paymentReady && (
          <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
            Plans cannot be bought until a payment method is set up.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

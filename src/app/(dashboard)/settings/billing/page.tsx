import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Subscription } from "@/models/Subscription";
import { Payment } from "@/models/Payment";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { usageFor } from "@/services/limits-service";
import { UNLIMITED, limitLabel } from "@/lib/plans";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlanPicker } from "./plan-picker";

export const metadata: Metadata = { title: "Plan & billing" };

export default async function BillingPage() {
  const { business, businessId, role } = await requireBusiness();
  await connectDB();

  const [usage, subscription, payments] = await Promise.all([
    usageFor(businessId),
    Subscription.findOne({ businessId }).lean(),
    Payment.find({ businessId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const meters = [
    { label: "Orders this month", ...usage.orders },
    { label: "Products", ...usage.products },
    { label: "Website pages", ...usage.pages },
    { label: "Staff accounts", ...usage.team },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[22px] font-semibold">{usage.plan.name}</span>
            <Badge variant={usage.plan.price === 0 ? "muted" : "success"}>
              {usage.plan.price === 0 ? "Free forever" : `${formatCurrency(usage.plan.price, { decimals: false })}/month`}
            </Badge>
            {subscription?.currentPeriodEnd && usage.plan.price > 0 && (
              <span className="text-[13px] text-muted-foreground">
                Renews {formatDate(subscription.currentPeriodEnd as unknown as string, "long")}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13.5px] text-muted-foreground">{usage.plan.description}</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {meters.map((meter) => {
              const unlimited = meter.limit === UNLIMITED;
              const percent = unlimited ? 0 : Math.min(100, (meter.used / Math.max(meter.limit, 1)) * 100);
              const near = !unlimited && percent >= 80;
              return (
                <div key={meter.label}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="text-muted-foreground">{meter.label}</span>
                    <span className="font-medium tabular-nums">
                      {meter.used} / {limitLabel(meter.limit)}
                    </span>
                  </div>
                  <Progress
                    value={unlimited ? 0 : percent}
                    className="mt-2"
                    indicatorClassName={near ? "bg-warning" : undefined}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <PlanPicker currentPlan={business.plan ?? "free"} canManage={role === "owner"} />

      <Card>
        <CardHeader>
          <CardTitle>Billing history</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {payments.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Nothing billed yet — you are on the free plan.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {serialize(payments).map((payment) => (
                <li key={String(payment._id)} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{payment.reference ?? "Subscription"}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {formatDate(payment.createdAt as unknown as string, "long")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      payment.status === "succeeded" ? "success" : payment.status === "failed" ? "destructive" : "warning"
                    }
                  >
                    {payment.status}
                  </Badge>
                  <p className="w-24 shrink-0 text-right text-[13.5px] font-semibold tabular-nums">
                    {formatCurrency(payment.amount, { decimals: false })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 rounded-lg bg-muted/60 p-3 text-[12.5px] leading-relaxed text-muted-foreground">
            No payment provider is connected on this installation. Plan changes are recorded against your business and a
            pending payment is created, which is what a gateway would settle. Subscriptions, payments and plan limits
            are all in place behind that seam.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

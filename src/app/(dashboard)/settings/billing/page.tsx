import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Payment } from "@/models/Payment";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { usageFor } from "@/services/limits-service";
import { lastRejectedPaymentFor, openPaymentFor } from "@/services/subscription-service";
import { UNLIMITED, limitLabel } from "@/lib/plans";
import { accessInfo, TRIAL_DAYS } from "@/lib/access";
import { bankDetails } from "@/lib/bank";
import { activeAddons, addonStatuses, isAddonId } from "@/lib/addons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BankTransferPanel, type OpenPayment } from "@/components/billing/bank-transfer-panel";
import { PlanComparison } from "./plan-comparison";
import { AddonStatusCard } from "./addon-status";

export const metadata: Metadata = { title: "Plan & billing" };

/** The badge beside the plan name, which is the whole story in three words. */
function accessBadge(access: ReturnType<typeof accessInfo>) {
  switch (access.state) {
    case "trial_available":
      return { variant: "muted" as const, label: `${TRIAL_DAYS}-day trial` };
    case "trial_expired":
      return { variant: "destructive" as const, label: "Trial ended" };
    case "plan_expired":
      return { variant: "destructive" as const, label: "Plan ended" };
    case "trial_active":
    case "plan_active":
      if (!access.endsAt) return { variant: "success" as const, label: "Active" };
      return {
        variant: access.isEnding ? ("warning" as const) : ("success" as const),
        label: access.daysLeft === 1 ? "Last day" : `${access.daysLeft} days left`,
      };
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; addons?: string }>;
}) {
  const { business, businessId, role } = await requireBusiness();
  const params = await searchParams;
  const requestedPlan = params.plan;
  // Arrives as a comma-separated list, e.g. straight from building a website.
  const requestedAddons = (params.addons ?? "").split(",").map((id) => id.trim()).filter(isAddonId);
  await connectDB();

  const [usage, payments, open, rejected] = await Promise.all([
    usageFor(businessId),
    Payment.find({ businessId }).sort({ createdAt: -1 }).limit(10).lean(),
    openPaymentFor(businessId),
    lastRejectedPaymentFor(businessId),
  ]);

  const bank = bankDetails();
  const access = accessInfo(business);
  const live = [...activeAddons(business)];
  const addons = addonStatuses(business);
  const badge = accessBadge(access);
  const openRow = open ? (serialize(open) as Record<string, unknown>) : null;
  const rejectedRow = rejected ? (serialize(rejected) as Record<string, unknown>) : null;

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
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {usage.plan.price > 0 && (
              <Badge variant="muted">{formatCurrency(usage.plan.price, { decimals: false })}/month</Badge>
            )}
            {access.endsAt && (
              <span className="text-[13px] text-muted-foreground">
                {access.locked ? "Ended" : "Ends"} {formatDate(access.endsAt.toISOString(), "long")}
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

      <Card id="checkout" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>{access.isTrial ? "Choose a plan" : "Renew or change plan"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <BankTransferPanel
            bank={bank}
            canManage={role === "owner"}
            initialPlan={access.isTrial ? undefined : (business.plan ?? undefined)}
            requestedPlan={requestedPlan === "starter" || requestedPlan === "business" ? requestedPlan : undefined}
            activeAddons={live}
            requestedAddons={requestedAddons}
            // A shop already inside a paid month can buy add-ons on their own.
            planOptional={access.state === "plan_active"}
            open={
              openRow
                ? ({
                    id: String(openRow._id),
                    reference: String(openRow.reference ?? ""),
                    amount: Number(openRow.amount ?? 0),
                    plan: String(openRow.plan ?? "starter"),
                    addons: Array.isArray(openRow.addons) ? (openRow.addons as string[]) : [],
                    status: String(openRow.status ?? "pending"),
                    slipName: openRow.slipName ? String(openRow.slipName) : undefined,
                  } satisfies OpenPayment)
                : null
            }
            rejected={
              rejectedRow
                ? { reference: String(rejectedRow.reference ?? ""), note: String(rejectedRow.reviewNote ?? "") }
                : null
            }
          />
        </CardContent>
      </Card>

      <AddonStatusCard statuses={addons} />

      <PlanComparison
        currentPlan={business.plan ?? "free"}
        canManage={role === "owner"}
        paymentReady={Boolean(bank)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Billing history</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {payments.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Nothing billed yet — you are on the free trial.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {serialize(payments).map((payment) => (
                <li key={String(payment._id)} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{payment.reference ?? "Subscription"}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {formatDate(payment.createdAt as unknown as string, "long")}
                      {payment.reviewNote ? ` · ${payment.reviewNote}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      payment.status === "succeeded"
                        ? "success"
                        : payment.status === "failed"
                          ? "destructive"
                          : payment.status === "review"
                            ? "info"
                            : "warning"
                    }
                  >
                    {payment.status === "review" ? "checking" : payment.status}
                  </Badge>
                  <p className="w-24 shrink-0 text-right text-[13.5px] font-semibold tabular-nums">
                    {formatCurrency(payment.amount, { decimals: false })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

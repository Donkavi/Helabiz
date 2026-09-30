import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { accessInfo, TRIAL_DAYS } from "@/lib/access";
import { serialize } from "@/lib/db/mongoose";
import { bankDetails } from "@/lib/bank";
import { getPlan } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { lastRejectedPaymentFor, openPaymentFor } from "@/services/subscription-service";
import { BankTransferPanel, type OpenPayment } from "@/components/billing/bank-transfer-panel";
import { TrialShell } from "../trial/trial-shell";

export const metadata: Metadata = { title: "Renew to reopen", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Where the gate sends a business that has lost access — a trial that ran out
 * or a paid month that lapsed.
 *
 * It carries the whole payment flow itself rather than linking to billing,
 * because billing lives inside the dashboard layout, and that layout calls
 * the very gate that sent the owner here.
 */
export default async function RenewPage() {
  const { business, businessId, role } = await requireBusiness(undefined, { allowLocked: true });
  const access = accessInfo(business);

  // Sorted out already, by another tab or an approved payment.
  if (!access.locked) redirect("/dashboard");
  if (access.state === "trial_available") redirect("/trial");

  const [open, rejected] = await Promise.all([openPaymentFor(businessId), lastRejectedPaymentFor(businessId)]);
  const openRow = open ? (serialize(open) as Record<string, unknown>) : null;
  const rejectedRow = rejected ? (serialize(rejected) as Record<string, unknown>) : null;

  const wasTrial = access.state === "trial_expired";
  const planName = getPlan(business.plan).name;
  const endedOn = access.endsAt ? formatDate(access.endsAt.toISOString(), "long") : null;

  return (
    <TrialShell
      tone="warning"
      eyebrow={wasTrial ? `${TRIAL_DAYS}-day trial ended` : `${planName} plan ended`}
      icon={<Clock className="size-5" />}
      title={`${business.name} is paused`}
      lede={
        (wasTrial
          ? endedOn
            ? `Your free trial ended on ${endedOn}, so the dashboard and your website are closed for now. `
            : "Your free trial has ended, so the dashboard and your website are closed for now. "
          : endedOn
            ? `Your ${planName} plan ran out on ${endedOn}, so the dashboard and your website are closed for now. `
            : `Your ${planName} plan has run out, so the dashboard and your website are closed for now. `) +
        "Nothing has been deleted — your products, orders and customers are all still here, waiting."
      }
      wide
    >
      <div className="mt-7">
        <BankTransferPanel
          bank={bankDetails()}
          canManage={role === "owner"}
          initialPlan={wasTrial ? undefined : (business.plan ?? undefined)}
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
      </div>
    </TrialShell>
  );
}

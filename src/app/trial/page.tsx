import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { accessInfo, TRIAL_DAYS } from "@/lib/access";
import { PLANS } from "@/lib/plans";
import { ActivateTrialForm } from "./activate-form";
import { TrialShell, TrialFeatureList } from "./trial-shell";

export const metadata: Metadata = { title: "Start your free trial", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Where the gate sends a business whose trial has not been activated yet. */
export default async function TrialPage() {
  const { business, role } = await requireBusiness(undefined, { allowLocked: true });
  const info = accessInfo(business);

  // Already sorted out, by another tab or by a payment — don't show a dead end.
  if (!info.locked) redirect("/dashboard");
  if (info.state !== "trial_available") redirect("/renew");

  const isOwner = role === "owner";

  return (
    <TrialShell
      eyebrow={`${TRIAL_DAYS} days, everything included`}
      icon={<Sparkles className="size-5" />}
      title={`${business.name} is ready to go`}
      lede={
        isOwner
          ? `Start your free trial and the whole of Helabiz opens up for ${TRIAL_DAYS} days — the website builder, your published shop and every business tool. Choose a plan before it ends to keep going.`
          : `The owner of ${business.name} needs to start the free trial before the dashboard opens up.`
      }
    >
      <TrialFeatureList items={PLANS.free.features} />
      <ActivateTrialForm canActivate={isOwner} />
    </TrialShell>
  );
}

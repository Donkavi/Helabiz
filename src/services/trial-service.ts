import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Subscription } from "@/models/Subscription";
import { accessInfo, trialEndFrom } from "@/lib/access";

export type ActivateResult =
  | { ok: true; endsAt: Date }
  | { ok: false; error: string };

/**
 * Starts the one-month (30-day) trial for a business.
 *
 * Activation is once per business and is written with a filter that requires
 * `trialStartedAt` to be unset, so two clicks (or two tabs) cannot extend a
 * trial by restarting it. The subscription row is mirrored to `trialing` so
 * billing screens and the admin panel read the same story.
 */
export async function activateTrial(businessId: string): Promise<ActivateResult> {
  await connectDB();

  const business = await Business.findById(businessId).select("plan trialStartedAt trialEndsAt status").lean();
  if (!business) return { ok: false, error: "Business not found" };
  if (business.status === "suspended") return { ok: false, error: "This business is suspended" };

  const info = accessInfo(business);
  if (!info.isTrial) return { ok: false, error: "You are already on a paid plan" };
  if (info.state === "trial_active") return { ok: true, endsAt: info.endsAt! };
  if (info.state === "trial_expired") return { ok: false, error: "This trial has already been used" };

  const startedAt = new Date();
  const endsAt = trialEndFrom(startedAt);

  const claimed = await Business.findOneAndUpdate(
    { _id: businessId, trialStartedAt: { $exists: false } },
    { trialStartedAt: startedAt, trialEndsAt: endsAt },
    { returnDocument: "after" },
  ).lean();

  // Someone else won the race — report whatever their activation set.
  if (!claimed) {
    const current = await Business.findById(businessId).select("plan trialEndsAt planEndsAt").lean();
    const settled = current ? accessInfo(current) : null;
    return settled?.endsAt ? { ok: true, endsAt: settled.endsAt } : { ok: false, error: "Could not start the trial" };
  }

  await Subscription.findOneAndUpdate(
    { businessId },
    {
      businessId,
      plan: "free",
      status: "trialing",
      currentPeriodStart: startedAt,
      currentPeriodEnd: endsAt,
      provider: "manual",
    },
    { upsert: true },
  );

  return { ok: true, endsAt };
}

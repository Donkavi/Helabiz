import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Notification } from "@/models/Notification";
import { Payment } from "@/models/Payment";
import { Subscription } from "@/models/Subscription";
import { PLANS } from "@/lib/plans";
import { PLAN_DAYS, planEndFrom } from "@/lib/access";
import { ADDONS, addonEndFrom, addonsTotal, isAddonId, type AddonId } from "@/lib/addons";
import type { PlanId } from "@/types";

export type PaidPlanId = Exclude<PlanId, "free">;

export function isPaidPlan(plan: string): plan is PaidPlanId {
  return plan === "starter" || plan === "business";
}

/**
 * A short, human reference the depositor can write on the slip and an
 * administrator can match against it. Not a secret — just legible.
 */
function reference() {
  return `HB-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Opens a subscription payment: the record an owner is about to deposit
 * against. It buys nothing until an administrator approves the slip.
 *
 * A basket is a plan, a set of website add-ons, or both — a shop already on
 * Business buying chat has no plan attached. An unpaid request for exactly the
 * same basket is reused rather than piling up a row every time the checkout
 * screen is opened, so the reference on screen keeps matching the deposit.
 */
export type Basket = { plan?: PaidPlanId | null; addons?: readonly string[] };

function sameBasket(row: { plan?: string | null; addons?: string[] | null }, basket: Basket) {
  if ((row.plan ?? null) !== (basket.plan ?? null)) return false;
  const a = [...(row.addons ?? [])].sort();
  const b = [...(basket.addons ?? [])].filter(isAddonId).sort();
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

export function basketTotal(basket: Basket) {
  return (basket.plan ? PLANS[basket.plan].price : 0) + addonsTotal(basket.addons ?? []);
}

export async function startSubscriptionPayment(businessId: string, basket: Basket) {
  await connectDB();

  const addons = [...new Set((basket.addons ?? []).filter(isAddonId))];
  const amount = basketTotal({ plan: basket.plan, addons });
  if (amount <= 0) throw new Error("A payment must buy at least one thing");

  const open = await Payment.find({
    businessId,
    kind: "subscription",
    status: { $in: ["pending", "review"] },
  })
    .sort({ createdAt: -1 })
    .lean();
  const match = open.find((row) => sameBasket(row, { plan: basket.plan, addons }));
  if (match) return match;

  return (
    await Payment.create({
      businessId,
      kind: "subscription",
      plan: basket.plan ?? undefined,
      addons,
      reference: reference(),
      amount,
      currency: "LKR",
      provider: "bank_transfer",
      status: "pending",
    })
  ).toObject();
}

/** Files a deposit slip against a payment and puts it in the review queue. */
export async function attachSlip(
  paymentId: string,
  businessId: string,
  slip: { url: string; ref?: string; name: string },
) {
  await connectDB();

  const payment = await Payment.findOne({ _id: paymentId, businessId, kind: "subscription" });
  if (!payment) return { ok: false as const, error: "That payment could not be found" };
  if (payment.status === "succeeded") return { ok: false as const, error: "That payment is already settled" };

  payment.slipUrl = slip.url;
  payment.slipRef = slip.ref;
  payment.slipName = slip.name;
  payment.slipUploadedAt = new Date();
  payment.status = "review";
  payment.reviewNote = undefined;
  await payment.save();

  return { ok: true as const };
}

/**
 * Approves a payment: the single place a business gains paid access.
 *
 * The period extends from whatever is left rather than from today, so paying
 * before the end never costs the remaining days, and the denormalised
 * `planEndsAt` on the business is what the authorization gate reads.
 */
export async function approvePayment(paymentId: string, adminId: string) {
  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) return { ok: false as const, error: "That payment could not be found" };
  if (payment.status === "succeeded") return { ok: false as const, error: "That payment is already approved" };
  const boughtAddons = [...new Set((payment.addons ?? []).filter(isAddonId))] as AddonId[];
  const boughtPlan = payment.plan && isPaidPlan(payment.plan) ? payment.plan : null;
  if (!boughtPlan && boughtAddons.length === 0) {
    return { ok: false as const, error: "That payment does not buy a plan or any add-ons" };
  }

  const businessId = String(payment.businessId);
  const business = await Business.findById(businessId).select("plan planEndsAt addons name").lean();
  if (!business) return { ok: false as const, error: "That business no longer exists" };

  const set: Record<string, unknown> = {};
  let endsAt: Date | undefined;

  if (boughtPlan) {
    // Only extend an unexpired period if it is for the same plan; changing
    // plan starts a fresh month rather than inheriting the old one.
    const samePlan = business.plan === boughtPlan;
    endsAt = planEndFrom(samePlan ? business.planEndsAt : null);
    set.plan = boughtPlan;
    set.planEndsAt = endsAt;
  }

  if (boughtAddons.length) {
    // Each add-on keeps its own period, extended from whatever is left of it.
    const rows = [...(business.addons ?? [])].map((row) => ({ ...row }));
    for (const id of boughtAddons) {
      const existing = rows.find((row) => row.id === id);
      const until = addonEndFrom(existing?.endsAt);
      if (existing) existing.endsAt = until;
      else rows.push({ id, startedAt: new Date(), endsAt: until } as never);
    }
    set.addons = rows;
  }

  await Business.updateOne({ _id: businessId }, { $set: set });

  if (boughtPlan && endsAt) {
    await Subscription.findOneAndUpdate(
      { businessId },
      {
        businessId,
        plan: boughtPlan,
        status: "active",
        interval: "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd: endsAt,
        provider: "bank_transfer",
        providerRef: payment.reference,
      },
      { upsert: true },
    );
  }

  payment.status = "succeeded";
  payment.reviewedAt = new Date();
  payment.reviewedBy = adminId as never;
  await payment.save();

  const bought = [
    boughtPlan ? `the ${PLANS[boughtPlan].name} plan` : null,
    ...boughtAddons.map((id) => ADDONS[id].name),
  ].filter(Boolean) as string[];

  await Notification.create({
    businessId,
    title: bought.length === 1 ? `${bought[0]} is active` : "Your payment was received",
    body:
      `Your payment was received and ${bought.join(", ")} ${bought.length === 1 ? "is" : "are"} now active ` +
      `for ${PLAN_DAYS} days.`,
    href: "/settings/billing",
  });

  return { ok: true as const, endsAt, plan: boughtPlan, addons: boughtAddons };
}

/** Rejects a payment, with a reason the owner will see on their billing screen. */
export async function rejectPayment(paymentId: string, adminId: string, note: string) {
  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) return { ok: false as const, error: "That payment could not be found" };
  if (payment.status === "succeeded") {
    return { ok: false as const, error: "That payment is already approved — refund it instead" };
  }

  payment.status = "failed";
  payment.reviewedAt = new Date();
  payment.reviewedBy = adminId as never;
  payment.reviewNote = note;
  await payment.save();

  await Notification.create({
    businessId: String(payment.businessId),
    title: "We could not confirm your payment",
    body: note,
    href: "/settings/billing",
  });

  return { ok: true as const };
}

/** The subscription payment an owner currently has in flight, if any. */
export async function openPaymentFor(businessId: string) {
  await connectDB();
  return Payment.findOne({ businessId, kind: "subscription", status: { $in: ["pending", "review"] } })
    .sort({ createdAt: -1 })
    .lean();
}

/** The most recent rejected payment, so the owner is told why. */
export async function lastRejectedPaymentFor(businessId: string) {
  await connectDB();
  return Payment.findOne({ businessId, kind: "subscription", status: "failed" }).sort({ reviewedAt: -1 }).lean();
}

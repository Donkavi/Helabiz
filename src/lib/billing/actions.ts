"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { getStorage, UploadError } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { attachSlip, isPaidPlan, startSubscriptionPayment } from "@/services/subscription-service";
import { isAddonId } from "@/lib/addons";

/**
 * The checkout actions.
 *
 * Every one passes `allowLocked`, because paying is exactly what a business
 * whose trial or plan has lapsed needs to do, and the ordinary gate would
 * bounce the action that unlocks them.
 */

export type StartedPayment = {
  id: string;
  reference: string;
  amount: number;
  plan: string;
  addons: string[];
  status: string;
};

/**
 * Opens a deposit for a basket: a plan, some add-ons, or both. An owner
 * already on a paid plan can buy chat on its own, so the plan is optional.
 */
export async function startPaymentAction(input: { plan?: string | null; addons?: string[] }) {
  const { businessId, role } = await requireBusiness(undefined, { allowLocked: true });
  if (role !== "owner") return { ok: false as const, error: "Only the business owner can change the plan." };

  const plan = input.plan && isPaidPlan(input.plan) ? input.plan : null;
  const addons = [...new Set((input.addons ?? []).filter(isAddonId))];
  if (!plan && addons.length === 0) return { ok: false as const, error: "Choose a plan or an add-on." };

  const payment = await startSubscriptionPayment(businessId, { plan, addons });
  const row = serialize(payment) as Record<string, unknown>;

  return {
    ok: true as const,
    payment: {
      id: String(row._id),
      reference: String(row.reference ?? ""),
      amount: Number(row.amount ?? 0),
      plan: row.plan ? String(row.plan) : "",
      addons: Array.isArray(row.addons) ? (row.addons as string[]) : [],
      status: String(row.status ?? "pending"),
    } satisfies StartedPayment,
  };
}

export async function uploadSlipAction(formData: FormData) {
  const { businessId, role, user } = await requireBusiness(undefined, { allowLocked: true });
  if (role !== "owner") return { ok: false as const, error: "Only the business owner can send a payment slip." };

  const limited = await rateLimit(`slip:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) return { ok: false as const, error: "Too many uploads. Please wait a moment." };

  const paymentId = String(formData.get("paymentId") ?? "");
  const file = formData.get("slip");
  if (!paymentId) return { ok: false as const, error: "That payment could not be found" };
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "Choose the slip to upload." };

  await connectDB();

  try {
    const stored = await getStorage().put({ businessId, file, kind: "slip" });
    const result = await attachSlip(paymentId, businessId, {
      url: stored.url,
      ref: stored.ref,
      name: stored.name,
    });
    if (!result.ok) return result;
  } catch (error) {
    if (error instanceof UploadError) return { ok: false as const, error: error.message };
    throw error;
  }

  revalidatePath("/settings/billing");
  return { ok: true as const };
}

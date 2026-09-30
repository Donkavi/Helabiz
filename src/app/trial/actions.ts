"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/permissions";
import { activateTrial } from "@/services/trial-service";

/**
 * Starts the trial for the signed-in owner's business.
 *
 * `allowLocked` is essential: the whole point of the screen calling this is
 * that the caller is locked out, so the ordinary gate would bounce the very
 * action that unlocks them.
 */
export async function activateTrialAction() {
  const { businessId, role } = await requireBusiness(undefined, { allowLocked: true });
  if (role !== "owner") return { ok: false as const, error: "Only the business owner can start the trial." };

  const result = await activateTrial(businessId);
  if (!result.ok) return { ok: false as const, error: result.error };

  revalidatePath("/dashboard", "layout");
  return { ok: true as const };
}

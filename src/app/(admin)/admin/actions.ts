"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertSuperAdmin, recordAdminAction } from "@/lib/permissions/admin";
import { AccessError } from "@/lib/permissions";
import {
  adminCount,
  businessDetail,
  setBusinessPlan,
  setBusinessStatus,
  setPlatformRole,
} from "@/services/admin-service";
import type { PlanId } from "@/types";

/**
 * Every action here re-checks the gate.
 *
 * The admin layout already redirects non-admins, but a server action is a
 * public HTTP endpoint that anyone can post to — the layout never runs for it.
 * `assertSuperAdmin()` on the first line of each is what actually protects the
 * platform.
 */

export type AdminResult = { ok: true; message: string } | { ok: false; error: string };

const planSchema = z.enum(["free", "starter", "business"]);
const idSchema = z.string().regex(/^[0-9a-f]{24}$/i, "Unknown id");

function failed(error: unknown): AdminResult {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
  console.error("[admin]", error);
  return { ok: false, error: "Something went wrong" };
}

export async function changePlanAction(businessId: string, plan: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);
    const next = planSchema.parse(plan) as PlanId;

    const before = await businessDetail(id);
    if (!before) return { ok: false, error: "That business no longer exists" };
    if (before.plan === next) return { ok: true, message: `${before.name} is already on ${next}.` };

    await setBusinessPlan(id, next);
    await recordAdminAction(admin, "plan.change", {
      businessId: id,
      entity: "business",
      entityId: id,
      meta: { from: before.plan, to: next, business: before.name },
    });

    revalidatePath("/admin", "layout");
    return { ok: true, message: `${before.name} moved to the ${next} plan.` };
  } catch (error) {
    return failed(error);
  }
}

export async function suspendBusinessAction(businessId: string, reason: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);
    const note = z.string().trim().min(3, "Give a reason — it is shown to the owner").max(300).parse(reason);

    const before = await businessDetail(id);
    if (!before) return { ok: false, error: "That business no longer exists" };

    await setBusinessStatus(id, "suspended", note);
    await recordAdminAction(admin, "business.suspend", {
      businessId: id,
      entity: "business",
      entityId: id,
      meta: { business: before.name, reason: note },
    });

    revalidatePath("/admin", "layout");
    return { ok: true, message: `${before.name} is suspended. Its dashboard and public site are now closed.` };
  } catch (error) {
    return failed(error);
  }
}

export async function restoreBusinessAction(businessId: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);

    const before = await businessDetail(id);
    if (!before) return { ok: false, error: "That business no longer exists" };

    await setBusinessStatus(id, "active");
    await recordAdminAction(admin, "business.restore", {
      businessId: id,
      entity: "business",
      entityId: id,
      meta: { business: before.name },
    });

    revalidatePath("/admin", "layout");
    return { ok: true, message: `${before.name} is active again.` };
  } catch (error) {
    return failed(error);
  }
}

export async function setPlatformRoleAction(userId: string, role: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(userId);
    const next = z.enum(["user", "admin"]).parse(role);

    // Two guards worth having: an admin cannot quietly demote themselves out of
    // the panel, and the platform must never end up with no administrator.
    if (id === admin.id && next === "user") {
      return { ok: false, error: "You cannot remove your own administrator access" };
    }
    if (next === "user" && (await adminCount()) <= 1) {
      return { ok: false, error: "That is the last administrator — promote someone else first" };
    }

    await setPlatformRole(id, next);
    await recordAdminAction(admin, next === "admin" ? "user.promote" : "user.demote", {
      entity: "user",
      entityId: id,
    });

    revalidatePath("/admin", "layout");
    return { ok: true, message: next === "admin" ? "Administrator access granted." : "Administrator access removed." };
  } catch (error) {
    return failed(error);
  }
}

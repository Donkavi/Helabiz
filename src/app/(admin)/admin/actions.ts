"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertSuperAdmin, recordAdminAction } from "@/lib/permissions/admin";
import { AccessError } from "@/lib/permissions";
import {
  adminCount,
  businessDetail,
  businessesOwnedBy,
  deleteBusinessCascade,
  deleteUser,
  emailTaken,
  setBusinessPlan,
  setBusinessStatus,
  setPlatformRole,
  setUserStatus,
  slugTaken,
  updateBusiness,
  updateUser,
} from "@/services/admin-service";
import { approvePayment, rejectPayment } from "@/services/subscription-service";
import { ADDONS } from "@/lib/addons";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { slugify } from "@/lib/utils";
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

/* ── Editing ──────────────────────────────────────────────────────────── */

const optional = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal("").transform(() => undefined));

const businessSchema = z.object({
  name: z.string().trim().min(2, "Give the business a name").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "The web address needs at least two characters")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  type: optional,
  phone: optional,
  email: z
    .string()
    .trim()
    .email("That email does not look right")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  address: optional,
  city: optional,
  district: optional,
});

export async function updateBusinessAction(businessId: string, form: unknown): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);
    const values = businessSchema.parse(form);

    const before = await businessDetail(id);
    if (!before) return { ok: false, error: "That business no longer exists" };

    // The slug is the public web address, so a clash would break another shop.
    const slug = slugify(values.slug);
    if (await slugTaken(slug, id)) return { ok: false, error: `Another business already uses /${slug}` };

    await updateBusiness(id, { ...values, slug });
    await recordAdminAction(admin, "business.edit", {
      businessId: id,
      entity: "business",
      entityId: id,
      meta: {
        business: before.name,
        ...(before.slug !== slug ? { slugFrom: before.slug, slugTo: slug } : {}),
      },
    });

    revalidatePath("/admin", "layout");
    if (before.slug !== slug) revalidatePath("/site", "layout");
    return {
      ok: true,
      message:
        before.slug === slug ? "Saved." : `Saved. The public address is now /${slug} — the old one stops working.`,
    };
  } catch (error) {
    return failed(error);
  }
}

const userSchema = z.object({
  name: z.string().trim().min(2, "Give the person a name").max(120),
  email: z.string().trim().email("That email does not look right"),
  phone: optional,
});

export async function updateUserAction(userId: string, form: unknown): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(userId);
    const values = userSchema.parse(form);

    // The email is the sign-in identity, so a duplicate would lock someone out.
    if (await emailTaken(values.email, id)) return { ok: false, error: "Another account already uses that email" };

    await updateUser(id, values);
    await recordAdminAction(admin, "user.edit", { entity: "user", entityId: id, meta: { email: values.email } });

    revalidatePath("/admin", "layout");
    return { ok: true, message: "Saved." };
  } catch (error) {
    return failed(error);
  }
}

/* ── Status ───────────────────────────────────────────────────────────── */

export async function setUserStatusAction(userId: string, status: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(userId);
    const next = z.enum(["active", "disabled"]).parse(status);

    if (id === admin.id && next === "disabled") {
      return { ok: false, error: "You cannot disable your own account" };
    }

    await connectDB();
    const target = await User.findById(id).select("name email platformRole").lean();
    if (!target) return { ok: false, error: "That account no longer exists" };
    if (next === "disabled" && target.platformRole === "admin") {
      return { ok: false, error: "Remove their administrator access first" };
    }

    await setUserStatus(id, next);
    await recordAdminAction(admin, next === "disabled" ? "user.disable" : "user.enable", {
      entity: "user",
      entityId: id,
      meta: { email: target.email },
    });

    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message:
        next === "disabled"
          ? `${target.name} can no longer sign in. Existing sessions stop working too.`
          : `${target.name} can sign in again.`,
    };
  } catch (error) {
    return failed(error);
  }
}

/* ── Deleting ─────────────────────────────────────────────────────────── */

export async function deleteBusinessAction(businessId: string, confirmation: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);

    const before = await businessDetail(id);
    if (!before) return { ok: false, error: "That business no longer exists" };

    // Typed confirmation, checked on the server: the dialog can be bypassed.
    if (confirmation.trim() !== before.name) {
      return { ok: false, error: "The name you typed does not match" };
    }

    // Audit first. If the delete half-fails there is still a record of the
    // attempt, and the counts describe what was there.
    await recordAdminAction(admin, "business.delete", {
      entity: "business",
      entityId: id,
      meta: {
        business: before.name,
        slug: before.slug,
        orders: before.counts.orders,
        products: before.counts.products,
        customers: before.counts.customers,
        ownerEmail: before.owner?.email,
      },
    });

    const report = await deleteBusinessCascade(id);
    const removed = report.reduce((sum, row) => sum + row.removed, 0);

    revalidatePath("/admin", "layout");
    revalidatePath("/site", "layout");
    return { ok: true, message: `${before.name} deleted — ${removed} records removed.` };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteUserAction(userId: string, confirmation: string): Promise<AdminResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(userId);

    if (id === admin.id) return { ok: false, error: "You cannot delete your own account" };

    await connectDB();
    const target = await User.findById(id).select("name email platformRole").lean();
    if (!target) return { ok: false, error: "That account no longer exists" };
    if (confirmation.trim().toLowerCase() !== target.email.toLowerCase()) {
      return { ok: false, error: "The email you typed does not match" };
    }
    if (target.platformRole === "admin") {
      return { ok: false, error: "Remove their administrator access first" };
    }

    // Refused rather than cascaded: deleting an owner would orphan a live shop
    // with its orders and customers. Delete or reassign the business first.
    const owned = await businessesOwnedBy(id);
    if (owned.length) {
      return {
        ok: false,
        error: `They still own ${owned.map((b) => b.name).join(", ")}. Delete those first.`,
      };
    }

    await recordAdminAction(admin, "user.delete", {
      entity: "user",
      entityId: id,
      meta: { email: target.email, name: target.name },
    });
    await deleteUser(id);

    revalidatePath("/admin", "layout");
    return { ok: true, message: `${target.name} deleted.` };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Confirming a deposit.
 *
 * This is the only path by which a business gains paid access, so like every
 * other action here it re-checks the gate and leaves an audit entry naming
 * the administrator who decided.
 */
export async function approvePaymentAction(paymentId: string): Promise<AdminResult> {
  const admin = await assertSuperAdmin();
  const parsed = idSchema.safeParse(paymentId);
  if (!parsed.success) return { ok: false, error: "Unknown payment" };

  const result = await approvePayment(parsed.data, admin.id);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAdminAction(admin, "payment.approve", {
    entity: "payment",
    entityId: parsed.data,
    meta: { plan: result.plan, addons: result.addons, endsAt: result.endsAt?.toISOString() },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin");

  // An add-ons-only payment has no plan period to report.
  const bought = [result.plan ? `the ${result.plan} plan` : null, ...result.addons.map((id) => ADDONS[id].name)]
    .filter(Boolean)
    .join(", ");
  return {
    ok: true,
    message: result.endsAt ? `Approved — ${bought}, until ${result.endsAt.toDateString()}.` : `Approved — ${bought}.`,
  };
}

export async function rejectPaymentAction(paymentId: string, note: string): Promise<AdminResult> {
  const admin = await assertSuperAdmin();
  const parsed = idSchema.safeParse(paymentId);
  if (!parsed.success) return { ok: false, error: "Unknown payment" };

  const reason = note.trim();
  // The owner sees this verbatim, so an empty one would be worse than useless.
  if (reason.length < 4) return { ok: false, error: "Give a reason the owner can act on." };

  const result = await rejectPayment(parsed.data, admin.id, reason);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAdminAction(admin, "payment.reject", {
    entity: "payment",
    entityId: parsed.data,
    meta: { note: reason },
  });

  revalidatePath("/admin/payments");
  return { ok: true, message: "Marked as not confirmed. The owner has been told why." };
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Business, type BusinessDoc } from "@/models/Business";
import { BusinessMember } from "@/models/BusinessMember";
import { User } from "@/models/User";
import { accessInfo, accessRedirect } from "@/lib/access";
import type { BusinessRole } from "@/types";

export const ACTIVE_BUSINESS_COOKIE = "helabiz.business";

export class AccessError extends Error {
  constructor(message = "You do not have access to this business") {
    super(message);
    this.name = "AccessError";
  }
}

export type SessionUser = { id: string; name: string; email: string; image?: string };

/** Returns the signed-in user or redirects to sign-in. Every dashboard entry point uses this. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
  };
}

/** All businesses the user owns or is a member of. */
export async function listUserBusinesses(userId: string) {
  await connectDB();
  const memberships = await BusinessMember.find({ userId, status: "active" }).select("businessId role").lean();
  const ids = memberships.map((m) => String(m.businessId));
  const businesses = await Business.find({ _id: { $in: ids } } as never).sort({ createdAt: 1 }).lean();
  const roleById = new Map(memberships.map((m) => [String(m.businessId), m.role as BusinessRole]));
  return businesses.map((b) => ({ ...b, _id: String(b._id), role: roleById.get(String(b._id)) ?? "staff" }));
}

/**
 * Closes the dashboard when the business has no access: a trial not yet
 * started, a trial that ran out, or a paid period that lapsed.
 *
 * Paying is the one thing a locked business must still be able to do —
 * otherwise the only escape would be to never have been locked — so the
 * renewal screens and the payment actions pass `allowLocked`.
 */
function gateAccess(
  business: { plan?: string | null; trialEndsAt?: Date | string | null; planEndsAt?: Date | string | null },
  allowLocked?: boolean,
) {
  if (allowLocked) return;
  const access = accessInfo(business);
  if (access.locked) redirect(accessRedirect(access));
}

export type BusinessGateOptions = {
  /** Let a business through even though its trial is unactivated or expired. */
  allowLocked?: boolean;
};

/**
 * The single authorization gate. Resolves the active business from the cookie
 * (or the user's last-used business) and verifies membership before returning.
 * Every business-scoped query in the app derives its `businessId` from here,
 * which is what keeps tenants isolated (spec §50).
 */
export async function requireBusiness(explicitId?: string, options: BusinessGateOptions = {}) {
  const user = await requireUser();
  await connectDB();

  const cookieStore = await cookies();
  const cookieId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const dbUser = await User.findById(user.id).select("lastBusinessId status").lean();
  // A session issued before the account was disabled must not keep working.
  if (dbUser?.status === "disabled") redirect("/disabled");

  const candidates = [explicitId, cookieId, dbUser?.lastBusinessId ? String(dbUser.lastBusinessId) : undefined].filter(
    (v): v is string => Boolean(v) && Types.ObjectId.isValid(v!),
  );

  for (const candidate of candidates) {
    const membership = await BusinessMember.findOne({ businessId: candidate, userId: user.id, status: "active" }).lean();
    if (membership) {
      const business = await Business.findById(candidate).lean();
      if (business) {
        if (business.status === "suspended") redirect("/suspended");
        gateAccess(business, options.allowLocked);
        return {
          user,
          business: { ...business, _id: String(business._id) } as BusinessDoc & { _id: string },
          businessId: String(business._id),
          role: membership.role as BusinessRole,
        };
      }
    }
  }

  // Fall back to any business the user belongs to, otherwise send them to onboarding.
  const fallback = await BusinessMember.findOne({ userId: user.id, status: "active" }).sort({ createdAt: 1 }).lean();
  if (!fallback) redirect("/onboarding");

  const business = await Business.findById(fallback.businessId).lean();
  if (!business) redirect("/onboarding");
  if (business.status === "suspended") redirect("/suspended");
  gateAccess(business, options.allowLocked);

  return {
    user,
    business: { ...business, _id: String(business._id) } as BusinessDoc & { _id: string },
    businessId: String(business._id),
    role: fallback.role as BusinessRole,
  };
}

/** Non-redirecting variant for API routes and Server Actions. */
export async function resolveBusinessAccess(businessId: string, options: BusinessGateOptions = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new AccessError("You must be signed in");
  if (!Types.ObjectId.isValid(businessId)) throw new AccessError("Unknown business");

  await connectDB();
  const membership = await BusinessMember.findOne({
    businessId,
    userId: session.user.id,
    status: "active",
  }).lean();
  if (!membership) throw new AccessError();

  // Suspension is checked here as well as in requireBusiness: this is the path
  // server actions and route handlers take, and they must not slip past it.
  const business = await Business.findById(businessId).select("status plan trialEndsAt planEndsAt").lean();
  if (business?.status === "suspended") throw new AccessError("This business is suspended");
  if (business && !options.allowLocked) {
    const access = accessInfo(business);
    if (access.locked) {
      throw new AccessError(
        access.isTrial
          ? "This free trial has ended. Choose a plan to carry on."
          : "This subscription has ended. Renew to carry on.",
      );
    }
  }

  const actor = await User.findById(session.user.id).select("status").lean();
  if (actor?.status === "disabled") throw new AccessError("This account is disabled");

  return { userId: session.user.id, businessId, role: membership.role as BusinessRole };
}

const ROLE_RANK: Record<BusinessRole, number> = { staff: 1, admin: 2, owner: 3 };

export function assertRole(role: BusinessRole, minimum: BusinessRole) {
  if (ROLE_RANK[role] < ROLE_RANK[minimum]) {
    throw new AccessError(`This action requires ${minimum} permissions`);
  }
}

export function canManageBilling(role: BusinessRole) {
  return role === "owner";
}

export function canManageTeam(role: BusinessRole) {
  return role === "owner" || role === "admin";
}

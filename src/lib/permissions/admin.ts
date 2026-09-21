import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { AccessError } from ".";

/**
 * Platform administration.
 *
 * A super admin sees every business on the platform, so this gate is the most
 * consequential one in the codebase. Two rules keep it honest:
 *
 *  1. Nothing trusts the session alone — the role is read from the database on
 *     every check, so revoking it takes effect on the next request rather than
 *     when a JWT happens to expire.
 *  2. Every admin page *and* every admin server action calls a gate. A layout
 *     check protects the screen, not the action behind it, and a server action
 *     is a public endpoint.
 */

/**
 * Emails that are admins regardless of the database flag.
 *
 * This exists to solve the first-admin problem: with no bootstrap you would
 * have to edit Mongo by hand to grant the very first role. Keep the list short
 * and treat it as production configuration.
 */
function bootstrapEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminUser = { id: string; name: string; email: string; image?: string; viaBootstrap: boolean };

/** The signed-in super admin, or null. Never throws — for conditional UI. */
export async function getSuperAdmin(): Promise<AdminUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();
  const user = await User.findById(session.user.id).select("name email image platformRole").lean();
  if (!user) return null;

  const email = (user.email ?? "").toLowerCase();
  const viaBootstrap = bootstrapEmails().includes(email);
  if (user.platformRole !== "admin" && !viaBootstrap) return null;

  return {
    id: String(user._id),
    name: user.name ?? "",
    email,
    image: user.image ?? undefined,
    viaBootstrap,
  };
}

/** For pages and layouts: sends everyone else away. */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await getSuperAdmin();
  // Not a 403: an admin area should not confirm its own existence to someone
  // who has no business knowing about it.
  if (!admin) redirect("/dashboard");
  return admin;
}

/** For server actions and route handlers, which must not redirect. */
export async function assertSuperAdmin(): Promise<AdminUser> {
  const admin = await getSuperAdmin();
  if (!admin) throw new AccessError("This action requires platform administrator access");
  return admin;
}

/**
 * Records what an admin did. Called by every mutation in the admin panel —
 * acting across every tenant is exactly the power that needs a paper trail.
 */
export async function recordAdminAction(
  admin: AdminUser,
  action: string,
  detail: { businessId?: string; entity?: string; entityId?: string; meta?: Record<string, unknown> } = {},
) {
  await connectDB();
  await AuditLog.create({
    businessId: detail.businessId,
    userId: admin.id,
    action: `admin.${action}`,
    entity: detail.entity,
    entityId: detail.entityId,
    meta: { ...detail.meta, adminEmail: admin.email },
  });
}

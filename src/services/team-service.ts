import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { BusinessMember } from "@/models/BusinessMember";
import { User } from "@/models/User";
import { assertWithinLimit } from "@/services/limits-service";
import type { BusinessRole } from "@/types";

export type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string;
  role: BusinessRole;
  status: "active" | "invited" | "disabled";
  joinedAt: string;
  /** True when this row is the signed-in person, who needs guarding from themselves. */
  isSelf: boolean;
};

/** Everyone attached to a business, owner first and newest staff last. */
export async function listTeam(businessId: string, viewerId: string): Promise<TeamMember[]> {
  await connectDB();

  const members = await BusinessMember.find({ businessId }).sort({ createdAt: 1 }).lean();
  const users = await User.find({ _id: { $in: members.map((m) => m.userId) } } as never)
    .select("name email image")
    .lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const rank: Record<string, number> = { owner: 0, admin: 1, staff: 2 };

  return members
    .map((member) => {
      const user = byId.get(String(member.userId));
      return {
        id: String(member._id),
        userId: String(member.userId),
        name: user?.name ?? member.invitedEmail ?? "Removed user",
        email: user?.email ?? member.invitedEmail ?? "",
        image: user?.image ?? undefined,
        role: (member.role ?? "staff") as BusinessRole,
        status: (member.status ?? "active") as TeamMember["status"],
        joinedAt: String(member.createdAt),
        isSelf: String(member.userId) === viewerId,
      };
    })
    .sort((a, b) => rank[a.role] - rank[b.role] || a.joinedAt.localeCompare(b.joinedAt));
}

/**
 * A readable temporary password.
 *
 * Deliberately not random noise: the owner has to read it aloud or write it
 * down for someone standing next to them, and a password that cannot be
 * transcribed gets replaced by "1234" on a sticky note. Still satisfies the
 * sign-up rules, and the staff member can change it from their account screen.
 */
export function temporaryPassword() {
  const words = ["kandy", "galle", "matara", "jaffna", "negombo", "kurunegala", "badulla", "ella"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${word}-${digits}`;
}

export type AddStaffResult =
  | { ok: true; linkedExisting: true; name: string }
  | { ok: true; linkedExisting: false; name: string; email: string; password: string }
  | { ok: false; error: string };

/**
 * Adds someone to a business.
 *
 * Two paths, because the email may already be a Helabiz account: an existing
 * user is attached as they are — their password is never touched and never
 * revealed — while a new one gets an account created with a temporary password
 * the owner passes on.
 */
export async function addStaffAccount(
  businessId: string,
  input: { name: string; email: string; role: BusinessRole },
): Promise<AddStaffResult> {
  await connectDB();

  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email }).select("_id name").lean();

  if (existing) {
    const already = await BusinessMember.findOne({ businessId, userId: existing._id }).lean();
    if (already) {
      return {
        ok: false,
        error:
          already.status === "disabled"
            ? "That person is already on this team — turn their account back on instead."
            : "That person is already on this team.",
      };
    }
  }

  // Checked after the duplicate test so re-adding a known face does not read
  // as a plan problem, and before anything is written.
  await assertWithinLimit(businessId, "team");

  if (existing) {
    await BusinessMember.create({ businessId, userId: existing._id, role: input.role, status: "active" });
    return { ok: true, linkedExisting: true, name: existing.name ?? email };
  }

  const password = temporaryPassword();
  const user = await User.create({
    name: input.name.trim(),
    email,
    passwordHash: await bcrypt.hash(password, 12),
    // They belong to this business from their first sign-in.
    lastBusinessId: businessId,
    onboardedAt: new Date(),
  });
  await BusinessMember.create({ businessId, userId: user._id, role: input.role, status: "active" });

  return { ok: true, linkedExisting: false, name: user.name, email, password };
}

/** The owner row is immovable: a business without an owner has nobody who can fix it. */
async function guardOwner(memberId: string, businessId: string) {
  const member = await BusinessMember.findOne({ _id: memberId, businessId }).lean();
  if (!member) return { error: "That person is not on this team." };
  if (member.role === "owner") return { error: "The owner cannot be changed here. Transfer the business instead." };
  return { member };
}

export async function changeMemberRole(businessId: string, memberId: string, role: BusinessRole) {
  await connectDB();
  if (role === "owner") return { ok: false as const, error: "Ownership cannot be granted from here." };

  const guard = await guardOwner(memberId, businessId);
  if (guard.error) return { ok: false as const, error: guard.error };

  await BusinessMember.updateOne({ _id: memberId, businessId }, { $set: { role } });
  return { ok: true as const };
}

export async function setMemberStatus(businessId: string, memberId: string, status: "active" | "disabled") {
  await connectDB();

  const guard = await guardOwner(memberId, businessId);
  if (guard.error) return { ok: false as const, error: guard.error };

  // Turning someone back on can take the business over its plan limit.
  if (status === "active") await assertWithinLimit(businessId, "team");

  await BusinessMember.updateOne({ _id: memberId, businessId }, { $set: { status } });
  return { ok: true as const };
}

/**
 * Detaches someone from the business.
 *
 * Their Helabiz account survives — it may be attached to other businesses, and
 * deleting a person because they left one shop would be wrong.
 */
export async function removeMember(businessId: string, memberId: string) {
  await connectDB();

  const guard = await guardOwner(memberId, businessId);
  if (guard.error) return { ok: false as const, error: guard.error };

  await BusinessMember.deleteOne({ _id: memberId, businessId });
  return { ok: true as const };
}

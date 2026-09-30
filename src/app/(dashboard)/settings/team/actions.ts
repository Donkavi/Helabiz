"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, requireBusiness } from "@/lib/permissions";
import { LimitError } from "@/services/limits-service";
import {
  addStaffAccount,
  changeMemberRole,
  listTeam,
  removeMember,
  setMemberStatus,
  type AddStaffResult,
} from "@/services/team-service";
import { fieldErrorsFrom } from "@/lib/validations/errors";
import type { BusinessRole } from "@/types";

/**
 * Managing the team.
 *
 * Owners and admins may both add staff, but only an owner may hand out the
 * admin role — otherwise an admin could promote a colleague and, between them,
 * do anything the owner can.
 */

const idSchema = z.string().regex(/^[0-9a-f]{24}$/i, "Unknown person");

const addSchema = z.object({
  name: z.string().min(2, "Enter their name").max(80),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "staff"]),
});

export type AddStaffState =
  | { ok: true; result: Extract<AddStaffResult, { ok: true }> }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | null;

export async function addStaffAction(_prev: AddStaffState, formData: FormData): Promise<AddStaffState> {
  const { businessId, role } = await requireBusiness();

  try {
    assertRole(role, "admin");
  } catch {
    return { ok: false, error: "Only owners and admins can add staff." };
  }

  const parsed = addSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "staff"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  if (parsed.data.role === "admin" && role !== "owner") {
    return { ok: false, error: "Only the business owner can make someone an admin." };
  }

  try {
    const result = await addStaffAccount(businessId, parsed.data);
    if (!result.ok) return { ok: false, error: result.error };

    revalidatePath("/settings/team");
    revalidatePath("/settings/billing");
    return { ok: true, result };
  } catch (error) {
    // The plan is full: say so in the words the plan uses.
    if (error instanceof LimitError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function changeRoleAction(memberId: string, next: BusinessRole) {
  const { businessId, role } = await requireBusiness();

  try {
    assertRole(role, "admin");
  } catch {
    return { ok: false as const, error: "Only owners and admins can change roles." };
  }
  if (next === "admin" && role !== "owner") {
    return { ok: false as const, error: "Only the business owner can make someone an admin." };
  }

  const parsed = idSchema.safeParse(memberId);
  if (!parsed.success) return { ok: false as const, error: "Unknown person" };

  const result = await changeMemberRole(businessId, parsed.data, next);
  if (!result.ok) return result;

  revalidatePath("/settings/team");
  return { ok: true as const, message: "Role updated." };
}

export async function setStatusAction(memberId: string, status: "active" | "disabled") {
  const { businessId, role } = await requireBusiness();

  try {
    assertRole(role, "admin");
  } catch {
    return { ok: false as const, error: "Only owners and admins can do that." };
  }

  const parsed = idSchema.safeParse(memberId);
  if (!parsed.success) return { ok: false as const, error: "Unknown person" };

  try {
    const result = await setMemberStatus(businessId, parsed.data, status);
    if (!result.ok) return result;
  } catch (error) {
    if (error instanceof LimitError) return { ok: false as const, error: error.message };
    throw error;
  }

  revalidatePath("/settings/team");
  revalidatePath("/settings/billing");
  return { ok: true as const, message: status === "disabled" ? "Account turned off." : "Account turned back on." };
}

export async function removeMemberAction(memberId: string) {
  const { businessId, role, user } = await requireBusiness();

  try {
    assertRole(role, "admin");
  } catch {
    return { ok: false as const, error: "Only owners and admins can remove people." };
  }

  const parsed = idSchema.safeParse(memberId);
  if (!parsed.success) return { ok: false as const, error: "Unknown person" };

  // Removing yourself would lock you out of the business you are standing in.
  const team = await listTeam(businessId, user.id);
  const target = team.find((member) => member.id === parsed.data);
  if (target?.isSelf) return { ok: false as const, error: "You cannot remove yourself from the business." };

  const result = await removeMember(businessId, parsed.data);
  if (!result.ok) return result;

  revalidatePath("/settings/team");
  revalidatePath("/settings/billing");
  return { ok: true as const, message: "Removed from this business." };
}

"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireBusiness, requireUser, assertRole } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { User } from "@/models/User";
import { businessSettingsSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";

export async function saveBusinessSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId, role } = await requireBusiness();

  try {
    assertRole(role, "admin");
  } catch {
    return { ok: false, error: "Only owners and admins can change business settings." };
  }

  const parsed = businessSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const data = parsed.data;
  await connectDB();

  await Business.updateOne(
    { _id: businessId },
    {
      $set: {
        name: data.name,
        description: data.description || undefined,
        logo: data.logo || undefined,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        deliveryFee: data.deliveryFee,
        freeDeliveryOver: data.freeDeliveryOver,
        "social.facebook": data.facebook || undefined,
        "social.instagram": data.instagram || undefined,
        "social.tiktok": data.tiktok || undefined,
        "social.youtube": data.youtube || undefined,
      },
    },
  );

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

const accountSchema = z
  .object({
    name: z.string().min(2, "Tell us your name").max(80),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !data.newPassword || data.newPassword.length >= 8, {
    message: "Use at least 8 characters",
    path: ["newPassword"],
  })
  .refine((data) => !data.newPassword || Boolean(data.currentPassword), {
    message: "Enter your current password to change it",
    path: ["currentPassword"],
  });

export async function saveAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  await connectDB();
  const record = await User.findById(user.id).select("+passwordHash");
  if (!record) return { ok: false, error: "Account not found" };

  record.name = parsed.data.name;

  if (parsed.data.newPassword) {
    const valid = record.passwordHash
      ? await bcrypt.compare(parsed.data.currentPassword ?? "", record.passwordHash)
      : false;
    if (!valid) return { ok: false, fieldErrors: { currentPassword: "That password is not correct" } };
    record.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  await record.save();
  revalidatePath("/settings/account");
  return { ok: true };
}


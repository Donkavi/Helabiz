"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireBusiness, requireUser, assertRole } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { Payment } from "@/models/Payment";
import { businessSettingsSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";
import type { PlanId } from "@/types";
import { PLANS } from "@/lib/plans";

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

/**
 * Plan changes (spec §41, §6).
 *
 * No payment provider is connected, so this records the intent and the payment
 * row a provider would later settle. `Payment` and `Subscription` are the seam:
 * a real gateway marks the payment succeeded and the plan follows.
 */
export async function changePlanAction(plan: PlanId) {
  const { businessId, role, business } = await requireBusiness();

  try {
    assertRole(role, "owner");
  } catch {
    return { ok: false as const, error: "Only the business owner can change the plan." };
  }

  if (!PLANS[plan]) return { ok: false as const, error: "Unknown plan" };
  if (business.plan === plan) return { ok: true as const, message: "You are already on that plan." };

  await connectDB();
  const price = PLANS[plan].price;

  if (price > 0) {
    await Payment.create({
      businessId,
      kind: "subscription",
      reference: `plan:${plan}`,
      amount: price,
      currency: "LKR",
      provider: "manual",
      status: "pending",
      meta: { from: business.plan, to: plan },
    });
  }

  await Subscription.findOneAndUpdate(
    { businessId },
    {
      businessId,
      plan,
      status: price > 0 ? "trialing" : "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      provider: "manual",
    },
    { upsert: true },
  );

  await Business.updateOne({ _id: businessId }, { $set: { plan } });

  revalidatePath("/settings/billing");
  revalidatePath("/dashboard", "layout");
  return {
    ok: true as const,
    message:
      price > 0
        ? `You are on the ${PLANS[plan].name} plan. We will be in touch about payment.`
        : `Switched to the ${PLANS[plan].name} plan.`,
  };
}

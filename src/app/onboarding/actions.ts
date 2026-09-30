"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, ACTIVE_BUSINESS_COOKIE } from "@/lib/permissions";
import { createBusinessSchema } from "@/lib/validations/auth";
import { createBusinessForUser } from "@/services/business-service";
import { fieldErrorsFrom } from "@/lib/validations/errors";

export type OnboardingState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function createBusinessAction(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = createBusinessSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "retail"),
    city: String(formData.get("city") ?? ""),
    district: String(formData.get("district") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const business = await createBusinessForUser(user.id, parsed.data);

  const store = await cookies();
  store.set(ACTIVE_BUSINESS_COOKIE, String(business._id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Straight to the trial gate rather than bouncing off the dashboard one.
  redirect("/trial");
}

"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom } from "@/lib/validations/errors";

export type AuthActionState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const limited = await rateLimit(`signup:${raw.email}`, { limit: 5, windowMs: 60_000 });
  if (!limited.ok) return { error: "Too many attempts. Please wait a minute and try again." };

  await connectDB();
  const existing = await User.findOne({ email: parsed.data.email }).select("_id").lean();
  if (existing) return { fieldErrors: { email: "An account with this email already exists" } };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await User.create({ name: parsed.data.name, email: parsed.data.email, passwordHash });

  // signIn redirects on success; AuthError is the only expected failure here.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created — please sign in." };
    throw error;
  }
  return null;
}

export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const raw = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard") || "/dashboard";

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const limited = await rateLimit(`signin:${raw.email}`, { limit: 8, windowMs: 60_000 });
  if (!limited.ok) return { error: "Too many sign-in attempts. Please wait a minute and try again." };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email and password do not match an account." };
    }
    throw error;
  }
  return null;
}

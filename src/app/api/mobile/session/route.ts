import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { accessInfo } from "@/lib/access";
import { listUserBusinesses } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validations/auth";
import {
  issueMobileToken,
  mobileRoute,
  MobileError,
  readJson,
  requireMobileUser,
  revokeMobileToken,
} from "@/lib/mobile/auth";
import { User } from "@/models/User";

/**
 * The mobile app's session.
 *
 * POST   { email, password, platform?, deviceName? }  sign in, returns a bearer token
 * GET                                                the signed-in user and their businesses
 * DELETE                                             sign this phone out (and stop its pushes)
 *
 * Email and password only: "Continue with Google" is a browser redirect flow
 * the app does not run, so an account with no password cannot sign in here.
 */

async function businessesFor(userId: string) {
  const businesses = await listUserBusinesses(userId);
  return businesses.map((business) => ({
    id: business._id,
    name: business.name,
    slug: business.slug,
    logo: business.logo ?? null,
    role: business.role,
    plan: business.plan ?? "free",
    status: business.status ?? "active",
    locked: accessInfo(business).locked,
  }));
}

const signInBody = signInSchema.extend({
  platform: z.string().max(20).optional(),
  deviceName: z.string().max(80).optional(),
});

export const POST = mobileRoute(async (request) => {
  const parsed = signInBody.safeParse(await readJson(request));
  if (!parsed.success) {
    throw new MobileError(parsed.error.issues[0]?.message ?? "Enter your email and password", 400, "invalid");
  }
  const email = parsed.data.email.toLowerCase();

  const limited = await rateLimit(`mobile-signin:${email}`, { limit: 8, windowMs: 60_000 });
  if (!limited.ok) throw new MobileError("Too many attempts. Please wait a minute and try again.", 429, "invalid");

  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash name email image status").lean();
  // One message for every failure, as on the web: the app must not tell a
  // stranger which emails have accounts.
  const fail = new MobileError("That email and password do not match", 401, "unauthorized");
  if (!user?.passwordHash || user.status === "disabled") throw fail;
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) throw fail;

  const userId = String(user._id);
  const token = await issueMobileToken(userId, parsed.data);

  return NextResponse.json({
    token,
    user: { id: userId, name: user.name, email: user.email, image: user.image ?? null },
    businesses: await businessesFor(userId),
  });
});

export const GET = mobileRoute(async (request) => {
  const { user } = await requireMobileUser(request);
  return NextResponse.json({ user, businesses: await businessesFor(user.id) });
});

export const DELETE = mobileRoute(async (request) => {
  await revokeMobileToken(request);
  return NextResponse.json({ ok: true });
});

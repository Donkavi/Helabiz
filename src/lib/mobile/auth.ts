import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { accessInfo } from "@/lib/access";
import { Business, type BusinessDoc } from "@/models/Business";
import { BusinessMember } from "@/models/BusinessMember";
import { MobileDevice } from "@/models/MobileDevice";
import { User } from "@/models/User";
import type { BusinessRole } from "@/types";

/**
 * The mobile app's gate — the bearer-token twin of `requireBusiness`.
 *
 * Auth.js sessions live in a cookie the app has no good way to hold, so the
 * app signs in once and receives an opaque token instead (see
 * `MobileDevice`). Every `/api/mobile/*` route resolves the user and the
 * business through here and nowhere else, which keeps the "could this reach
 * another tenant" question answerable in one file, as on the web.
 *
 * The business comes from the `x-business-id` header the app sends, and is
 * only trusted after the membership check below — exactly like the cookie on
 * the web.
 */

const TOKEN_PREFIX = "hbm_";
/** A phone left unopened this long has to sign in again. */
const IDLE_LIMIT_MS = 90 * 24 * 60 * 60 * 1000;
/** `lastSeenAt` only needs to be roughly right; skip the write on most requests. */
const SEEN_RESOLUTION_MS = 60 * 60 * 1000;

export type MobileErrorCode = "unauthorized" | "forbidden" | "locked" | "suspended" | "no_business" | "not_found" | "invalid";

export class MobileError extends Error {
  constructor(
    message: string,
    readonly status = 401,
    readonly code: MobileErrorCode = "unauthorized",
  ) {
    super(message);
    this.name = "MobileError";
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueMobileToken(
  userId: string,
  device: { platform?: string; deviceName?: string },
) {
  await connectDB();
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const platforms = ["ios", "android", "web"] as const;
  await MobileDevice.create({
    userId,
    tokenHash: hashToken(token),
    platform: platforms.find((p) => p === device.platform) ?? "unknown",
    deviceName: device.deviceName?.slice(0, 80) || undefined,
    lastSeenAt: new Date(),
  });
  return token;
}

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return token.startsWith(TOKEN_PREFIX) ? token : null;
}

export type MobileUser = { id: string; name: string; email: string; image?: string };

/** The signed-in user behind the request's bearer token. */
export async function requireMobileUser(request: Request) {
  const token = bearer(request);
  if (!token) throw new MobileError("Please sign in");

  await connectDB();
  const device = await MobileDevice.findOne({ tokenHash: hashToken(token) });
  if (!device) throw new MobileError("Please sign in");

  const now = Date.now();
  const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0;
  if (now - lastSeen > IDLE_LIMIT_MS) {
    await device.deleteOne();
    throw new MobileError("Your session expired. Please sign in again.");
  }

  const user = await User.findById(device.userId).select("name email image status").lean();
  // A disabled account loses its phones as well as its browser sessions.
  if (!user || user.status === "disabled") {
    await device.deleteOne();
    throw new MobileError("This account cannot sign in");
  }

  if (now - lastSeen > SEEN_RESOLUTION_MS) {
    device.lastSeenAt = new Date(now);
    await device.save();
  }

  return {
    device,
    user: {
      id: String(user._id),
      name: user.name ?? "",
      email: user.email ?? "",
      image: user.image ?? undefined,
    } satisfies MobileUser,
  };
}

/** The first candidate the user is an active member of, else their oldest membership. */
async function membershipFor(userId: string, candidates: string[]) {
  for (const businessId of candidates) {
    const membership = await BusinessMember.findOne({ businessId, userId, status: "active" }).lean();
    if (membership) return membership;
  }
  return BusinessMember.findOne({ userId, status: "active" }).sort({ createdAt: 1 }).lean();
}

/**
 * The signed-in user plus the business the request is about, after checking
 * membership, suspension and the trial/plan lock — the same three gates the
 * web applies in `requireBusiness` and `resolveBusinessAccess`.
 */
export async function requireMobileBusiness(request: Request) {
  const { user, device } = await requireMobileUser(request);

  const requested = request.headers.get("x-business-id") ?? "";
  const dbUser = await User.findById(user.id).select("lastBusinessId").lean();
  const candidates = [requested, dbUser?.lastBusinessId ? String(dbUser.lastBusinessId) : ""].filter((id) =>
    Types.ObjectId.isValid(id),
  );

  const membership = await membershipFor(user.id, candidates);
  if (!membership) throw new MobileError("Create your business on the website first", 404, "no_business");

  const business = await Business.findById(membership.businessId).lean();
  if (!business) throw new MobileError("Create your business on the website first", 404, "no_business");
  if (business.status === "suspended") throw new MobileError("This business is suspended", 403, "suspended");

  const access = accessInfo(business);
  if (access.locked) {
    throw new MobileError(
      access.isTrial
        ? "This free trial has ended. Choose a plan on the Helabiz website to carry on."
        : "This subscription has ended. Renew on the Helabiz website to carry on.",
      403,
      "locked",
    );
  }

  return {
    user,
    device,
    business: { ...business, _id: String(business._id) } as BusinessDoc & { _id: string },
    businessId: String(business._id),
    role: membership.role as BusinessRole,
  };
}

/** Signs out the phone holding this token. Unknown tokens are already signed out. */
export async function revokeMobileToken(request: Request) {
  const token = bearer(request);
  if (!token) return;
  await connectDB();
  await MobileDevice.deleteOne({ tokenHash: hashToken(token) });
}

/**
 * Wraps a mobile route so a thrown `MobileError` becomes its status and a
 * JSON `{ error, code }` the app can act on, and anything else a plain 500
 * without leaking details.
 */
export function mobileRoute<Context>(handler: (request: Request, context: Context) => Promise<Response>) {
  return async (request: Request, context: Context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof MobileError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      console.error("[mobile api]", error);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/** Parses a JSON body, turning anything unreadable into a 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new MobileError("Invalid request", 400, "invalid");
  }
}

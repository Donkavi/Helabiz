import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { accessInfo } from "@/lib/access";
import { rateLimit } from "@/lib/rate-limit";
import { emailReady } from "@/lib/mailer";
import { clearShopperSession, readShopperSession, setShopperSession } from "@/lib/shopper-session";
import { Business } from "@/models/Business";
import { Website } from "@/models/Website";
import {
  changeShopperPassword,
  currentShopper,
  registerShopper,
  requestShopperReset,
  resetShopperPassword,
  signInShopper,
  updateShopperProfile,
  validPhone,
} from "@/services/shopper-service";

/**
 * Customer accounts on a published website: register, sign in and out, edit
 * the profile, change or reset the password. One route, one `action` segment,
 * because every action starts the same way — find the shop and check it has
 * accounts switched on.
 *
 * Lives under `/api/`, which the subdomain proxy leaves alone, so the session
 * cookie it sets belongs to whichever host the shopper is on.
 */

const slug = z.string().min(1).max(80);
const password = z.string().min(8, "Use at least 8 characters for your password").max(200);
const email = z.string().trim().email("Enter a valid email").max(160);

const schemas = {
  register: z.object({
    businessSlug: slug,
    name: z.string().trim().min(1, "Enter your name").max(120),
    phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
    email,
    password,
    orderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  }),
  "sign-in": z.object({
    businessSlug: slug,
    login: z.string().trim().min(1, "Enter your email or phone number").max(160),
    password: z.string().min(1, "Enter your password").max(200),
  }),
  "sign-out": z.object({ businessSlug: slug }),
  profile: z.object({
    businessSlug: slug,
    name: z.string().trim().min(1, "Enter your name").max(120),
    email,
    address: z.string().max(400).optional().or(z.literal("")),
    city: z.string().max(80).optional().or(z.literal("")),
    district: z.string().max(80).optional().or(z.literal("")),
  }),
  password: z.object({
    businessSlug: slug,
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: password,
  }),
  forgot: z.object({ businessSlug: slug, email }),
  reset: z.object({ businessSlug: slug, token: z.string().min(20).max(200), password }),
};

type Action = keyof typeof schemas;

function fail(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/** The shop behind a slug, if its website is open and takes customer accounts. */
async function shopFor(businessSlug: string) {
  await connectDB();
  const business = await Business.findOne({ slug: businessSlug })
    .select("name slug email status plan trialStartedAt trialEndsAt planEndsAt")
    .lean();
  if (!business || business.status === "suspended" || accessInfo(business).locked) return null;

  const website = await Website.findOne({ businessId: business._id, status: "published" }).select("settings").lean();
  if (!website || website.settings?.customerAccounts === false) return null;

  return { businessId: String(business._id), slug: business.slug, name: business.name, email: business.email };
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/site/account/[action]">) {
  const { action } = await ctx.params;
  if (!(action in schemas)) return fail("Not found", 404);

  // A JSON content type cannot be sent cross-site without a CORS preflight,
  // which this route never answers — that is the CSRF protection.
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Invalid request");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail("Invalid request");
  }

  const parsed = schemas[action as Action].safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message ?? "Please check your details", 400, { field: issue?.path[0] });
  }
  const data = parsed.data as Record<string, string>;

  const shop = await shopFor(data.businessSlug);
  if (!shop) return fail("Accounts are not available on this website", 404);

  const ip = clientIp(request);
  const limited = async (key: string, limit: number, windowMs = 10 * 60_000) =>
    !(await rateLimit(`shopper:${action}:${shop.businessId}:${key}`, { limit, windowMs })).ok;
  const tooMany = () => fail("Too many attempts. Please wait a few minutes and try again.", 429);

  switch (action as Action) {
    case "register": {
      if (await limited(ip, 10)) return tooMany();
      if (!validPhone(data.phone)) return fail("Enter a valid Sri Lankan phone number", 400, { field: "phone" });

      const result = await registerShopper(shop.businessId, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: data.password,
        orderNumber: data.orderNumber,
      });
      if (!result.ok) {
        return fail(result.error, 400, { field: result.field, needsOrderProof: result.needsOrderProof });
      }
      await setShopperSession(shop.businessId, result.customerId, result.version);
      return NextResponse.json({ ok: true });
    }

    case "sign-in": {
      if ((await limited(ip, 30)) || (await limited(data.login.toLowerCase(), 8))) return tooMany();
      const result = await signInShopper(shop.businessId, data.login, data.password);
      if (!result.ok) return fail(result.error, 401);
      await setShopperSession(shop.businessId, result.customerId, result.version);
      return NextResponse.json({ ok: true });
    }

    case "sign-out": {
      await clearShopperSession(shop.businessId);
      return NextResponse.json({ ok: true });
    }

    case "profile": {
      const shopper = await currentShopper(shop.businessId);
      if (!shopper) return fail("Please sign in again", 401);
      const result = await updateShopperProfile(shop.businessId, shopper.id, {
        name: data.name,
        email: data.email,
        address: data.address,
        city: data.city,
        district: data.district,
      });
      return result.ok ? NextResponse.json({ ok: true }) : fail(result.error, 400, { field: result.field });
    }

    case "password": {
      const shopper = await currentShopper(shop.businessId);
      if (!shopper) return fail("Please sign in again", 401);
      if (await limited(shopper.id, 8)) return tooMany();
      const result = await changeShopperPassword(shop.businessId, shopper.id, data.currentPassword, data.newPassword);
      if (!result.ok) return fail(result.error, 400, { field: result.field });
      // Every other device is now signed out; this one carries on.
      await setShopperSession(shop.businessId, result.customerId, result.version);
      return NextResponse.json({ ok: true });
    }

    case "forgot": {
      // Without outgoing email the link would never arrive; the forgot page
      // sends people to the shop instead, which can make them one.
      if (!emailReady()) return fail("Please contact the shop to reset your password.", 503);
      if ((await limited(ip, 10)) || (await limited(data.email.toLowerCase(), 3, 15 * 60_000))) return tooMany();
      await requestShopperReset(shop, data.email);
      // The same answer whether or not the email has an account.
      return NextResponse.json({ ok: true });
    }

    case "reset": {
      if (await limited(ip, 10)) return tooMany();
      const result = await resetShopperPassword(shop.businessId, data.token, data.password);
      if (!result.ok) return fail(result.error);
      await setShopperSession(shop.businessId, result.customerId, result.version);
      return NextResponse.json({ ok: true });
    }
  }
}

/** Lets a client component ask whether it is signed in, without a page load. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/site/account/[action]">) {
  const { action } = await ctx.params;
  if (action !== "me") return fail("Not found", 404);

  const businessSlug = request.nextUrl.searchParams.get("shop") ?? "";
  const shop = businessSlug ? await shopFor(businessSlug) : null;
  if (!shop || !(await readShopperSession(shop.businessId))) return NextResponse.json({ signedIn: false });

  const shopper = await currentShopper(shop.businessId);
  return NextResponse.json({ signedIn: Boolean(shopper), name: shopper?.name.split(" ")[0] ?? null });
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { accessInfo } from "@/lib/access";
import { rateLimit } from "@/lib/rate-limit";
import { Business } from "@/models/Business";
import { Website } from "@/models/Website";
import { currentShopper } from "@/services/shopper-service";
import {
  markReadByCustomer,
  sendCustomerMessage,
  shopChatEnabled,
  shopChatMessages,
  unreadForCustomer,
} from "@/services/shop-chat-service";

/**
 * The storefront's side of "Chat with customers".
 *
 * GET  /api/site/chat?shop=<slug>&after=<iso>  the signed-in customer's messages (polled)
 * GET  /api/site/chat?shop=<slug>&peek=1       just { signedIn, unread }, marking nothing read
 * POST /api/site/chat  { businessSlug, body }   send one
 *
 * The customer is whoever the shopper session says, never an id from the
 * request. Under `/api/`, which the subdomain proxy leaves alone, so the
 * session cookie of whichever host the shopper is on comes with it.
 */

async function shopFor(slug: string) {
  await connectDB();
  const business = await Business.findOne({ slug })
    .select("name status plan trialStartedAt trialEndsAt planEndsAt addons")
    .lean();
  if (!business || business.status === "suspended" || accessInfo(business).locked) return null;

  const website = await Website.findOne({ businessId: business._id, status: "published" }).select("settings").lean();
  if (!website || !shopChatEnabled(business, website.settings)) return null;

  return { businessId: String(business._id) };
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("shop") ?? "";
  const shop = slug ? await shopFor(slug) : null;
  if (!shop) return NextResponse.json({ enabled: false, signedIn: false, messages: [] });

  const shopper = await currentShopper(shop.businessId);
  if (!shopper) return NextResponse.json({ enabled: true, signedIn: false, messages: [], unread: 0 });

  // `peek=1`: the closed chat button's badge. Counts only and marks nothing
  // read, or the badge would clear before the customer saw the reply.
  if (request.nextUrl.searchParams.get("peek") === "1") {
    return NextResponse.json({
      enabled: true,
      signedIn: true,
      messages: [],
      unread: await unreadForCustomer(shop.businessId, shopper.id),
    });
  }

  const messages = await shopChatMessages(shop.businessId, shopper.id, request.nextUrl.searchParams.get("after") ?? undefined);
  if (messages.some((message) => message.from === "shop" && !message.readAt)) {
    await markReadByCustomer(shop.businessId, shopper.id);
  }
  return NextResponse.json({ enabled: true, signedIn: true, messages });
}

const schema = z.object({
  businessSlug: z.string().min(1).max(80),
  body: z.string().trim().min(1, "Write a message").max(2000),
});

export async function POST(request: NextRequest) {
  // A JSON content type cannot be sent cross-site without a preflight this
  // route never answers — the CSRF protection, as on the account routes.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 });
  }

  const shop = await shopFor(parsed.data.businessSlug);
  if (!shop) return NextResponse.json({ ok: false, error: "Chat is not available on this website" }, { status: 404 });

  const shopper = await currentShopper(shop.businessId);
  if (!shopper) return NextResponse.json({ ok: false, error: "Please sign in to chat" }, { status: 401 });

  const limited = await rateLimit(`shop-chat:${shop.businessId}:${shopper.id}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "You are sending messages very fast. Please wait a moment." }, { status: 429 });
  }

  const message = await sendCustomerMessage(shop.businessId, { id: shopper.id, name: shopper.name }, parsed.data.body);
  return NextResponse.json({ ok: true, message });
}

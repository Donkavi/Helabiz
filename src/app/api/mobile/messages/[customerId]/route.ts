import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAddon } from "@/lib/addons";
import { rateLimit } from "@/lib/rate-limit";
import { mobileRoute, MobileError, readJson, requireMobileBusiness } from "@/lib/mobile/auth";
import {
  markReadByShop,
  sendShopMessage,
  shopChatCustomer,
  shopChatMessages,
} from "@/services/shop-chat-service";

type Context = { params: Promise<{ customerId: string }> };

/** The customer, only if they belong to this business — the same check as the web inbox. */
async function customerOf(businessId: string, customerId: string) {
  const customer = await shopChatCustomer(businessId, customerId);
  if (!customer) throw new MobileError("That customer is not part of this business", 404, "not_found");
  return customer;
}

/**
 * GET ?after=<iso> — one conversation, oldest first; with `after`, only what
 * is newer (the app polls while the chat is open). Opening it marks the
 * customer's messages read, as on the web.
 */
export const GET = mobileRoute<Context>(async (request, { params }) => {
  const { business, businessId } = await requireMobileBusiness(request);
  const { customerId } = await params;
  const customer = await customerOf(businessId, customerId);

  const after = new URL(request.url).searchParams.get("after") ?? undefined;
  const messages = await shopChatMessages(businessId, customerId, after);
  if (messages.some((message) => message.from === "customer" && !message.readAt)) {
    await markReadByShop(businessId, customerId);
  }

  return NextResponse.json({ customer, messages, canReply: hasAddon(business, "whatsapp_chat") });
});

const reply = z.object({ body: z.string().trim().min(1, "Write a message").max(2000) });

/** POST { body } — reply as the signed-in staff member. */
export const POST = mobileRoute<Context>(async (request, { params }) => {
  const { user, business, businessId } = await requireMobileBusiness(request);
  const { customerId } = await params;

  if (!hasAddon(business, "whatsapp_chat")) {
    throw new MobileError("Switch on the Chat with customers add-on to reply.", 403, "forbidden");
  }
  await customerOf(businessId, customerId);

  const parsed = reply.safeParse(await readJson(request));
  if (!parsed.success) throw new MobileError(parsed.error.issues[0]?.message ?? "Write a message", 400, "invalid");

  // Shares the web inbox's bucket: replying from two places is still one shop.
  const limited = await rateLimit(`shop-reply:${businessId}`, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) throw new MobileError("You are sending messages very fast. Please wait a moment.", 429, "invalid");

  const message = await sendShopMessage(businessId, customerId, { id: user.id, name: user.name }, parsed.data.body);
  return NextResponse.json({ message });
});

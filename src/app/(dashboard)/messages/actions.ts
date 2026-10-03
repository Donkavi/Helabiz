"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { getLang } from "@/lib/i18n/server";
import { hasAddon } from "@/lib/addons";
import {
  markReadByShop,
  sendShopMessage,
  shopChatCustomer,
  shopChatMessages,
  type ShopChatMessage,
} from "@/services/shop-chat-service";

/**
 * The shop's side of "Chat with customers". The business comes from
 * `requireBusiness`; the customer is checked to belong to it before anything
 * is read or written, so an id from the client can never reach another shop.
 */

const ERRORS = {
  noAddon: {
    en: "Switch on the Chat with customers add-on to reply.",
    si: "Reply කරන්න Chat with customers add-on එක on කරන්න.",
  },
  notFound: { en: "That customer is not part of this business", si: "ඒ ගනුදෙනුකරු මේ business එකේ නෑ" },
  writeMessage: { en: "Write a message", si: "Message එකක් ලියන්න" },
  tooFast: {
    en: "You are sending messages very fast. Please wait a moment.",
    si: "ඔබ ගොඩක් ඉක්මනට messages යවනවා. පොඩ්ඩක් ඉන්න.",
  },
};

const messageSchema = z.string().trim().min(1).max(2000);

export async function sendShopMessageAction(
  customerId: string,
  body: string,
): Promise<{ ok: true; message: ShopChatMessage } | { ok: false; error: string }> {
  const { user, business, businessId } = await requireBusiness();
  const lang = await getLang();

  // Old conversations stay readable after the add-on lapses; replying needs it.
  if (!hasAddon(business, "whatsapp_chat")) return { ok: false, error: ERRORS.noAddon[lang] };
  if (!(await shopChatCustomer(businessId, customerId))) return { ok: false, error: ERRORS.notFound[lang] };
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: ERRORS.writeMessage[lang] };

  const limited = await rateLimit(`shop-reply:${businessId}`, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) return { ok: false, error: ERRORS.tooFast[lang] };

  const message = await sendShopMessage(businessId, customerId, { id: user.id, name: user.name }, parsed.data);
  revalidatePath("/messages");
  return { ok: true, message };
}

/** New messages in one conversation since `after`; marks the customer's as read. */
export async function pollShopChatAction(customerId: string, after?: string): Promise<ShopChatMessage[]> {
  const { businessId } = await requireBusiness();
  if (!(await shopChatCustomer(businessId, customerId))) return [];
  const messages = await shopChatMessages(businessId, customerId, after);
  if (messages.some((message) => message.from === "customer" && !message.readAt)) {
    await markReadByShop(businessId, customerId);
  }
  return messages;
}

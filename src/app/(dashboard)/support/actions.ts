"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { REQUEST_PAGES } from "@/lib/website-request";
import { normalizePhone } from "@/lib/whatsapp";
import { getLang } from "@/lib/i18n/server";
import type { Lang } from "@/lib/i18n";
import {
  chatMessages,
  createWebsiteRequest,
  latestWebsiteRequest,
  markReadByBusiness,
  sendBusinessMessage,
  type ChatMessage,
  type WebsiteRequestView,
} from "@/services/support-service";

/**
 * The business's side of help from the Helabiz team. The business always
 * comes from `requireBusiness`, never from the client.
 */

/** Messages the person reads, in their language. Field errors are translated by the form itself. */
const ERRORS: Record<string, Record<Lang, string>> = {
  alreadyOpen: {
    en: "You already have a request with our team. We will be in touch soon.",
    si: "ඔබේ request එකක් දැනටමත් අපේ කණ්ඩායම ළඟ තියෙනවා. අපි ඉක්මනින් සම්බන්ධ වෙනවා.",
  },
  tooManyRequests: {
    en: "Too many requests. Please try again later.",
    si: "Request ගොඩක් එවලා. ටික වෙලාවකින් ආයෙත් උත්සාහ කරන්න.",
  },
  writeMessage: { en: "Write a message", si: "Message එකක් ලියන්න" },
  tooFast: {
    en: "You are sending messages very fast. Please wait a moment.",
    si: "ඔබ ගොඩක් ඉක්මනට messages යවනවා. පොඩ්ඩක් ඉන්න.",
  },
};

const requestSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((value) => /^94\d{9}$/.test(normalizePhone(value)), "Enter a valid Sri Lankan phone number"),
  whatsapp: z.boolean().default(true),
  bestTime: z.string().max(80).optional().or(z.literal("")),
  about: z.string().trim().min(10, "Tell us a little about your business").max(1500),
  pages: z.array(z.enum(REQUEST_PAGES)).max(REQUEST_PAGES.length).default([]),
  style: z.string().max(600).optional().or(z.literal("")),
  links: z.string().max(600).optional().or(z.literal("")),
  notes: z.string().max(1500).optional().or(z.literal("")),
});

export type WebsiteRequestFormInput = z.input<typeof requestSchema>;

export type SubmitRequestResult =
  | { ok: true; request: WebsiteRequestView }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<keyof WebsiteRequestFormInput, string>> };

export async function submitWebsiteRequestAction(input: WebsiteRequestFormInput): Promise<SubmitRequestResult> {
  const { user, businessId } = await requireBusiness();

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const limited = await rateLimit(`website-request:${businessId}`, { limit: 5, windowMs: 60 * 60_000 });
  const lang = await getLang();
  if (!limited.ok) return { ok: false, error: ERRORS.tooManyRequests[lang] };

  const result = await createWebsiteRequest(businessId, { id: user.id, name: user.name }, parsed.data);
  // Opening a second request is the only way this fails.
  if (!result.ok) return { ok: false, error: ERRORS.alreadyOpen[lang] };

  revalidatePath("/support");
  revalidatePath("/dashboard");
  revalidatePath("/website");
  return result;
}

const messageSchema = z.string().trim().min(1, "Write a message").max(4000);

export async function sendSupportMessageAction(
  body: string,
): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  const { user, businessId } = await requireBusiness();

  const parsed = messageSchema.safeParse(body);
  const lang = await getLang();
  if (!parsed.success) return { ok: false, error: ERRORS.writeMessage[lang] };

  const limited = await rateLimit(`support-message:${businessId}`, { limit: 30, windowMs: 60_000 });
  if (!limited.ok) return { ok: false, error: ERRORS.tooFast[lang] };

  const message = await sendBusinessMessage(businessId, { id: user.id, name: user.name }, parsed.data);
  return { ok: true, message };
}

/**
 * New messages since `after`, plus the request's current status. Called on a
 * timer while the chat is open, and marks the team's messages as read.
 */
export async function pollSupportAction(after?: string): Promise<{
  messages: ChatMessage[];
  request: WebsiteRequestView | null;
}> {
  const { businessId } = await requireBusiness();
  const [messages, request] = await Promise.all([chatMessages(businessId, after), latestWebsiteRequest(businessId)]);
  if (messages.some((message) => message.from === "helabiz" && !message.readAt)) await markReadByBusiness(businessId);
  return { messages, request };
}

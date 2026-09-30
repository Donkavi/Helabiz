import "server-only";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { hasAddon } from "@/lib/addons";
import { sendMail } from "@/lib/mailer";
import { formatCurrency } from "@/lib/utils";
import { siteUrlFor } from "@/lib/website/urls";
import type { OrderStatus } from "@/types";

/**
 * The customer-facing order emails.
 *
 * Gated on the "Email order updates" add-on: without it nothing is sent, and
 * the shop is not billed for a service it is not getting. Every function here
 * swallows its own failures — an order is never lost because a mail server
 * was unreachable.
 */

type MailableOrder = {
  orderNumber: string;
  status?: string | null;
  total: number;
  items: { name: string; variantName?: string | null; quantity: number; total: number }[];
  customer?: { name?: string | null; email?: string | null } | null;
};

/** What each status means to a customer, who does not know our vocabulary. */
const STATUS_LINE: Record<string, string> = {
  pending: "We have your order and will confirm it shortly.",
  confirmed: "Your order is confirmed and we are getting it ready.",
  processing: "We are packing your order now.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered. Thank you.",
  cancelled: "Your order has been cancelled. Get in touch if that is unexpected.",
};

const STATUS_SUBJECT: Record<string, string> = {
  confirmed: "Order {n} confirmed",
  processing: "Order {n} is being packed",
  shipped: "Order {n} is on its way",
  delivered: "Order {n} has been delivered",
  cancelled: "Order {n} has been cancelled",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lines(order: MailableOrder) {
  return order.items.map((item) => {
    const name = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    return `${name} x ${item.quantity} — ${formatCurrency(item.total, { decimals: false })}`;
  });
}

function body(order: MailableOrder, shopName: string, intro: string, trackUrl?: string) {
  const text = [
    `Hello ${order.customer?.name || "there"},`,
    "",
    intro,
    "",
    `Order ${order.orderNumber}`,
    ...lines(order),
    "",
    `Total: ${formatCurrency(order.total, { decimals: false })}`,
    ...(trackUrl ? ["", `Track your order: ${trackUrl}`] : []),
    "",
    shopName,
  ].join("\n");

  const html = [
    `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;color:#1a1a1a">`,
    `<p>Hello ${escapeHtml(order.customer?.name || "there")},</p>`,
    `<p>${escapeHtml(intro)}</p>`,
    `<p style="margin:20px 0 6px"><strong>Order ${escapeHtml(order.orderNumber)}</strong></p>`,
    `<table style="border-collapse:collapse;width:100%;font-size:14px">`,
    ...order.items.map((item) => {
      const name = item.variantName ? `${item.name} (${item.variantName})` : item.name;
      return `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(name)} &times; ${item.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.total, { decimals: false })}</td></tr>`;
    }),
    `<tr><td style="padding:10px 0;font-weight:600">Total</td><td style="padding:10px 0;text-align:right;font-weight:600">${formatCurrency(order.total, { decimals: false })}</td></tr>`,
    `</table>`,
    trackUrl
      ? `<p style="margin-top:22px"><a href="${escapeHtml(trackUrl)}" style="background:#0f9b7d;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Track your order</a></p>`
      : "",
    `<p style="margin-top:24px;color:#666;font-size:13px">${escapeHtml(shopName)}</p>`,
    `</div>`,
  ].join("");

  return { text, html };
}

/** The shop's details, and whether it has paid for either relevant add-on. */
async function context(businessId: string) {
  await connectDB();
  const business = await Business.findById(businessId).select("name slug email addons").lean();
  if (!business) return null;

  return {
    name: business.name,
    // A reply should reach the shop, not a no-reply address nobody reads.
    replyTo: business.email ?? undefined,
    emails: hasAddon(business, "order_email"),
    trackUrl: hasAddon(business, "order_tracking") ? `${siteUrlFor(business.slug)}/track` : undefined,
  };
}

/** Sent when a website order is placed. */
export async function sendOrderPlacedEmail(businessId: string, order: MailableOrder) {
  try {
    const email = order.customer?.email?.trim();
    if (!email) return { sent: false, reason: "No email address on the order" };

    const shop = await context(businessId);
    if (!shop) return { sent: false, reason: "Business not found" };
    if (!shop.emails) return { sent: false, reason: "The email add-on is not active" };

    const { text, html } = body(
      order,
      shop.name,
      `Thank you for your order from ${shop.name}. We have received it and will be in touch.`,
      shop.trackUrl,
    );

    return await sendMail({
      to: email,
      subject: `Order ${order.orderNumber} received`,
      text,
      html,
      replyTo: shop.replyTo,
    });
  } catch (error) {
    // Never let the confirmation email cost someone their order.
    console.error("[mail] order placed email failed", error);
    return { sent: false, reason: "Unexpected error" };
  }
}

/** Sent when the shop moves an order along. */
export async function sendOrderStatusEmail(businessId: string, order: MailableOrder, status: OrderStatus) {
  try {
    const email = order.customer?.email?.trim();
    if (!email) return { sent: false, reason: "No email address on the order" };
    // "Pending" is the state an order is created in; announcing it twice is noise.
    if (status === "pending") return { sent: false, reason: "Not announced" };

    const shop = await context(businessId);
    if (!shop) return { sent: false, reason: "Business not found" };
    if (!shop.emails) return { sent: false, reason: "The email add-on is not active" };

    const intro = STATUS_LINE[status] ?? `Your order is now ${status}.`;
    const { text, html } = body(order, shop.name, intro, shop.trackUrl);

    return await sendMail({
      to: email,
      subject: (STATUS_SUBJECT[status] ?? "Order {n} updated").replace("{n}", order.orderNumber),
      text,
      html,
      replyTo: shop.replyTo,
    });
  } catch (error) {
    console.error("[mail] order status email failed", error);
    return { sent: false, reason: "Unexpected error" };
  }
}

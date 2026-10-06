import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { hasAddon, type AddonSource } from "@/lib/addons";
import { Customer } from "@/models/Customer";
import { Notification } from "@/models/Notification";
import { ShopMessage } from "@/models/ShopMessage";
import { pushToBusiness } from "@/services/push-service";

/**
 * Chat between a shop and its website customers ("Chat with customers").
 *
 * Only signed-in customers can chat: the conversation hangs off their
 * customer record, which is what lets the shop see who is writing and lets
 * the customer find the conversation again in their account. Callers pass the
 * business id from their gate and the customer id from the shopper session
 * (storefront) or from a lookup scoped to the business (dashboard) — never
 * from the client.
 */

export type ShopChatMessage = {
  id: string;
  from: "customer" | "shop";
  authorName: string;
  body: string;
  createdAt: string;
  readAt?: string;
};

export type ShopChatCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  type: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  memberSince?: string;
};

export type ShopChatThread = {
  customer: ShopChatCustomer;
  lastMessage: { body: string; from: "customer" | "shop"; createdAt: string };
  /** Customer messages the shop has not opened. */
  unread: number;
};

/** On-site chat needs the add-on and customer accounts, since chat is for signed-in customers. */
export function shopChatEnabled(business: AddonSource, settings?: { customerAccounts?: boolean | null } | null) {
  return hasAddon(business, "whatsapp_chat") && settings?.customerAccounts !== false;
}

function toMessage(message: {
  _id: unknown;
  from: string;
  authorName?: string | null;
  body: string;
  createdAt: Date;
  readAt?: Date | null;
}): ShopChatMessage {
  return {
    id: String(message._id),
    from: message.from === "shop" ? "shop" : "customer",
    authorName: message.authorName ?? "",
    body: message.body,
    createdAt: new Date(message.createdAt).toISOString(),
    readAt: message.readAt ? new Date(message.readAt).toISOString() : undefined,
  };
}

function toCustomer(customer: {
  _id: unknown;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  type?: string | null;
  totalOrders?: number | null;
  totalSpent?: number | null;
  lastOrderAt?: Date | null;
  account?: { createdAt?: Date | null } | null;
}): ShopChatCustomer {
  return {
    id: String(customer._id),
    name: customer.name ?? "Customer",
    phone: customer.phone ?? "",
    email: customer.email ?? undefined,
    address: customer.address ?? undefined,
    city: customer.city ?? undefined,
    district: customer.district ?? undefined,
    type: customer.type ?? "new",
    totalOrders: customer.totalOrders ?? 0,
    totalSpent: customer.totalSpent ?? 0,
    lastOrderAt: customer.lastOrderAt ? new Date(customer.lastOrderAt).toISOString() : undefined,
    memberSince: customer.account?.createdAt ? new Date(customer.account.createdAt).toISOString() : undefined,
  };
}

const PAGE_SIZE = 200;

/** One conversation, oldest first; with `after`, only what is newer (for polling). */
export async function shopChatMessages(businessId: string, customerId: string, after?: string) {
  await connectDB();
  const since = after ? new Date(after) : null;
  const rows = await ShopMessage.find({
    businessId,
    customerId,
    ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { $gt: since } } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE)
    .lean();
  return rows.reverse().map(toMessage);
}

/* ── The customer's side ───────────────────────────────────────────────── */

export async function sendCustomerMessage(
  businessId: string,
  customer: { id: string; name: string },
  body: string,
): Promise<ShopChatMessage> {
  await connectDB();

  // One bell notification per burst: only when the shop had nothing unread
  // from this customer, so ten quick messages do not ring ten times.
  const waiting = await ShopMessage.exists({ businessId, customerId: customer.id, from: "customer", readAt: null });

  const created = await ShopMessage.create({
    businessId,
    customerId: customer.id,
    from: "customer",
    authorName: customer.name,
    body: body.trim(),
  });

  if (!waiting) {
    await Notification.create({
      businessId,
      type: "shop_chat",
      title: `New message from ${customer.name}`,
      body: body.trim().slice(0, 140),
      href: `/messages?customer=${customer.id}`,
    });
  }

  // Unlike the bell, the phone hears every message: a chat is answered
  // message by message, and the app groups them by conversation.
  await pushToBusiness(businessId, {
    title: customer.name,
    body: body.trim().slice(0, 140),
    channel: "messages",
    data: { type: "message", customerId: customer.id },
  });

  return toMessage(created.toObject());
}

export async function markReadByCustomer(businessId: string, customerId: string) {
  await connectDB();
  await ShopMessage.updateMany(
    { businessId, customerId, from: "shop", readAt: null },
    { $set: { readAt: new Date() } },
  );
}

/** Shop replies the customer has not seen, for the badge on the chat button. */
export async function unreadForCustomer(businessId: string, customerId: string) {
  await connectDB();
  return ShopMessage.countDocuments({ businessId, customerId, from: "shop", readAt: null });
}

/* ── The shop's side ───────────────────────────────────────────────────── */

/** The customer behind a conversation, only if they belong to this business. */
export async function shopChatCustomer(businessId: string, customerId: string): Promise<ShopChatCustomer | null> {
  if (!Types.ObjectId.isValid(customerId)) return null;
  await connectDB();
  const customer = await Customer.findOne({ _id: customerId, businessId }).lean();
  return customer ? toCustomer(customer) : null;
}

export async function sendShopMessage(
  businessId: string,
  customerId: string,
  staff: { id: string; name: string },
  body: string,
): Promise<ShopChatMessage> {
  await connectDB();
  const created = await ShopMessage.create({
    businessId,
    customerId,
    from: "shop",
    userId: staff.id,
    authorName: staff.name,
    body: body.trim(),
  });
  // Answering means the shop has read what came before.
  await markReadByShop(businessId, customerId);
  return toMessage(created.toObject());
}

export async function markReadByShop(businessId: string, customerId: string) {
  await connectDB();
  await ShopMessage.updateMany(
    { businessId, customerId, from: "customer", readAt: null },
    { $set: { readAt: new Date() } },
  );
}

/** Customer messages nobody at the shop has opened, for the dashboard nav. */
export async function unreadForShop(businessId: string) {
  await connectDB();
  return ShopMessage.countDocuments({ businessId, from: "customer", readAt: null });
}

/** The shop's conversations: unanswered first, then the most recent. */
export async function listShopThreads(businessId: string, limit = 100): Promise<ShopChatThread[]> {
  await connectDB();

  const grouped = await ShopMessage.aggregate<{
    _id: Types.ObjectId;
    last: { body: string; from: "customer" | "shop"; createdAt: Date };
    unread: number;
  }>([
    { $match: { businessId: new Types.ObjectId(businessId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$customerId",
        last: { $first: { body: "$body", from: "$from", createdAt: "$createdAt" } },
        // `$not` rather than `$eq: null`: in an aggregation a missing field is not null.
        unread: { $sum: { $cond: [{ $and: [{ $eq: ["$from", "customer"] }, { $not: ["$readAt"] }] }, 1, 0] } },
      },
    },
    { $sort: { unread: -1, "last.createdAt": -1 } },
    { $limit: limit },
  ]);

  const customers = await Customer.find({ businessId, _id: { $in: grouped.map((row) => row._id) } }).lean();
  const byId = new Map(customers.map((customer) => [String(customer._id), customer]));

  return grouped
    .filter((row) => byId.has(String(row._id)))
    .map((row) => ({
      customer: toCustomer(byId.get(String(row._id))!),
      lastMessage: { body: row.last.body, from: row.last.from, createdAt: new Date(row.last.createdAt).toISOString() },
      unread: row.unread,
    }));
}

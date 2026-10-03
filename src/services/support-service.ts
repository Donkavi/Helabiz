import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { BusinessMember } from "@/models/BusinessMember";
import { Notification } from "@/models/Notification";
import { SupportMessage } from "@/models/SupportMessage";
import { User } from "@/models/User";
import { Website } from "@/models/Website";
import { OPEN_REQUEST_STATUSES, WebsiteRequest, type WebsiteRequestStatus } from "@/models/WebsiteRequest";
import { REQUEST_PAGE_LABELS, isRequestPage, type RequestPage } from "@/lib/website-request";

/**
 * Help from the Helabiz team: website build requests, the support access
 * that lets the team build in a business's own builder, and the chat between
 * a business and the team.
 *
 * Every function takes the business id from its caller's gate —
 * `requireBusiness` on the business side, `assertSuperAdmin` on the admin
 * side — and never from the client.
 */

/* ── Shapes handed to the screens ──────────────────────────────────────── */

export type ChatMessage = {
  id: string;
  from: "business" | "helabiz";
  authorName: string;
  body: string;
  kind: "text" | "request";
  createdAt: string;
  readAt?: string;
};

export type WebsiteRequestView = {
  id: string;
  businessId: string;
  status: WebsiteRequestStatus;
  phone: string;
  whatsapp: boolean;
  bestTime?: string;
  about: string;
  pages: RequestPage[];
  style?: string;
  links?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

export type AdminWebsiteRequestView = WebsiteRequestView & {
  adminNotes?: string;
  business: { id: string; name: string; slug: string; plan: string; phone?: string };
  requestedBy: { name: string; email: string };
  handledBy?: { name: string };
  /** Whether the admin looking at it can currently open the business. */
  supportAccess: boolean;
  website?: { status: string; subdomain: string };
};

export type SupportThread = {
  businessId: string;
  businessName: string;
  lastMessage: { body: string; from: "business" | "helabiz"; createdAt: string };
  /** Business messages the team has not opened yet. */
  unread: number;
  openRequest?: WebsiteRequestStatus;
};

type RequestRecord = {
  _id: unknown;
  businessId: unknown;
  status?: string | null;
  phone: string;
  whatsapp?: boolean | null;
  bestTime?: string | null;
  about: string;
  pages?: string[] | null;
  style?: string | null;
  links?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
};

function toRequestView(request: RequestRecord): WebsiteRequestView {
  return {
    id: String(request._id),
    businessId: String(request.businessId),
    status: (request.status ?? "new") as WebsiteRequestStatus,
    phone: request.phone,
    whatsapp: request.whatsapp ?? true,
    bestTime: request.bestTime ?? undefined,
    about: request.about,
    pages: (request.pages ?? []).filter(isRequestPage),
    style: request.style ?? undefined,
    links: request.links ?? undefined,
    notes: request.notes ?? undefined,
    createdAt: new Date(request.createdAt).toISOString(),
    updatedAt: new Date(request.updatedAt).toISOString(),
    closedAt: request.closedAt ? new Date(request.closedAt).toISOString() : undefined,
  };
}

function toChatMessage(message: {
  _id: unknown;
  from: string;
  authorName?: string | null;
  body: string;
  kind?: string | null;
  createdAt: Date;
  readAt?: Date | null;
}): ChatMessage {
  return {
    id: String(message._id),
    from: message.from === "helabiz" ? "helabiz" : "business",
    authorName: message.authorName ?? "",
    body: message.body,
    kind: message.kind === "request" ? "request" : "text",
    createdAt: new Date(message.createdAt).toISOString(),
    readAt: message.readAt ? new Date(message.readAt).toISOString() : undefined,
  };
}

/* ── Website requests: the business side ───────────────────────────────── */

/** The business's most recent request, open or closed, for its status card. */
export async function latestWebsiteRequest(businessId: string): Promise<WebsiteRequestView | null> {
  await connectDB();
  const request = await WebsiteRequest.findOne({ businessId }).sort({ createdAt: -1 }).lean();
  return request ? toRequestView(request) : null;
}

export type WebsiteRequestInput = {
  phone: string;
  whatsapp: boolean;
  bestTime?: string;
  about: string;
  pages: RequestPage[];
  style?: string;
  links?: string;
  notes?: string;
};

/**
 * Files a request. One open request per business: a second while the first
 * is still being worked on would only split the team's attention.
 */
export async function createWebsiteRequest(
  businessId: string,
  user: { id: string; name: string },
  input: WebsiteRequestInput,
): Promise<{ ok: true; request: WebsiteRequestView } | { ok: false; error: string }> {
  await connectDB();

  const open = await WebsiteRequest.exists({ businessId, status: { $in: OPEN_REQUEST_STATUSES } });
  if (open) return { ok: false, error: "You already have a request with our team. We will be in touch soon." };

  const created = await WebsiteRequest.create({
    businessId,
    requestedBy: user.id,
    phone: input.phone.trim(),
    whatsapp: input.whatsapp,
    bestTime: input.bestTime?.trim() || undefined,
    about: input.about.trim(),
    pages: input.pages,
    style: input.style?.trim() || undefined,
    links: input.links?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  });

  // The request opens the conversation, so the team and the owner talk about
  // the same thing and the details are there to scroll back to.
  const pageNames = input.pages.map((page) => REQUEST_PAGE_LABELS[page].en).join(", ");
  await SupportMessage.create({
    businessId,
    from: "business",
    userId: user.id,
    authorName: user.name,
    kind: "request",
    body: [
      "Website build request",
      `Phone: ${input.phone.trim()}${input.whatsapp ? " (WhatsApp)" : ""}`,
      input.bestTime ? `Best time to call: ${input.bestTime.trim()}` : "",
      `About the business: ${input.about.trim()}`,
      pageNames ? `Pages: ${pageNames}` : "",
      input.style ? `Style: ${input.style.trim()}` : "",
      input.links ? `Links: ${input.links.trim()}` : "",
      input.notes ? `Notes: ${input.notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return { ok: true, request: toRequestView(created.toObject()) };
}

/* ── Website requests: the Helabiz side ────────────────────────────────── */

export async function openRequestCount() {
  await connectDB();
  return WebsiteRequest.countDocuments({ status: { $in: OPEN_REQUEST_STATUSES } });
}

export async function listWebsiteRequests({
  status,
  page = 1,
  perPage = 25,
}: {
  /** A status, "open" for every unfinished one, or nothing for all. */
  status?: WebsiteRequestStatus | "open";
  page?: number;
  perPage?: number;
}) {
  await connectDB();
  const filter =
    status === "open" ? { status: { $in: OPEN_REQUEST_STATUSES } } : status ? { status } : {};

  const [rows, total] = await Promise.all([
    WebsiteRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    WebsiteRequest.countDocuments(filter),
  ]);

  const businesses = await Business.find({ _id: { $in: rows.map((row) => row.businessId) } })
    .select("name slug plan phone")
    .lean();
  const byId = new Map(businesses.map((business) => [String(business._id), business]));

  return {
    total,
    requests: rows.map((row) => {
      const business = byId.get(String(row.businessId));
      return {
        ...toRequestView(row),
        businessName: business?.name ?? "Deleted business",
        businessPlan: business?.plan ?? "free",
      };
    }),
  };
}

export async function getWebsiteRequestForAdmin(
  requestId: string,
  adminId: string,
): Promise<AdminWebsiteRequestView | null> {
  if (!Types.ObjectId.isValid(requestId)) return null;
  await connectDB();

  const request = await WebsiteRequest.findById(requestId).lean();
  if (!request) return null;

  const [business, requester, handler, website, access] = await Promise.all([
    Business.findById(request.businessId).select("name slug plan phone").lean(),
    User.findById(request.requestedBy).select("name email").lean(),
    request.handledBy ? User.findById(request.handledBy).select("name").lean() : null,
    Website.findOne({ businessId: request.businessId }).select("status subdomain").lean(),
    hasSupportAccess(String(request.businessId), adminId),
  ]);

  return {
    ...toRequestView(request),
    adminNotes: request.adminNotes ?? undefined,
    business: {
      id: String(request.businessId),
      name: business?.name ?? "Deleted business",
      slug: business?.slug ?? "",
      plan: business?.plan ?? "free",
      phone: business?.phone ?? undefined,
    },
    requestedBy: { name: requester?.name ?? "Removed user", email: requester?.email ?? "" },
    handledBy: handler ? { name: handler.name } : undefined,
    supportAccess: access,
    website: website ? { status: website.status ?? "draft", subdomain: website.subdomain } : undefined,
  };
}

/** What the business is told when its request moves on. Both languages, one message. */
const STATUS_NOTE: Partial<Record<WebsiteRequestStatus, string>> = {
  building:
    "We have started building your website. We will message you here when it is ready.\nඅපි ඔබේ website එක හදන්න පටන් ගත්තා. ලෑස්ති වුණාම මෙතනින් කියන්නම්.",
  done:
    "Your website is ready! Have a look, and message us here if you would like anything changed.\nඔබේ website එක ලෑස්තියි! බලලා, මොනවා හරි වෙනස් කරන්න ඕන නම් මෙතනින් අපිට කියන්න.",
  cancelled:
    "We have closed this website request. Message us here any time if you still need help.\nමේ website request එක අපි වසා දැමුවා. තවත් උදව් ඕන නම් ඕනම වෙලාවක මෙතනින් කියන්න.",
};

/**
 * Moves a request along. Finishing or cancelling it also ends the team's
 * support access, so nobody keeps a key to a business they are done with.
 */
export async function updateWebsiteRequest(
  requestId: string,
  admin: { id: string; name: string },
  change: { status?: WebsiteRequestStatus; adminNotes?: string },
) {
  if (!Types.ObjectId.isValid(requestId)) return null;
  await connectDB();

  const request = await WebsiteRequest.findById(requestId);
  if (!request) return null;

  const previous = request.status;
  if (change.adminNotes !== undefined) request.adminNotes = change.adminNotes.trim() || undefined;
  if (change.status && change.status !== previous) {
    request.status = change.status;
    request.handledBy = new Types.ObjectId(admin.id);
    request.closedAt = change.status === "done" || change.status === "cancelled" ? new Date() : undefined;
  }
  await request.save();

  const businessId = String(request.businessId);
  let told = false;
  if (change.status && change.status !== previous) {
    const note = STATUS_NOTE[change.status];
    if (note) {
      await postHelabizMessage(businessId, admin, note, "request");
      told = true;
    }
    if (change.status === "done" || change.status === "cancelled") await revokeSupportAccess(businessId);
  }

  return {
    businessId,
    status: request.status as WebsiteRequestStatus,
    previous: previous as WebsiteRequestStatus,
    // Whether the business got a chat message about the change.
    told,
  };
}

/* ── Support access ────────────────────────────────────────────────────── */

/** Whether this person is in the business through Helabiz support access (not an ordinary membership). */
export async function hasSupportAccess(businessId: string, userId: string) {
  await connectDB();
  const member = await BusinessMember.exists({ businessId, userId, status: "active", support: true });
  return Boolean(member);
}

/**
 * Lets a Helabiz admin into a business so they can build its website in the
 * normal builder. A flagged membership rather than a back door: the owner
 * sees "Helabiz support" in their team, it costs them no seat, and every
 * existing permission check applies to the admin as to any member.
 *
 * Someone who already belongs to the business keeps their own membership.
 */
export async function grantSupportAccess(businessId: string, userId: string) {
  await connectDB();
  const existing = await BusinessMember.findOne({ businessId, userId }).lean();
  if (existing && !existing.support) return { granted: false, alreadyMember: true };

  await BusinessMember.updateOne(
    { businessId, userId },
    { $set: { role: "admin", status: "active", support: true } },
    { upsert: true },
  );
  return { granted: true, alreadyMember: false };
}

/** Ends support access for one admin, or for every admin when none is named. */
export async function revokeSupportAccess(businessId: string, userId?: string) {
  await connectDB();
  const result = await BusinessMember.deleteMany({ businessId, support: true, ...(userId ? { userId } : {}) });
  return result.deletedCount;
}

/* ── Chat ──────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 200;

/** The conversation, oldest first; with `after`, only what is newer (for polling). */
export async function chatMessages(businessId: string, after?: string): Promise<ChatMessage[]> {
  await connectDB();
  const since = after ? new Date(after) : null;
  const filter = since && !Number.isNaN(since.getTime()) ? { businessId, createdAt: { $gt: since } } : { businessId };

  // Newest page, returned oldest first.
  const rows = await SupportMessage.find(filter).sort({ createdAt: -1 }).limit(PAGE_SIZE).lean();
  return rows.reverse().map(toChatMessage);
}

export async function sendBusinessMessage(businessId: string, user: { id: string; name: string }, body: string) {
  await connectDB();
  const created = await SupportMessage.create({
    businessId,
    from: "business",
    userId: user.id,
    authorName: user.name,
    body: body.trim(),
  });
  return toChatMessage(created.toObject());
}

async function postHelabizMessage(
  businessId: string,
  admin: { id: string; name: string },
  body: string,
  kind: "text" | "request" = "text",
) {
  const created = await SupportMessage.create({
    businessId,
    from: "helabiz",
    userId: admin.id,
    // The business talks to "the Helabiz team", with a first name for warmth.
    authorName: `${admin.name.split(" ")[0] || "Helabiz"} · Helabiz team`,
    body: body.trim(),
    kind,
  });

  // The bell in the dashboard, so a reply is noticed without opening the chat.
  await Notification.create({
    businessId,
    type: "support",
    title: "New message from the Helabiz team",
    body: body.trim().split("\n")[0].slice(0, 140),
    href: "/support",
  });

  return toChatMessage(created.toObject());
}

export async function sendHelabizMessage(businessId: string, admin: { id: string; name: string }, body: string) {
  await connectDB();
  return postHelabizMessage(businessId, admin, body);
}

/** The business opened the chat: the team's messages are now read. */
export async function markReadByBusiness(businessId: string) {
  await connectDB();
  await SupportMessage.updateMany({ businessId, from: "helabiz", readAt: null }, { $set: { readAt: new Date() } });
}

/** A Helabiz admin opened the thread: the business's messages are now read. */
export async function markReadByHelabiz(businessId: string) {
  await connectDB();
  await SupportMessage.updateMany({ businessId, from: "business", readAt: null }, { $set: { readAt: new Date() } });
}

/** Team messages this business has not seen, for the dashboard's chat badge. */
export async function unreadForBusiness(businessId: string) {
  await connectDB();
  return SupportMessage.countDocuments({ businessId, from: "helabiz", readAt: null });
}

/** Business messages nobody on the team has opened, for the admin nav. */
export async function unreadForHelabiz() {
  await connectDB();
  return SupportMessage.countDocuments({ from: "business", readAt: null });
}

/** Every conversation, the ones waiting on the team first, then the most recent. */
export async function listSupportThreads(limit = 100): Promise<SupportThread[]> {
  await connectDB();

  const grouped = await SupportMessage.aggregate<{
    _id: Types.ObjectId;
    last: { body: string; from: "business" | "helabiz"; createdAt: Date };
    unread: number;
  }>([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$businessId",
        last: { $first: { body: "$body", from: "$from", createdAt: "$createdAt" } },
        // `$not` rather than `$eq: null`: in an aggregation a missing field is not null.
        unread: { $sum: { $cond: [{ $and: [{ $eq: ["$from", "business"] }, { $not: ["$readAt"] }] }, 1, 0] } },
      },
    },
    { $sort: { unread: -1, "last.createdAt": -1 } },
    { $limit: limit },
  ]);

  const ids = grouped.map((row) => row._id);
  const [businesses, requests] = await Promise.all([
    Business.find({ _id: { $in: ids } }).select("name").lean(),
    WebsiteRequest.find({ businessId: { $in: ids }, status: { $in: OPEN_REQUEST_STATUSES } })
      .select("businessId status")
      .lean(),
  ]);
  const names = new Map(businesses.map((business) => [String(business._id), business.name]));
  const open = new Map(requests.map((request) => [String(request.businessId), request.status as WebsiteRequestStatus]));

  return grouped.map((row) => ({
    businessId: String(row._id),
    businessName: names.get(String(row._id)) ?? "Deleted business",
    lastMessage: {
      body: row.last.body,
      from: row.last.from,
      createdAt: new Date(row.last.createdAt).toISOString(),
    },
    unread: row.unread,
    openRequest: open.get(String(row._id)),
  }));
}

export async function businessName(businessId: string) {
  if (!Types.ObjectId.isValid(businessId)) return null;
  await connectDB();
  const business = await Business.findById(businessId).select("name").lean();
  return business?.name ?? null;
}

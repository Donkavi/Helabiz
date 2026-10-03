import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { sendMail, shopSender } from "@/lib/mailer";
import { normalizePhone } from "@/lib/whatsapp";
import { readShopperSession } from "@/lib/shopper-session";
import { siteUrlFor } from "@/lib/website/urls";
import { escapeHtml } from "@/services/order-mail";

/**
 * Customer accounts on a shop's own website.
 *
 * A shopper's account is the shop's existing `Customer` record with a password
 * added, so the orders they see are exactly the orders the shop sees against
 * them, and registering never creates a second customer for the same phone.
 *
 * That reuse is also the risk: a phone number is not a secret, and the record
 * behind it may already hold a delivery address and order history. So a phone
 * that has ordered here before can only be claimed with one of its order
 * numbers — the same pair the public tracking page already accepts as proof.
 */

const RESET_MINUTES = 60;

export type ShopperProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  memberSince?: string;
};

export type ShopperResult =
  | { ok: true; customerId: string; version: number }
  | { ok: false; error: string; field?: string; needsOrderProof?: boolean };

/** Sri Lankan mobile or landline, in any of the ways people write one. */
export function validPhone(phone: string) {
  return /^94\d{9}$/.test(normalizePhone(phone));
}

/** "0771234567" — the form stored for customers created by registration. */
function localPhone(phone: string) {
  return `0${normalizePhone(phone).slice(2)}`;
}

/**
 * Matches the same number however it was typed into the dashboard or the
 * checkout: "077 123 4567", "+94 77-123-4567", "0771234567" and so on.
 */
function phonePattern(phone: string) {
  const digits = normalizePhone(phone).slice(2).split("");
  const gap = "[\\s()\\-]*";
  return new RegExp(`^${gap}(?:\\+?${gap}9${gap}4|0)?${gap}${digits.join(gap)}${gap}$`);
}

function toProfile(customer: {
  _id: unknown;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  account?: { email?: string | null; createdAt?: Date | null } | null;
}): ShopperProfile {
  return {
    id: String(customer._id),
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    email: customer.account?.email ?? customer.email ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    district: customer.district ?? "",
    memberSince: customer.account?.createdAt ? new Date(customer.account.createdAt).toISOString() : undefined,
  };
}

/** The signed-in customer for this shop, or null. Checks the session is still current. */
export async function currentShopper(businessId: string): Promise<ShopperProfile | null> {
  const session = await readShopperSession(businessId);
  if (!session || !/^[a-f\d]{24}$/i.test(session.customerId)) return null;

  await connectDB();
  const customer = await Customer.findOne({ _id: session.customerId, businessId }).lean();
  if (!customer?.account?.createdAt) return null;
  if ((customer.account.sessionVersion ?? 0) !== session.version) return null;

  return toProfile(customer);
}

export async function registerShopper(
  businessId: string,
  input: { name: string; phone: string; email: string; password: string; orderNumber?: string },
): Promise<ShopperResult> {
  await connectDB();

  if (!validPhone(input.phone)) return { ok: false, field: "phone", error: "Enter a valid Sri Lankan phone number" };
  const email = input.email.trim().toLowerCase();

  const emailTaken = await Customer.exists({ businessId, "account.email": email });
  if (emailTaken) {
    return { ok: false, field: "email", error: "An account already uses this email. Sign in instead." };
  }

  const matches = await Customer.find({ businessId, phone: phonePattern(input.phone) })
    .sort({ totalOrders: -1 })
    .select("_id account")
    .lean();

  if (matches.some((match) => match.account?.createdAt)) {
    return { ok: false, field: "phone", error: "An account already uses this phone number. Sign in instead." };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const account = { email, passwordHash, createdAt: new Date(), lastSignInAt: new Date(), sessionVersion: 0 };

  try {
    if (matches.length) {
      const ids = matches.map((match) => match._id);
      const hasHistory = await Order.exists({ businessId, customerId: { $in: ids } });

      if (hasHistory) {
        const given = (input.orderNumber ?? "").trim().replace(/[^a-z0-9-]/gi, "");
        const proven =
          given &&
          (await Order.exists({ businessId, customerId: { $in: ids }, orderNumber: new RegExp(`^${given}$`, "i") }));
        if (!proven) {
          return {
            ok: false,
            needsOrderProof: true,
            field: given ? "orderNumber" : undefined,
            error: given
              ? "That order number does not match this phone number."
              : "This phone number has ordered here before. Enter one of your order numbers to confirm it's you.",
          };
        }
      }

      const customer = matches[0];
      const claimed = await Customer.updateOne(
        { _id: customer._id, businessId, "account.createdAt": { $exists: false } },
        { $set: { name: input.name.trim(), email, account } },
      );
      // Lost a race with another registration for the same phone.
      if (claimed.modifiedCount === 0) {
        return { ok: false, field: "phone", error: "An account already uses this phone number. Sign in instead." };
      }
      return { ok: true, customerId: String(customer._id), version: 0 };
    }

    const created = await Customer.create({
      businessId,
      name: input.name.trim(),
      phone: localPhone(input.phone),
      email,
      source: "website",
      type: "new",
      account,
    });
    return { ok: true, customerId: String(created._id), version: 0 };
  } catch (error) {
    // Two registrations racing for the same email or phone.
    if ((error as { code?: number }).code === 11000) {
      return { ok: false, error: "An account already exists for these details. Sign in instead." };
    }
    throw error;
  }
}

/** A real hash, so an unknown login costs the same time as a wrong password. */
const DUMMY_HASH = bcrypt.hashSync("helabiz-timing-equaliser", 10);

export async function signInShopper(businessId: string, login: string, password: string): Promise<ShopperResult> {
  await connectDB();
  const value = login.trim();

  const filter = value.includes("@")
    ? { businessId, "account.email": value.toLowerCase() }
    : validPhone(value)
      ? { businessId, phone: phonePattern(value), "account.createdAt": { $exists: true } }
      : null;

  const customer = filter ? await Customer.findOne(filter).select("+account.passwordHash").lean() : null;
  const hash = customer?.account?.passwordHash;
  const valid = await bcrypt.compare(password, hash ?? DUMMY_HASH);

  if (!customer || !hash || !valid) {
    return { ok: false, error: "That email or phone and password don't match." };
  }

  await Customer.updateOne({ _id: customer._id }, { $set: { "account.lastSignInAt": new Date() } });
  return { ok: true, customerId: String(customer._id), version: customer.account?.sessionVersion ?? 0 };
}

export async function updateShopperProfile(
  businessId: string,
  customerId: string,
  input: { name: string; email: string; address?: string; city?: string; district?: string },
): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  await connectDB();
  const email = input.email.trim().toLowerCase();

  const taken = await Customer.exists({ businessId, "account.email": email, _id: { $ne: customerId } });
  if (taken) return { ok: false, field: "email", error: "Another account already uses this email." };

  await Customer.updateOne(
    { _id: customerId, businessId },
    {
      $set: {
        name: input.name.trim(),
        email,
        "account.email": email,
        address: input.address?.trim() || undefined,
        city: input.city?.trim() || undefined,
        district: input.district?.trim() || undefined,
      },
    },
  );
  return { ok: true };
}

/** Changes the password and signs every other device out. Returns the new session version. */
export async function changeShopperPassword(
  businessId: string,
  customerId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ShopperResult> {
  await connectDB();
  const customer = await Customer.findOne({ _id: customerId, businessId }).select("+account.passwordHash").lean();
  const hash = customer?.account?.passwordHash;
  if (!customer || !hash || !(await bcrypt.compare(currentPassword, hash))) {
    return { ok: false, field: "currentPassword", error: "Your current password is not right." };
  }

  const version = (customer.account?.sessionVersion ?? 0) + 1;
  await Customer.updateOne(
    { _id: customerId, businessId },
    { $set: { "account.passwordHash": await bcrypt.hash(newPassword, 10), "account.sessionVersion": version } },
  );
  return { ok: true, customerId, version };
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a one-time password reset link for a customer, replacing any earlier
 * one. Only the token's hash is stored, so the link exists nowhere but here.
 */
async function issueResetLink(slug: string, customerId: unknown, minutes: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  await Customer.updateOne(
    { _id: customerId },
    {
      $set: {
        "account.resetTokenHash": hashToken(token),
        "account.resetExpiresAt": new Date(Date.now() + minutes * 60 * 1000),
      },
    },
  );
  return `${siteUrlFor(slug, "/account/reset")}?token=${token}`;
}

/** How long a link the shop owner hands over by WhatsApp stays good. */
export const OWNER_RESET_HOURS = 24;

/**
 * A reset link for the shop owner to send their customer themselves, for
 * when the customer cannot reach their email or email is not set up here.
 * Null when the customer has no website account.
 */
export async function createShopperResetLink(businessId: string, slug: string, customerId: string) {
  await connectDB();
  const customer = await Customer.findOne({ _id: customerId, businessId, "account.createdAt": { $exists: true } })
    .select("_id")
    .lean();
  if (!customer) return null;
  return issueResetLink(slug, customer._id, OWNER_RESET_HOURS * 60);
}

/**
 * Emails a reset link if the address belongs to an account here. Says nothing
 * either way to the caller, so the form cannot be used to discover accounts.
 */
export async function requestShopperReset(
  shop: { businessId: string; slug: string; name: string; email?: string | null },
  rawEmail: string,
) {
  await connectDB();
  const email = rawEmail.trim().toLowerCase();
  const customer = await Customer.findOne({ businessId: shop.businessId, "account.email": email })
    .select("name")
    .lean();
  if (!customer) return;

  const link = await issueResetLink(shop.slug, customer._id, RESET_MINUTES);
  const greeting = `Hello ${customer.name || "there"},`;
  const intro = `Someone asked to reset the password for your ${shop.name} account. If it was you, use the link below within ${RESET_MINUTES} minutes. If not, you can ignore this email.`;

  await sendMail({
    to: email,
    subject: `Reset your ${shop.name} password`,
    replyTo: shop.email ?? undefined,
    from: shopSender(shop),
    text: [greeting, "", intro, "", link, "", shop.name].join("\n"),
    html: [
      `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;color:#1a1a1a">`,
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(intro)}</p>`,
      `<p style="margin-top:22px"><a href="${escapeHtml(link)}" style="background:#0f9b7d;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Choose a new password</a></p>`,
      `<p style="margin-top:24px;color:#666;font-size:13px">${escapeHtml(shop.name)}</p>`,
      `</div>`,
    ].join(""),
  });
}

export async function resetShopperPassword(businessId: string, token: string, password: string): Promise<ShopperResult> {
  await connectDB();
  const customer = await Customer.findOne({
    businessId,
    "account.resetTokenHash": hashToken(token),
    "account.resetExpiresAt": { $gt: new Date() },
  })
    .select("account.sessionVersion")
    .lean();
  if (!customer) return { ok: false, error: "This reset link has expired or was already used. Ask for a new one." };

  const version = (customer.account?.sessionVersion ?? 0) + 1;
  await Customer.updateOne(
    { _id: customer._id },
    {
      $set: { "account.passwordHash": await bcrypt.hash(password, 10), "account.sessionVersion": version },
      $unset: { "account.resetTokenHash": "", "account.resetExpiresAt": "" },
    },
  );
  return { ok: true, customerId: String(customer._id), version };
}

export type ShopperOrderSummary = {
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  firstItem: string;
  image?: string;
  createdAt: string;
};

export async function shopperOrders(businessId: string, customerId: string): Promise<ShopperOrderSummary[]> {
  await connectDB();
  const orders = await Order.find({ businessId, customerId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("orderNumber status total items.name items.quantity items.image createdAt")
    .lean();

  return orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status ?? "pending",
    total: order.total ?? 0,
    itemCount: (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    firstItem: order.items?.[0]?.name ?? "",
    image: order.items?.find((item) => item.image)?.image ?? undefined,
    createdAt: new Date(order.createdAt).toISOString(),
  }));
}

/** One of the signed-in customer's own orders. Never someone else's. */
export async function shopperOrder(businessId: string, customerId: string, orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ businessId, customerId, orderNumber })
    // What the shop paid and what it wrote for itself stay in the dashboard.
    .select("-cost -items.costPrice -notes -inventoryApplied -timeline.note")
    .lean();
  return order ? serialize(order) : null;
}

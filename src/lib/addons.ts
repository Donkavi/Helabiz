/**
 * Website add-ons.
 *
 * Extras a shop switches on for its published site, billed monthly on top of
 * the plan. They are deliberately not plan limits: a business on any paid plan
 * can have any combination, and each one is paid for and expires on its own.
 *
 * Like `lib/access.ts`, this module imports nothing — the storefront, the
 * dashboard and the billing screens all read the same catalogue and the same
 * arithmetic rather than three copies that drift.
 */
export const ADDON_PRICE = 200;

/** How long one paid add-on period lasts, matching the plan cycle. */
export const ADDON_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type AddonId = "order_email" | "whatsapp_chat" | "order_tracking";

export type Addon = {
  id: AddonId;
  name: string;
  tagline: string;
  description: string;
  /** Rupees per month. */
  price: number;
};

export const ADDONS: Record<AddonId, Addon> = {
  order_email: {
    id: "order_email",
    name: "Email order updates",
    tagline: "Tell customers their order is on the way",
    description:
      "Every customer who leaves an email address gets a confirmation when they order, and another message whenever you change the order's status.",
    price: ADDON_PRICE,
  },
  whatsapp_chat: {
    id: "whatsapp_chat",
    name: "Chat with customers",
    tagline: "Live chat and WhatsApp on every page",
    description:
      "A chat button follows your customers around the site. Signed-in customers chat with you right there — you answer from Messages in your dashboard, with their details and orders beside the chat — and anyone can tap through to WhatsApp instead.",
    price: ADDON_PRICE,
  },
  order_tracking: {
    id: "order_tracking",
    name: "Order tracking",
    tagline: "Let customers check on their own order",
    description:
      "A tracking page on your website where a customer types their order number and phone to see where their order has got to — instead of messaging you to ask.",
    price: ADDON_PRICE,
  },
};

export const ADDON_LIST: Addon[] = [ADDONS.order_email, ADDONS.whatsapp_chat, ADDONS.order_tracking];

/**
 * The add-ons on sale right now.
 *
 * Email order updates is only offered while this installation can actually
 * send email: selling it otherwise bills a shop for messages that never
 * leave. The caller says whether mail is configured, since this module reads
 * no environment of its own.
 */
export function offeredAddonIds(emailReady: boolean): AddonId[] {
  return ADDON_LIST.filter((addon) => addon.id !== "order_email" || emailReady).map((addon) => addon.id);
}

export function isAddonId(value: unknown): value is AddonId {
  return value === "order_email" || value === "whatsapp_chat" || value === "order_tracking";
}

/** What a business stores for each add-on it has ever bought. */
export type AddonRecord = { id?: string | null; endsAt?: Date | string | null };

export type AddonSource = { addons?: AddonRecord[] | null };

export type AddonStatus = {
  addon: Addon;
  active: boolean;
  endsAt?: Date;
  daysLeft: number;
  /** Bought before and lapsed, as opposed to never bought at all. */
  lapsed: boolean;
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The add-ons a business may use right now. */
export function activeAddons(source: AddonSource, now: Date = new Date()): Set<AddonId> {
  const live = new Set<AddonId>();
  for (const record of source.addons ?? []) {
    if (!isAddonId(record?.id)) continue;
    const endsAt = asDate(record.endsAt);
    if (endsAt && endsAt.getTime() > now.getTime()) live.add(record.id);
  }
  return live;
}

/** Whether one add-on is switched on. The gate every feature checks. */
export function hasAddon(source: AddonSource, id: AddonId, now: Date = new Date()) {
  return activeAddons(source, now).has(id);
}

/** Every add-on with where it stands, for the billing and website screens. */
export function addonStatuses(source: AddonSource, now: Date = new Date()): AddonStatus[] {
  return ADDON_LIST.map((addon) => {
    const record = (source.addons ?? []).find((r) => r?.id === addon.id);
    const endsAt = asDate(record?.endsAt);
    const active = Boolean(endsAt && endsAt.getTime() > now.getTime());
    return {
      addon,
      active,
      endsAt,
      daysLeft: active && endsAt ? Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS) : 0,
      lapsed: Boolean(endsAt) && !active,
    };
  });
}

/**
 * When an add-on period starting now would run out.
 *
 * Paying while one is still running extends it rather than restarting, so
 * renewing early never costs the remaining days — the same rule the plan uses.
 */
export function addonEndFrom(current: Date | string | null | undefined, now: Date = new Date()) {
  const existing = asDate(current);
  const base = existing && existing.getTime() > now.getTime() ? existing : now;
  return new Date(base.getTime() + ADDON_DAYS * DAY_MS);
}

/** What a set of add-ons costs per month. */
export function addonsTotal(ids: readonly string[]) {
  return ids.filter(isAddonId).reduce((sum, id) => sum + ADDONS[id].price, 0);
}

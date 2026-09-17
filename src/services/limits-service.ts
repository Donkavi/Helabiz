import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { BusinessMember } from "@/models/BusinessMember";
import { getPlan, UNLIMITED, type Plan } from "@/lib/plans";
import { isPremiumTemplate } from "@/lib/website/templates";
import { monthStart } from "./metrics-service";

export class LimitError extends Error {
  constructor(
    message: string,
    public readonly limitKey: keyof Plan["limits"],
  ) {
    super(message);
    this.name = "LimitError";
  }
}

export async function planFor(businessId: string) {
  await connectDB();
  const business = await Business.findById(businessId).select("plan").lean();
  return getPlan(business?.plan);
}

export type UsageSnapshot = {
  plan: Plan;
  orders: { used: number; limit: number };
  products: { used: number; limit: number };
  pages: { used: number; limit: number };
  websites: { used: number; limit: number };
  team: { used: number; limit: number };
};

export async function usageFor(businessId: string): Promise<UsageSnapshot> {
  const plan = await planFor(businessId);
  const website = await Website.findOne({ businessId }).select("_id").lean();

  const [orders, products, pages, websites, team] = await Promise.all([
    Order.countDocuments({ businessId, createdAt: { $gte: monthStart() } }),
    Product.countDocuments({ businessId, status: { $ne: "archived" } }),
    website ? WebsitePage.countDocuments({ websiteId: website._id }) : 0,
    Website.countDocuments({ businessId }),
    BusinessMember.countDocuments({ businessId, status: { $ne: "disabled" } }),
  ]);

  return {
    plan,
    orders: { used: orders, limit: plan.limits.ordersPerMonth },
    products: { used: products, limit: plan.limits.products },
    pages: { used: pages, limit: plan.limits.pages },
    websites: { used: websites, limit: plan.limits.websites },
    team: { used: team, limit: plan.limits.teamMembers },
  };
}

export type LimitKey = "orders" | "products" | "pages" | "websites" | "team";

/** What the UI needs to explain a limit and offer the right way past it. */
export type LimitBlock = {
  key: LimitKey;
  used: number;
  max: number;
  planId: string;
  planName: string;
  message: string;
};

const LIMIT_MESSAGES: Record<LimitKey, (plan: string, max: number) => string> = {
  orders: (plan, max) => `The ${plan} plan covers ${max} orders a month, and this month is full.`,
  products: (plan, max) => `The ${plan} plan covers ${max} products, and you have used them all.`,
  pages: (plan, max) => `The ${plan} plan covers ${max} website pages, and you have used them all.`,
  websites: (plan, max) => `The ${plan} plan covers ${max} website.`,
  team: (plan, max) => `The ${plan} plan covers ${max} staff accounts.`,
};

/**
 * Non-throwing limit check. Returns the detail a screen needs to show a real
 * upgrade prompt rather than a bare error.
 */
export async function checkLimit(businessId: string, key: LimitKey): Promise<LimitBlock | null> {
  const usage = await usageFor(businessId);
  const entry = usage[key];
  if (!entry || entry.limit === UNLIMITED || entry.used < entry.limit) return null;

  return {
    key,
    used: entry.used,
    max: entry.limit,
    planId: usage.plan.id,
    planName: usage.plan.name,
    message: LIMIT_MESSAGES[key](usage.plan.name, entry.limit),
  };
}

/** Throws a LimitError when adding one more of `key` would exceed the plan. */
export async function assertWithinLimit(businessId: string, key: LimitKey) {
  const block = await checkLimit(businessId, key);
  if (block) throw new LimitError(block.message, key as keyof Plan["limits"]);
}

/** Feature gates that are on/off rather than counted. */
/**
 * Whether a plan may build from a given template. Free plans get the designs
 * marked `tier: "free"`; every paid plan gets all of them.
 */
export async function canUseTemplate(businessId: string, templateId: string) {
  const plan = await planFor(businessId);
  if (plan.limits.templates === UNLIMITED) return true;
  return !isPremiumTemplate(templateId);
}

export async function hasFeature(businessId: string, feature: keyof Plan["limits"]) {
  const plan = await planFor(businessId);
  return Boolean(plan.limits[feature]);
}

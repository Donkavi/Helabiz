import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { BusinessMember } from "@/models/BusinessMember";
import { getPlan, UNLIMITED, type Plan } from "@/lib/plans";
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

/** Throws a LimitError when adding one more of `key` would exceed the plan. */
export async function assertWithinLimit(businessId: string, key: keyof UsageSnapshot & string) {
  const usage = await usageFor(businessId);
  const entry = usage[key as "orders"];
  if (!entry || entry.limit === UNLIMITED) return;

  if (entry.used >= entry.limit) {
    const labels: Record<string, string> = {
      orders: `Your ${usage.plan.name} plan allows ${entry.limit} orders per month. Upgrade to keep taking orders.`,
      products: `Your ${usage.plan.name} plan allows ${entry.limit} products. Upgrade to add more.`,
      pages: `Your ${usage.plan.name} plan allows ${entry.limit} website pages. Upgrade to add more.`,
      websites: `Your ${usage.plan.name} plan allows ${entry.limit} website. Upgrade to create another.`,
      team: `Your ${usage.plan.name} plan allows ${entry.limit} staff accounts. Upgrade to invite more.`,
    };
    throw new LimitError(labels[key] ?? "You have reached a plan limit.", key as keyof Plan["limits"]);
  }
}

/** Feature gates that are on/off rather than counted. */
export async function hasFeature(businessId: string, feature: keyof Plan["limits"]) {
  const plan = await planFor(businessId);
  return Boolean(plan.limits[feature]);
}

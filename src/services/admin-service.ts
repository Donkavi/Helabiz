import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { BusinessMember } from "@/models/BusinessMember";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { Website } from "@/models/Website";
import { Subscription } from "@/models/Subscription";
import { AuditLog } from "@/models/AuditLog";
import { getPlan, type Plan } from "@/lib/plans";
import type { PlanId } from "@/types";

/**
 * Reads and writes that span every tenant.
 *
 * Deliberately the only module in the app that queries without a `businessId`
 * filter. Keeping that in one file means there is a single place to audit for
 * "does this leak one business's data into another's screen" — everywhere else
 * the answer is structurally no, because the filter comes from the access gate.
 *
 * Nothing here checks permissions. Callers do, before calling.
 */

const PAGE_SIZE = 25;

function monthsAgo(n: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export type PlatformStats = {
  businesses: { total: number; active: number; suspended: number; newThisMonth: number };
  users: { total: number; admins: number; newThisMonth: number };
  websites: { total: number; published: number };
  orders: { total: number; thisMonth: number; revenueThisMonth: number };
  plans: { plan: Plan; count: number; share: number }[];
  signupsByMonth: { month: string; businesses: number }[];
};

export async function platformStats(): Promise<PlatformStats> {
  await connectDB();

  const monthStart = startOfMonth();

  const [
    businesses,
    suspended,
    newBusinesses,
    users,
    admins,
    newUsers,
    websites,
    published,
    orders,
    ordersThisMonth,
    revenueAgg,
    planCounts,
    signups,
  ] = await Promise.all([
    Business.countDocuments({}),
    Business.countDocuments({ status: "suspended" }),
    Business.countDocuments({ createdAt: { $gte: monthStart } }),
    User.countDocuments({}),
    User.countDocuments({ platformRole: "admin" }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Website.countDocuments({}),
    Website.countDocuments({ status: "published" }),
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.aggregate<{ _id: null; total: number }>([
      { $match: { createdAt: { $gte: monthStart }, status: { $nin: ["cancelled", "returned"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Business.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    Business.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: monthsAgo(11) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byPlan = new Map(planCounts.map((row) => [row._id ?? "free", row.count]));
  const total = businesses || 1;

  // Twelve months, including the empty ones, so the chart has an even axis.
  const months: { month: string; businesses: number }[] = [];
  const found = new Map(signups.map((row) => [row._id, row.count]));
  for (let i = 11; i >= 0; i--) {
    const date = monthsAgo(i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: key, businesses: found.get(key) ?? 0 });
  }

  return {
    businesses: {
      total: businesses,
      active: businesses - suspended,
      suspended,
      newThisMonth: newBusinesses,
    },
    users: { total: users, admins, newThisMonth: newUsers },
    websites: { total: websites, published },
    orders: {
      total: orders,
      thisMonth: ordersThisMonth,
      revenueThisMonth: revenueAgg[0]?.total ?? 0,
    },
    plans: (["free", "starter", "business"] as PlanId[]).map((id) => ({
      plan: getPlan(id),
      count: byPlan.get(id) ?? 0,
      share: ((byPlan.get(id) ?? 0) / total) * 100,
    })),
    signupsByMonth: months,
  };
}

/* ── Businesses ───────────────────────────────────────────────────────── */

export type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  city?: string;
  ownerName: string;
  ownerEmail: string;
  orders: number;
  products: number;
  websiteStatus: string;
  createdAt: string;
};

export type BusinessQuery = {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
};

export async function listBusinesses(query: BusinessQuery = {}) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (query.plan && query.plan !== "all") filter.plan = query.plan;
  if (query.status && query.status !== "all") filter.status = query.status;
  if (query.search?.trim()) {
    // Escaped: a name can legitimately contain regex characters.
    const safe = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { slug: rx }, { email: rx }, { phone: rx }];
  }

  const page = Math.max(1, query.page ?? 1);
  const [total, docs] = await Promise.all([
    Business.countDocuments(filter),
    Business.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);

  const ids = docs.map((b) => b._id);
  const ownerIds = docs.map((b) => b.ownerId).filter(Boolean);

  const [owners, orderCounts, productCounts, websites] = await Promise.all([
    User.find({ _id: { $in: ownerIds } } as never).select("name email").lean(),
    Order.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { businessId: { $in: ids } } },
      { $group: { _id: "$businessId", count: { $sum: 1 } } },
    ]),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { businessId: { $in: ids } } },
      { $group: { _id: "$businessId", count: { $sum: 1 } } },
    ]),
    Website.find({ businessId: { $in: ids } } as never).select("businessId status").lean(),
  ]);

  const ownerById = new Map(owners.map((u) => [String(u._id), u]));
  const ordersById = new Map(orderCounts.map((r) => [String(r._id), r.count]));
  const productsById = new Map(productCounts.map((r) => [String(r._id), r.count]));
  const siteById = new Map(websites.map((w) => [String(w.businessId), w.status]));

  const rows: BusinessRow[] = docs.map((b) => {
    const owner = ownerById.get(String(b.ownerId));
    return {
      id: String(b._id),
      name: b.name,
      slug: b.slug,
      plan: b.plan ?? "free",
      status: b.status ?? "active",
      city: b.city ?? undefined,
      ownerName: owner?.name ?? "—",
      ownerEmail: owner?.email ?? "—",
      orders: ordersById.get(String(b._id)) ?? 0,
      products: productsById.get(String(b._id)) ?? 0,
      websiteStatus: siteById.get(String(b._id)) ?? "none",
      createdAt: String(b.createdAt),
    };
  });

  return { rows, total, page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function businessDetail(businessId: string) {
  if (!Types.ObjectId.isValid(businessId)) return null;
  await connectDB();

  const business = await Business.findById(businessId).lean();
  if (!business) return null;

  const [owner, members, orders, products, customers, website, subscription, revenue, recentOrders] =
    await Promise.all([
      User.findById(business.ownerId).select("name email image createdAt").lean(),
      BusinessMember.find({ businessId }).lean(),
      Order.countDocuments({ businessId }),
      Product.countDocuments({ businessId }),
      Customer.countDocuments({ businessId }),
      Website.findOne({ businessId }).select("subdomain status publishedAt").lean(),
      Subscription.findOne({ businessId }).lean(),
      Order.aggregate<{ _id: null; total: number }>([
        { $match: { businessId: new Types.ObjectId(businessId), status: { $nin: ["cancelled", "returned"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find({ businessId }).sort({ createdAt: -1 }).limit(5).select("orderNumber total status createdAt").lean(),
    ]);

  const memberUsers = await User.find({ _id: { $in: members.map((m) => m.userId) } } as never)
    .select("name email")
    .lean();
  const userById = new Map(memberUsers.map((u) => [String(u._id), u]));

  return {
    id: String(business._id),
    name: business.name,
    slug: business.slug,
    plan: (business.plan ?? "free") as PlanId,
    status: business.status ?? "active",
    suspendedReason: business.suspendedReason ?? undefined,
    type: business.type ?? undefined,
    city: business.city ?? undefined,
    district: business.district ?? undefined,
    phone: business.phone ?? undefined,
    email: business.email ?? undefined,
    createdAt: String(business.createdAt),
    owner: owner
      ? { id: String(owner._id), name: owner.name, email: owner.email, joinedAt: String(owner.createdAt) }
      : null,
    members: members.map((m) => ({
      id: String(m._id),
      userId: String(m.userId),
      name: userById.get(String(m.userId))?.name ?? "—",
      email: userById.get(String(m.userId))?.email ?? "—",
      role: m.role,
      status: m.status,
    })),
    counts: { orders, products, customers, revenue: revenue[0]?.total ?? 0 },
    website: website
      ? { subdomain: website.subdomain, status: website.status, publishedAt: website.publishedAt ? String(website.publishedAt) : undefined }
      : null,
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          interval: subscription.interval,
          currentPeriodEnd: subscription.currentPeriodEnd ? String(subscription.currentPeriodEnd) : undefined,
        }
      : null,
    recentOrders: recentOrders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      createdAt: String(o.createdAt),
    })),
  };
}

/* ── Users ────────────────────────────────────────────────────────────── */

export type UserRow = {
  id: string;
  name: string;
  email: string;
  platformRole: string;
  businesses: number;
  createdAt: string;
};

export async function listUsers(query: { search?: string; role?: string; page?: number } = {}) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (query.role === "admin") filter.platformRole = "admin";
  if (query.search?.trim()) {
    const safe = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const page = Math.max(1, query.page ?? 1);
  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select("name email platformRole createdAt")
      .lean(),
  ]);

  const counts = await BusinessMember.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { userId: { $in: docs.map((u) => u._id) }, status: "active" } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const byUser = new Map(counts.map((r) => [String(r._id), r.count]));

  const rows: UserRow[] = docs.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    platformRole: u.platformRole ?? "user",
    businesses: byUser.get(String(u._id)) ?? 0,
    createdAt: String(u.createdAt),
  }));

  return { rows, total, page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/* ── Audit ────────────────────────────────────────────────────────────── */

export async function listAdminAudit(limit = 100) {
  await connectDB();
  const logs = await AuditLog.find({ action: { $regex: "^admin\\." } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const [users, businesses] = await Promise.all([
    User.find({ _id: { $in: logs.map((l) => l.userId).filter(Boolean) } } as never).select("name email").lean(),
    Business.find({ _id: { $in: logs.map((l) => l.businessId).filter(Boolean) } } as never).select("name").lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const bizById = new Map(businesses.map((b) => [String(b._id), b]));

  return logs.map((log) => ({
    id: String(log._id),
    action: log.action.replace(/^admin\./, ""),
    admin: userById.get(String(log.userId))?.email ?? "—",
    business: log.businessId ? (bizById.get(String(log.businessId))?.name ?? "—") : null,
    entity: log.entity ?? undefined,
    meta: (log.meta ?? {}) as Record<string, unknown>,
    createdAt: String(log.createdAt),
  }));
}

/* ── Mutations ────────────────────────────────────────────────────────── */

export async function setBusinessPlan(businessId: string, plan: PlanId) {
  await connectDB();
  await Business.updateOne({ _id: businessId }, { $set: { plan } });
  // Keep the subscription record in step; billing reads from it.
  await Subscription.updateOne({ businessId }, { $set: { plan } }, { upsert: true });
}

export async function setBusinessStatus(businessId: string, status: "active" | "suspended", reason?: string) {
  await connectDB();
  await Business.updateOne(
    { _id: businessId },
    status === "suspended"
      ? { $set: { status, suspendedAt: new Date(), suspendedReason: reason ?? "" } }
      : { $set: { status }, $unset: { suspendedAt: "", suspendedReason: "" } },
  );
}

export async function setPlatformRole(userId: string, role: "user" | "admin") {
  await connectDB();
  await User.updateOne({ _id: userId }, { $set: { platformRole: role } });
}

/** How many platform admins exist, so the last one cannot be demoted. */
export async function adminCount() {
  await connectDB();
  return User.countDocuments({ platformRole: "admin" });
}

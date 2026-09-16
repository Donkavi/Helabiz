import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Expense } from "@/models/Expense";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import type { OrderStatus } from "@/types";

/** Orders in these states are treated as real revenue. */
export const REVENUE_STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(days: number) {
  const d = startOfDay();
  d.setDate(d.getDate() - days);
  return d;
}

export function monthStart(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Range = { from: Date; to: Date };

async function sumOrders(businessId: string, range: Range) {
  const [row] = await Order.aggregate<{ revenue: number; cost: number; count: number; items: number }>([
    {
      $match: {
        businessId: new Types.ObjectId(businessId),
        status: { $in: REVENUE_STATUSES },
        createdAt: { $gte: range.from, $lt: range.to },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$total" },
        cost: { $sum: "$cost" },
        count: { $sum: 1 },
        items: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);
  return { revenue: row?.revenue ?? 0, cost: row?.cost ?? 0, count: row?.count ?? 0, items: row?.items ?? 0 };
}

async function sumExpenses(businessId: string, range: Range) {
  const [row] = await Expense.aggregate<{ total: number }>([
    { $match: { businessId: new Types.ObjectId(businessId), date: { $gte: range.from, $lt: range.to } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return row?.total ?? 0;
}

export type PeriodSummary = {
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
  orders: number;
  items: number;
};

export async function summarise(businessId: string, range: Range): Promise<PeriodSummary> {
  const [orders, expenses] = await Promise.all([sumOrders(businessId, range), sumExpenses(businessId, range)]);
  return {
    revenue: orders.revenue,
    cost: orders.cost,
    expenses,
    profit: orders.revenue - orders.cost - expenses,
    orders: orders.count,
    items: orders.items,
  };
}

/** Daily revenue/profit series used by the dashboard and report charts. */
export async function dailySeries(businessId: string, days: number) {
  const from = daysAgo(days - 1);
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const [orderRows, expenseRows] = await Promise.all([
    Order.aggregate<{ _id: string; revenue: number; cost: number; orders: number }>([
      {
        $match: {
          businessId: new Types.ObjectId(businessId),
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Colombo" } },
          revenue: { $sum: "$total" },
          cost: { $sum: "$cost" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { businessId: new Types.ObjectId(businessId), date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Colombo" } },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const revenueBy = new Map(orderRows.map((r) => [r._id, r]));
  const expenseBy = new Map(expenseRows.map((r) => [r._id, r.total]));

  const series: { date: string; label: string; revenue: number; expenses: number; profit: number; orders: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const row = revenueBy.get(key);
    const expenses = expenseBy.get(key) ?? 0;
    const revenue = row?.revenue ?? 0;
    series.push({
      date: key,
      label: day.toLocaleDateString("en-LK", { day: "numeric", month: "short" }),
      revenue,
      expenses,
      profit: revenue - (row?.cost ?? 0) - expenses,
      orders: row?.orders ?? 0,
    });
  }
  return series;
}

export async function topProducts(businessId: string, limit = 5, from?: Date) {
  return Order.aggregate<{ _id: string; name: string; quantity: number; revenue: number; image?: string }>([
    {
      $match: {
        businessId: new Types.ObjectId(businessId),
        status: { $in: REVENUE_STATUSES },
        ...(from ? { createdAt: { $gte: from } } : {}),
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: { $ifNull: ["$items.productId", "$items.name"] },
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);
}

export async function lowStockProducts(businessId: string, limit = 50) {
  return Product.find({
    businessId,
    trackInventory: true,
    status: { $ne: "archived" },
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  })
    .sort({ stock: 1 })
    .limit(limit)
    .lean();
}

export async function websiteMetrics(businessId: string, from: Date) {
  const [rows, websiteOrders] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number; visitors: string[] }>([
      { $match: { businessId: new Types.ObjectId(businessId), createdAt: { $gte: from } } },
      { $group: { _id: "$type", count: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
    ]),
    Order.countDocuments({ businessId, source: "website", createdAt: { $gte: from } }),
  ]);

  const by = new Map(rows.map((r) => [r._id, r]));
  const pageViews = by.get("page_view")?.count ?? 0;
  const visitors = by.get("page_view")?.visitors.filter(Boolean).length ?? 0;

  return {
    pageViews,
    visitors,
    productViews: by.get("product_view")?.count ?? 0,
    addToCart: by.get("add_to_cart")?.count ?? 0,
    checkouts: by.get("begin_checkout")?.count ?? 0,
    orders: websiteOrders,
    conversionRate: visitors > 0 ? (websiteOrders / visitors) * 100 : 0,
  };
}

/** The full payload behind the dashboard home page (spec §33). */
export async function getDashboardData(businessId: string) {
  await connectDB();

  const now = new Date();
  const todayStart = startOfDay();
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [today, yesterday, month, lastMonth, series, top, lowStock, web, recentOrders, customerCount] =
    await Promise.all([
      summarise(businessId, { from: todayStart, to: tomorrow }),
      summarise(businessId, { from: yesterdayStart, to: todayStart }),
      summarise(businessId, { from: monthStart(), to: now }),
      summarise(businessId, {
        from: monthStart(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: monthStart(),
      }),
      dailySeries(businessId, 30),
      topProducts(businessId, 5, daysAgo(30)),
      lowStockProducts(businessId, 6),
      websiteMetrics(businessId, daysAgo(30)),
      Order.find({ businessId }).sort({ createdAt: -1 }).limit(6).lean(),
      Customer.countDocuments({ businessId }),
    ]);

  return { today, yesterday, month, lastMonth, series, top, lowStock, web, recentOrders, customerCount };
}

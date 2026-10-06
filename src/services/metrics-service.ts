import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Expense } from "@/models/Expense";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { productSummary } from "@/lib/products";
import type { OrderStatus } from "@/types";

/** Orders in these states are treated as real revenue. */
export const REVENUE_STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

/**
 * Day and month boundaries are Sri Lankan, whatever timezone the server runs
 * in — Vercel runs in UTC, a developer's laptop in +05:30, and "today's
 * sales" must mean the same thing on both. Sri Lanka has had no daylight
 * saving since 2006, so a fixed offset is exact.
 */
export const TIMEZONE = "Asia/Colombo";
const OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The instant shifted so its UTC fields read as Sri Lankan wall-clock time. */
function wallClock(date: Date) {
  return new Date(date.getTime() + OFFSET_MS);
}

/** `YYYY-MM-DD` of an instant in Sri Lanka. */
export function colomboDateKey(date: Date) {
  return wallClock(date).toISOString().slice(0, 10);
}

export function startOfDay(date = new Date()) {
  const local = wallClock(date);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_MS);
}

export function daysAgo(days: number) {
  return new Date(startOfDay().getTime() - days * DAY_MS);
}

/** The first moment of the month `date` falls in, `monthsBack` months earlier. */
export function monthStart(date = new Date(), monthsBack = 0) {
  const local = wallClock(date);
  const first = Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - monthsBack, 1);
  return new Date(first - OFFSET_MS);
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
  const to = new Date(startOfDay().getTime() + DAY_MS - 1);

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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: TIMEZONE } },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const revenueBy = new Map(orderRows.map((r) => [r._id, r]));
  const expenseBy = new Map(expenseRows.map((r) => [r._id, r.total]));

  const series: { date: string; label: string; revenue: number; expenses: number; profit: number; orders: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(from.getTime() + i * DAY_MS);
    // Keyed in Sri Lankan time to match the `$dateToString` groups above. A UTC
    // key here put every bar one day early on a +05:30 server.
    const key = colomboDateKey(day);
    const row = revenueBy.get(key);
    const expenses = expenseBy.get(key) ?? 0;
    const revenue = row?.revenue ?? 0;
    series.push({
      date: key,
      label: day.toLocaleDateString("en-LK", { day: "numeric", month: "short", timeZone: TIMEZONE }),
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

/**
 * Everything the reports screen shows for the last `days` days, compared
 * with the `days` before that. Shared by the web reports page and the
 * mobile app, so the two can never disagree about a number.
 */
export async function getReportData(businessId: string, days: number) {
  await connectDB();
  const oid = new Types.ObjectId(businessId);
  const from = daysAgo(days - 1);
  const previousFrom = daysAgo(days * 2 - 1);

  const [current, previous, series, top, expenseSplit, customerStats, inventoryValue, web] = await Promise.all([
    summarise(businessId, { from, to: new Date() }),
    summarise(businessId, { from: previousFrom, to: from }),
    dailySeries(businessId, days),
    topProducts(businessId, 10, from),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { businessId: oid, date: { $gte: from } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Customer.aggregate<{ _id: null; total: number; repeat: number; spend: number }>([
      { $match: { businessId: oid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          repeat: { $sum: { $cond: [{ $gt: ["$totalOrders", 1] }, 1, 0] } },
          spend: { $sum: "$totalSpent" },
        },
      },
    ]),
    // Summed per variant where a product has them, since each carries its own cost and price.
    Product.find({ businessId: oid, status: { $ne: "archived" }, trackInventory: true })
      .select("price costPrice stock variants")
      .lean()
      .then((products) =>
        products.reduce(
          (total, product) => {
            const summary = productSummary(product);
            return {
              cost: total.cost + summary.stockValue,
              retail: total.retail + summary.retailValue,
              units: total.units + summary.stock,
            };
          },
          { cost: 0, retail: 0, units: 0 },
        ),
      ),
    websiteMetrics(businessId, from),
  ]);

  const customers = customerStats[0] ?? { total: 0, repeat: 0, spend: 0 };
  const grossProfit = current.revenue - current.cost;
  const margin = current.revenue > 0 ? (grossProfit / current.revenue) * 100 : 0;

  return {
    current,
    previous,
    series,
    top,
    expenseSplit,
    customers: { total: customers.total, repeat: customers.repeat, spend: customers.spend },
    inventory: inventoryValue,
    web,
    grossProfit,
    margin,
  };
}

/** The full payload behind the dashboard home page (spec §33). */
export async function getDashboardData(businessId: string) {
  await connectDB();

  const now = new Date();
  const todayStart = startOfDay();
  const tomorrow = new Date(todayStart.getTime() + DAY_MS);
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);

  const [today, yesterday, month, lastMonth, series, top, lowStock, web, recentOrders, customerCount] =
    await Promise.all([
      summarise(businessId, { from: todayStart, to: tomorrow }),
      summarise(businessId, { from: yesterdayStart, to: todayStart }),
      summarise(businessId, { from: monthStart(), to: now }),
      summarise(businessId, { from: monthStart(now, 1), to: monthStart() }),
      dailySeries(businessId, 30),
      topProducts(businessId, 5, daysAgo(30)),
      lowStockProducts(businessId, 6),
      websiteMetrics(businessId, daysAgo(30)),
      Order.find({ businessId }).sort({ createdAt: -1 }).limit(6).lean(),
      Customer.countDocuments({ businessId }),
    ]);

  return { today, yesterday, month, lastMonth, series, top, lowStock, web, recentOrders, customerCount };
}

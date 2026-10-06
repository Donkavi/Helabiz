import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { mobileRoute, requireMobileBusiness } from "@/lib/mobile/auth";
import { toOrderSummary } from "@/lib/mobile/shape";
import { Order } from "@/models/Order";
import type { OrderStatus } from "@/types";

const PAGE_SIZE = 30;
const STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

/**
 * GET ?status=&q=&before=<iso>
 *
 * Newest first, a page at a time. `before` is the `createdAt` of the last
 * order the app already has, so new orders arriving while the owner scrolls
 * never shift or repeat a page.
 */
export const GET = mobileRoute(async (request) => {
  const { businessId } = await requireMobileBusiness(request);
  const params = new URL(request.url).searchParams;

  const filter: Record<string, unknown> = { businessId };
  const status = params.get("status");
  if (status && STATUSES.includes(status as OrderStatus)) filter.status = status;

  const before = params.get("before");
  const beforeDate = before ? new Date(before) : null;
  if (beforeDate && !Number.isNaN(beforeDate.getTime())) filter.createdAt = { $lt: beforeDate };

  const q = params.get("q")?.trim().slice(0, 60);
  if (q) {
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ orderNumber: pattern }, { "customer.name": pattern }, { "customer.phone": pattern }];
  }

  await connectDB();
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(PAGE_SIZE + 1).lean();

  return NextResponse.json({
    orders: orders.slice(0, PAGE_SIZE).map(toOrderSummary),
    hasMore: orders.length > PAGE_SIZE,
  });
});

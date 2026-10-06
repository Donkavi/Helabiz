import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { mobileRoute, MobileError, readJson, requireMobileBusiness } from "@/lib/mobile/auth";
import { toOrderDetail } from "@/lib/mobile/shape";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { Order } from "@/models/Order";
import { changeOrderStatus } from "@/services/order-service";

type Context = { params: Promise<{ id: string }> };

async function findOrder(businessId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new MobileError("Order not found", 404, "not_found");
  await connectDB();
  // Scoped to the business from the gate: an id from another shop finds nothing.
  const order = await Order.findOne({ _id: id, businessId }).lean();
  if (!order) throw new MobileError("Order not found", 404, "not_found");
  return order;
}

/**
 * The order as the app shows it, plus what the web's order page derives:
 * the ready-made WhatsApp message (`buildOrderMessage`, the same text as
 * "Send via WhatsApp") and the estimated profit on the order.
 */
function detail(order: Awaited<ReturnType<typeof findOrder>>, businessName: string) {
  const message = buildOrderMessage(
    {
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: (order.items ?? []).map((i) => ({ name: i.name, variantName: i.variantName, quantity: i.quantity, total: i.total })),
      subtotal: order.subtotal ?? 0,
      discount: order.discount ?? 0,
      deliveryFee: order.deliveryFee ?? 0,
      total: order.total ?? 0,
    },
    businessName,
  );
  return {
    ...toOrderDetail(order),
    whatsappUrl: order.customer?.phone ? whatsappLink(order.customer.phone, message) : null,
    estimatedProfit: (order.cost ?? 0) > 0 ? (order.total ?? 0) - (order.deliveryFee ?? 0) - (order.cost ?? 0) : null,
  };
}

/** GET — one order in full. */
export const GET = mobileRoute<Context>(async (request, { params }) => {
  const { business, businessId } = await requireMobileBusiness(request);
  const { id } = await params;
  return NextResponse.json({ order: detail(await findOrder(businessId, id), business.name) });
});

const update = z
  .object({
    status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"]).optional(),
    note: z.string().trim().max(300).optional(),
    paymentStatus: z.enum(["unpaid", "paid", "partial", "refunded"]).optional(),
  })
  .refine((value) => value.status || value.paymentStatus, "Nothing to change");

/**
 * PATCH { status?, note?, paymentStatus? }
 *
 * Status goes through `changeOrderStatus`, the same path as the web, so
 * stock, customer totals and the customer's email all follow.
 */
export const PATCH = mobileRoute<Context>(async (request, { params }) => {
  const { business, businessId } = await requireMobileBusiness(request);
  const { id } = await params;
  const parsed = update.safeParse(await readJson(request));
  if (!parsed.success) throw new MobileError(parsed.error.issues[0]?.message ?? "Invalid change", 400, "invalid");

  const order = await findOrder(businessId, id);
  if (parsed.data.status && parsed.data.status !== order.status) {
    await changeOrderStatus(businessId, id, parsed.data.status, parsed.data.note || undefined);
  }
  if (parsed.data.paymentStatus) {
    await Order.updateOne({ _id: id, businessId }, { $set: { paymentStatus: parsed.data.paymentStatus } });
  }

  return NextResponse.json({ order: detail(await findOrder(businessId, id), business.name) });
});

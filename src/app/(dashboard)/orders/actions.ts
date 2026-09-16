"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { orderSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";
import { assertWithinLimit, LimitError } from "@/services/limits-service";
import { changeOrderStatus, computeTotals, createOrder, recalculateCustomerTotals } from "@/services/order-service";
import type { OrderStatus, PaymentStatus } from "@/types";

export async function createOrderAction(
  _prev: ActionState<{ id: string }>,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { businessId } = await requireBusiness();

  const payload = formData.get("payload");
  const parsed = orderSchema.safeParse(payload ? JSON.parse(String(payload)) : Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await assertWithinLimit(businessId, "orders");
  } catch (error) {
    if (error instanceof LimitError) return { ok: false, error: error.message };
    throw error;
  }

  const data = parsed.data;
  const order = await createOrder({
    businessId,
    customer: {
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      district: data.district || undefined,
    },
    items: data.items,
    discount: data.discount,
    deliveryFee: data.deliveryFee,
    status: data.status,
    paymentStatus: data.paymentStatus,
    paymentMethod: data.paymentMethod,
    source: data.source,
    notes: data.notes || undefined,
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  return { ok: true, data: { id: String(order._id) } };
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string) {
  const { businessId } = await requireBusiness();
  await changeOrderStatus(businessId, orderId, status, note);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function updatePaymentStatusAction(orderId: string, paymentStatus: PaymentStatus) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Order.updateOne({ _id: orderId, businessId }, { $set: { paymentStatus } });
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true as const };
}

export async function updateOrderDetailsAction(
  orderId: string,
  updates: { notes?: string; trackingNumber?: string; deliveryFee?: number; discount?: number },
) {
  const { businessId } = await requireBusiness();
  await connectDB();
  const order = await Order.findOne({ _id: orderId, businessId });
  if (!order) return { ok: false as const, error: "Order not found" };

  if (updates.notes !== undefined) order.notes = updates.notes;
  if (updates.trackingNumber !== undefined) order.trackingNumber = updates.trackingNumber;

  if (updates.deliveryFee !== undefined || updates.discount !== undefined) {
    const totals = computeTotals({
      items: order.items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        costPrice: i.costPrice ?? 0,
      })),
      discount: updates.discount ?? order.discount,
      deliveryFee: updates.deliveryFee ?? order.deliveryFee,
    });
    order.discount = totals.discount;
    order.deliveryFee = totals.deliveryFee;
    order.total = totals.total;
  }

  await order.save();
  if (order.customerId) await recalculateCustomerTotals(businessId, String(order.customerId));

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true as const };
}

export async function deleteOrderAction(orderId: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  // Cancelling first releases any stock the order was holding.
  await changeOrderStatus(businessId, orderId, "cancelled", "Order deleted");
  await Order.deleteOne({ _id: orderId, businessId });
  revalidatePath("/orders");
  redirect("/orders");
}

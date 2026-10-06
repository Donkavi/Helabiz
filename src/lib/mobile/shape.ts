import "server-only";
import type { OrderDoc } from "@/models/Order";

/**
 * What the mobile app receives for an order. Kept to the fields its screens
 * use, so cost prices and internal flags never travel to a phone that does
 * not need them.
 */

type LeanOrder = OrderDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date };

const iso = (date?: Date | string | null) => (date ? new Date(date).toISOString() : null);

export function toOrderSummary(order: LeanOrder) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customerName: order.customer?.name ?? "Customer",
    total: order.total ?? 0,
    status: order.status,
    paymentStatus: order.paymentStatus,
    source: order.source,
    itemCount: (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    createdAt: iso(order.createdAt),
  };
}

export function toOrderDetail(order: LeanOrder) {
  return {
    ...toOrderSummary(order),
    customerId: order.customerId ? String(order.customerId) : null,
    customer: {
      name: order.customer?.name ?? "",
      phone: order.customer?.phone ?? "",
      email: order.customer?.email ?? null,
      address: order.customer?.address ?? null,
      city: order.customer?.city ?? null,
      district: order.customer?.district ?? null,
    },
    items: (order.items ?? []).map((item) => ({
      name: item.name,
      variantName: item.variantName ?? null,
      image: item.image ?? null,
      price: item.price ?? 0,
      quantity: item.quantity ?? 0,
      total: item.total ?? 0,
    })),
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    paymentMethod: order.paymentMethod,
    notes: order.notes ?? null,
    trackingNumber: order.trackingNumber ?? null,
    timeline: (order.timeline ?? []).map((entry) => ({
      status: entry.status,
      note: entry.note ?? null,
      at: iso(entry.at),
    })),
  };
}

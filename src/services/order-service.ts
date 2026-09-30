import { connectDB } from "@/lib/db/mongoose";
import type { HydratedDocument } from "mongoose";
import { Order, type OrderDoc } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { InventoryMovement } from "@/models/InventoryMovement";
import { Notification } from "@/models/Notification";
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "@/services/order-mail";
import { REVENUE_STATUSES } from "./metrics-service";
import type { OrderSource, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export type OrderLineInput = {
  productId?: string;
  variantId?: string;
  name: string;
  variantName?: string;
  image?: string;
  price: number;
  costPrice?: number;
  quantity: number;
};

export type CreateOrderInput = {
  businessId: string;
  customer: { name: string; phone: string; email?: string; address?: string; city?: string; district?: string };
  items: OrderLineInput[];
  discount?: number;
  deliveryFee?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  source?: OrderSource;
  notes?: string;
};

/** Sequential, human-readable order numbers scoped to a business. */
export async function nextOrderNumber(businessId: string) {
  const last = await Order.findOne({ businessId }).sort({ createdAt: -1 }).select("orderNumber").lean();
  const lastNumber = Number(last?.orderNumber?.replace(/\D/g, "") ?? 1000);
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1001;
  return `ORD-${next}`;
}

export function computeTotals(input: {
  items: OrderLineInput[];
  discount?: number;
  deliveryFee?: number;
}) {
  const items = input.items.map((item) => ({
    ...item,
    costPrice: item.costPrice ?? 0,
    total: Math.round(item.price * item.quantity * 100) / 100,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const cost = items.reduce((sum, i) => sum + (i.costPrice ?? 0) * i.quantity, 0);
  const discount = Math.min(input.discount ?? 0, subtotal);
  const deliveryFee = input.deliveryFee ?? 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  return { items, subtotal, discount, deliveryFee, cost, total };
}

/**
 * Finds or creates the customer record for an order and keeps their lifetime
 * totals current. Website buyers are added to the customer list this way (§35).
 */
export async function upsertCustomer(
  businessId: string,
  data: { name: string; phone: string; email?: string; address?: string; city?: string; district?: string },
  source = "manual",
) {
  const phone = data.phone.trim();
  const existing = await Customer.findOne({ businessId, phone });

  if (existing) {
    existing.name = data.name || existing.name;
    if (data.email) existing.email = data.email;
    if (data.address) existing.address = data.address;
    if (data.city) existing.city = data.city;
    if (data.district) existing.district = data.district;
    await existing.save();
    return existing;
  }

  return Customer.create({
    businessId,
    name: data.name,
    phone,
    email: data.email || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    district: data.district || undefined,
    source,
    type: "new",
  });
}

/**
 * Applies an order's stock movements exactly once.
 * `inventoryApplied` on the order is the guard, so re-saving an order or
 * changing its status never double-counts (§36).
 */
export async function applyInventory(order: HydratedDocument<OrderDoc>, direction: 1 | -1 = -1) {
  for (const item of order.items) {
    if (!item.productId) continue;
    const product = await Product.findOne({ _id: item.productId, businessId: order.businessId });
    if (!product || !product.trackInventory) continue;

    const before = product.stock ?? 0;
    const delta = direction * item.quantity;
    product.stock = Math.max(0, before + delta);
    product.sold = Math.max(0, (product.sold ?? 0) - delta);

    if (item.variantId && product.variants?.length) {
      const variant = product.variants.find((v) => String(v._id) === item.variantId);
      if (variant) variant.stock = Math.max(0, (variant.stock ?? 0) + delta);
    }
    await product.save();

    await InventoryMovement.create({
      businessId: order.businessId,
      productId: product._id,
      variantId: item.variantId,
      productName: product.name,
      type: direction === -1 ? "sale" : "return",
      quantity: Math.abs(item.quantity),
      stockBefore: before,
      stockAfter: product.stock,
      reference: order.orderNumber,
      orderId: order._id,
    });
  }
}

/** Creates an order and runs the customer + inventory side effects. */
export async function createOrder(input: CreateOrderInput) {
  await connectDB();

  const totals = computeTotals(input);
  const customer = await upsertCustomer(input.businessId, input.customer, input.source);
  const orderNumber = await nextOrderNumber(input.businessId);
  const status = input.status ?? "pending";

  const order = await Order.create({
    businessId: input.businessId,
    orderNumber,
    customerId: customer._id,
    customer: input.customer,
    items: totals.items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    deliveryFee: totals.deliveryFee,
    cost: totals.cost,
    total: totals.total,
    status,
    paymentStatus: input.paymentStatus ?? "unpaid",
    paymentMethod: input.paymentMethod ?? "cod",
    source: input.source ?? "manual",
    notes: input.notes,
    inventoryApplied: false,
    timeline: [{ status, note: "Order created", at: new Date() }],
  });

  if (REVENUE_STATUSES.includes(status)) {
    await applyInventory(order, -1);
    order.inventoryApplied = true;
    await order.save();
  }

  await recalculateCustomerTotals(input.businessId, String(customer._id));

  if (input.source === "website") {
    await Notification.create({
      businessId: input.businessId,
      type: "order",
      title: `New website order ${orderNumber}`,
      body: `${input.customer.name} · ${totals.total.toLocaleString("en-LK")} LKR`,
      href: `/orders/${order._id}`,
    });
  }

  // Gated on the add-on, and deliberately not awaited for its result beyond
  // its own error handling: the order is already saved and belongs to the
  // customer whether or not the confirmation reaches them.
  await sendOrderPlacedEmail(input.businessId, {
    orderNumber,
    total: totals.total,
    items: order.items.map((item) => ({
      name: item.name,
      variantName: item.variantName,
      quantity: item.quantity,
      total: item.total,
    })),
    customer: { name: input.customer.name, email: input.customer.email },
  });

  return order;
}

/** Recomputes a customer's order count, lifetime spend and tier. */
export async function recalculateCustomerTotals(businessId: string, customerId: string) {
  const orders = await Order.find({
    businessId,
    customerId,
    status: { $in: REVENUE_STATUSES },
  })
    .select("total createdAt")
    .lean();

  const totalSpent = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const lastOrderAt = orders.length
    ? new Date(Math.max(...orders.map((o) => new Date(o.createdAt as unknown as string).getTime())))
    : undefined;

  const type = totalSpent >= 50_000 ? "vip" : orders.length >= 3 ? "regular" : "new";

  await Customer.findByIdAndUpdate(customerId, {
    totalOrders: orders.length,
    totalSpent,
    lastOrderAt,
    type,
  });
}

/**
 * Moves an order to a new status, releasing or re-applying stock when it
 * crosses the line between "counts as a sale" and "does not".
 */
export async function changeOrderStatus(businessId: string, orderId: string, status: OrderStatus, note?: string) {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, businessId });
  if (!order) throw new Error("Order not found");

  const wasRevenue = REVENUE_STATUSES.includes(order.status);
  const isRevenue = REVENUE_STATUSES.includes(status);

  if (!wasRevenue && isRevenue && !order.inventoryApplied) {
    await applyInventory(order, -1);
    order.inventoryApplied = true;
  } else if (wasRevenue && !isRevenue && order.inventoryApplied) {
    await applyInventory(order, 1);
    order.inventoryApplied = false;
  }

  order.status = status;
  order.timeline.push({ status, note, at: new Date() });
  await order.save();

  if (order.customerId) await recalculateCustomerTotals(businessId, String(order.customerId));

  // The customer hears about the move, if the shop pays for that.
  const customer = order.customerId
    ? await Customer.findById(order.customerId).select("name email").lean()
    : null;
  await sendOrderStatusEmail(
    businessId,
    {
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        total: item.total,
      })),
      customer: customer ? { name: customer.name, email: customer.email } : null,
    },
    status,
  );

  return order;
}

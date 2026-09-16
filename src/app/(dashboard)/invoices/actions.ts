"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Invoice } from "@/models/Invoice";
import { Order } from "@/models/Order";
import type { ActionState } from "@/lib/validations/errors";
import { hasFeature } from "@/services/limits-service";

async function nextInvoiceNumber(businessId: string) {
  const last = await Invoice.findOne({ businessId }).sort({ createdAt: -1 }).select("invoiceNumber").lean();
  const lastNumber = Number(last?.invoiceNumber?.replace(/\D/g, "") ?? 1000);
  return `INV-${Number.isFinite(lastNumber) ? lastNumber + 1 : 1001}`;
}

/** Builds an invoice from an existing order (spec §39). */
export async function createInvoiceAction(orderId: string): Promise<ActionState<{ id: string }>> {
  const { businessId } = await requireBusiness();
  await connectDB();

  if (!(await hasFeature(businessId, "invoices"))) {
    return { ok: false, error: "Invoices are available on the Starter plan and above." };
  }

  const existing = await Invoice.findOne({ businessId, orderId }).select("_id").lean();
  if (existing) return { ok: true, data: { id: String(existing._id) } };

  const order = await Order.findOne({ _id: orderId, businessId }).lean();
  if (!order) return { ok: false, error: "Order not found" };

  const invoice = await Invoice.create({
    businessId,
    invoiceNumber: await nextInvoiceNumber(businessId),
    orderId: order._id,
    customerId: order.customerId,
    customer: {
      name: order.customer?.name,
      phone: order.customer?.phone,
      email: order.customer?.email,
      address: [order.customer?.address, order.customer?.city, order.customer?.district].filter(Boolean).join(", "),
    },
    items: (order.items ?? []).map((item) => ({
      name: item.variantName ? `${item.name} (${item.variantName})` : item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    total: order.total ?? 0,
    status: order.paymentStatus === "paid" ? "paid" : "sent",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  revalidatePath("/invoices");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, data: { id: String(invoice._id) } };
}

export async function updateInvoiceStatusAction(invoiceId: string, status: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Invoice.updateOne({ _id: invoiceId, businessId }, { $set: { status } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { ok: true as const };
}

export async function deleteInvoiceAction(invoiceId: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Invoice.deleteOne({ _id: invoiceId, businessId });
  revalidatePath("/invoices");
  return { ok: true as const };
}

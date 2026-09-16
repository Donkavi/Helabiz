import { formatCurrency } from "@/lib/utils";

/** Normalises Sri Lankan numbers to the international form wa.me expects. */
export function normalizePhone(phone: string) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  if (digits.length === 9) return `94${digits}`;
  return digits;
}

export function whatsappLink(phone: string, message: string) {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

type OrderForMessage = {
  orderNumber: string;
  customer?: { name?: string | null } | null;
  items: { name: string; variantName?: string | null; quantity: number; total: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status?: string;
};

/** Builds the customer-facing order message (spec §40). */
export function buildOrderMessage(order: OrderForMessage, businessName: string) {
  const lines: string[] = [];
  lines.push(`Hello ${order.customer?.name || "there"},`, "");
  lines.push("Thank you for your order.", "");
  lines.push(`Order ${order.orderNumber}`, "");

  for (const item of order.items) {
    const name = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    lines.push(`${name} × ${item.quantity}`);
    lines.push(formatCurrency(item.total, { decimals: false }));
    lines.push("");
  }

  if (order.discount > 0) {
    lines.push("Discount", `− ${formatCurrency(order.discount, { decimals: false })}`, "");
  }
  if (order.deliveryFee > 0) {
    lines.push("Delivery", formatCurrency(order.deliveryFee, { decimals: false }), "");
  }

  lines.push("Total", formatCurrency(order.total, { decimals: false }), "");
  lines.push(`Thank you for shopping with ${businessName}.`);

  return lines.join("\n");
}

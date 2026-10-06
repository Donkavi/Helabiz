import { Badge, type BadgeVariant } from "./primitives";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

/** Same colours as `components/dashboard/order-status-badge.tsx` on the web. */
const ORDER_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  packed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
  returned: "muted",
};

const PAYMENT_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  paid: "success",
  unpaid: "warning",
  partial: "warning",
  refunded: "muted",
};

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partial: "Partially paid",
  refunded: "Refunded",
};

export function orderStatusLabel(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={orderStatusLabel(status)} variant={ORDER_VARIANT[status] ?? "muted"} />;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge label={PAYMENT_LABELS[status] ?? status} variant={PAYMENT_VARIANT[status] ?? "muted"} />;
}

export function orderStatusVariant(status: OrderStatus) {
  return ORDER_VARIANT[status] ?? "muted";
}

import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@/types";

const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  packed: { label: "Packed", variant: "info" },
  shipped: { label: "Shipped", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  returned: { label: "Returned", variant: "muted" },
};

const PAYMENT_STATUS: Record<string, { label: string; variant: "success" | "warning" | "muted" | "destructive" }> = {
  paid: { label: "Paid", variant: "success" },
  unpaid: { label: "Unpaid", variant: "warning" },
  partial: { label: "Partly paid", variant: "warning" },
  refunded: { label: "Refunded", variant: "muted" },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const meta = ORDER_STATUS[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
  online: "Online payment",
  cash: "Cash",
  card: "Card",
};

export const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  manual: "Manual",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  walk_in: "Walk-in",
};

"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/provider";
import type { OrderStatus, PaymentStatus } from "@/types";

/**
 * Status badges.
 *
 * A client component so the label can come from the language context, which
 * also lets a server page render it without threading the language through.
 * Only the colour lives here; the words are in the dictionary, beside every
 * other translated string.
 */
type Variant = "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "muted";

const ORDER_VARIANT: Record<string, Variant> = {
  pending: "warning",
  confirmed: "info",
  packed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
  returned: "muted",
};

const PAYMENT_VARIANT: Record<string, Variant> = {
  paid: "success",
  unpaid: "warning",
  partial: "warning",
  refunded: "muted",
};

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const t = useT();
  return <Badge variant={ORDER_VARIANT[status] ?? "muted"}>{t.enums.orderStatus[status] ?? status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const t = useT();
  return <Badge variant={PAYMENT_VARIANT[status] ?? "muted"}>{t.enums.paymentStatus[status] ?? status}</Badge>;
}

/** The order of the status options in a dropdown — the labels come from the dictionary. */
export const ORDER_STATUS_VALUES = Object.keys(ORDER_VARIANT);

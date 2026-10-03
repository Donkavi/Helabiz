/**
 * An order's progress as a customer sees it, shared by the public tracking
 * page and the order page in a customer's account so the two never disagree.
 *
 * The statuses are the dashboard's own (`OrderStatus`). "returned" and
 * "cancelled" are not steps on the way, they are where the journey stopped.
 */
export const ORDER_JOURNEY = [
  { status: "pending", label: "Order received" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Being packed" },
  { status: "shipped", label: "On the way" },
  { status: "delivered", label: "Delivered" },
] as const;

/** Index of the last step reached, or -1 for an order that left the journey. */
export function journeyStep(status: string | null | undefined) {
  return ORDER_JOURNEY.findIndex((step) => step.status === status);
}

/** A short customer-facing label for any status, including the off-journey ones. */
export function statusLabel(status: string | null | undefined) {
  if (status === "cancelled") return "Cancelled";
  if (status === "returned") return "Returned";
  return ORDER_JOURNEY.find((step) => step.status === status)?.label ?? "Order received";
}

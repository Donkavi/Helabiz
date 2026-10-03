import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { ORDER_JOURNEY, journeyStep } from "@/lib/website/order-journey";

/**
 * The step-by-step progress of one order. Used by the public tracking page
 * and by the order page in a customer's account.
 */
export function OrderJourney({ status }: { status: string }) {
  if (status === "cancelled" || status === "returned") {
    return (
      <p style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
        <XCircle size={18} />
        {status === "cancelled" ? "This order was cancelled." : "This order was returned."}
      </p>
    );
  }

  const reached = journeyStep(status);

  return (
    <ol style={{ marginTop: 20, display: "grid", gap: 14, listStyle: "none", padding: 0 }}>
      {ORDER_JOURNEY.map((step, index) => {
        const done = index <= reached;
        return (
          <li key={step.status} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            {done ? (
              <CheckCircle2 size={18} style={{ color: "var(--w-primary)" }} />
            ) : (
              <Circle size={18} opacity={0.35} />
            )}
            <span style={{ fontSize: 14.5, opacity: done ? 1 : 0.5, fontWeight: done ? 600 : 400 }}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle, Truck } from "lucide-react";
import { AccountPage, requireShopper, siteChatEnabled } from "@/components/website/account/account-shell";
import { OrderJourney } from "@/components/website/account/order-journey";
import { SiteLink } from "@/components/website/primitives";
import { WhatsAppIcon } from "@/components/website/whatsapp-bubble";
import { shopperOrder } from "@/services/shopper-service";
import { statusLabel } from "@/lib/website/order-journey";
import { formatCurrency, formatDate } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
  online: "Online payment",
  cash: "Cash",
  card: "Card",
};

/**
 * One order, from the customer's side. Only ever their own: the lookup is
 * scoped to the signed-in customer, so a guessed order number is a 404.
 *
 * The step-by-step progress is the "Order tracking" add-on. Without it the
 * customer still sees the current status, just not the journey.
 */
export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ businessSlug: string; orderNumber: string }>;
}) {
  const { businessSlug, orderNumber: rawNumber } = await params;
  const orderNumber = decodeURIComponent(rawNumber);
  const { site, shopper } = await requireShopper(businessSlug, `/account/orders/${encodeURIComponent(orderNumber)}`);

  const order = await shopperOrder(site.businessId, shopper.id, orderNumber);
  if (!order) notFound();

  const tracking = site.addons.includes("order_tracking");
  const chat = siteChatEnabled(site);
  const status = order.status ?? "pending";
  const { business } = site.ctx;
  const waHref =
    business.whatsapp || business.phone
      ? whatsappLink(
          business.whatsapp || business.phone!,
          `Hello ${business.name}, I have a question about my order ${order.orderNumber}.`,
        )
      : undefined;

  return (
    <AccountPage site={site} width={760}>
      <SiteLink ctx={site.ctx} href="/account">
        <span className="w-muted" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5 }}>
          <ChevronLeft size={14} />
          My orders
        </span>
      </SiteLink>

      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 14px" }}>
        <h1 style={{ fontSize: "clamp(24px,3.2vw,32px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Order {order.orderNumber}
        </h1>
        <span className="w-muted" style={{ fontSize: 14 }}>
          Placed {formatDate(order.createdAt as unknown as string, "long")}
        </span>
      </div>

      <section style={{ marginTop: 24, padding: 24, borderRadius: "var(--w-radius)", background: "var(--w-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Truck size={18} style={{ color: "var(--w-primary)" }} />
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{tracking ? "Where your order is" : statusLabel(status)}</h2>
        </div>
        {tracking ? (
          <>
            <OrderJourney status={status} />
            {order.trackingNumber && (
              <p style={{ marginTop: 18, fontSize: 13.5 }}>
                Courier tracking number{" "}
                <strong style={{ fontFamily: "var(--font-mono, monospace)" }}>{order.trackingNumber}</strong>
              </p>
            )}
          </>
        ) : (
          <p className="w-muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
            Last updated {formatDate(order.updatedAt as unknown as string, "long")}. We will be in touch about your
            delivery.
          </p>
        )}
      </section>

      <section style={{ marginTop: 20, padding: 24, borderRadius: "var(--w-radius)", background: "var(--w-surface)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>What you ordered</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {(order.items ?? []).map((item, index) => (
            <li key={index} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 14 }}>
              <span>
                {item.name}
                {item.variantName && <span className="w-muted"> · {item.variantName}</span>}
                <span className="w-muted"> × {item.quantity}</span>
              </span>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatCurrency(item.total ?? 0, { decimals: false })}
              </span>
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
            display: "grid",
            gap: 7,
            fontSize: 13.5,
          }}
        >
          <Row label="Subtotal" value={formatCurrency(order.subtotal ?? 0, { decimals: false })} />
          {(order.discount ?? 0) > 0 && (
            <Row label="Discount" value={`− ${formatCurrency(order.discount ?? 0, { decimals: false })}`} />
          )}
          <Row
            label="Delivery"
            value={(order.deliveryFee ?? 0) === 0 ? "Free" : formatCurrency(order.deliveryFee ?? 0, { decimals: false })}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              paddingTop: 12,
              borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
              fontSize: 17,
              fontWeight: 600,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(order.total ?? 0, { decimals: false })}</span>
          </div>
        </div>
      </section>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          fontSize: 13.5,
        }}
      >
        <div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delivering to</p>
          <p className="w-muted" style={{ lineHeight: 1.7 }}>
            {order.customer?.name}
            <br />
            {[order.customer?.address, order.customer?.city, order.customer?.district].filter(Boolean).join(", ")}
            <br />
            {order.customer?.phone}
          </p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Payment</p>
          <p className="w-muted" style={{ lineHeight: 1.7 }}>
            {PAYMENT_LABEL[order.paymentMethod ?? "cod"] ?? "—"}
            <br />
            {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Not paid yet"}
          </p>
        </div>
      </div>

      {(chat || waHref) && (
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {chat && (
            <SiteLink
              ctx={site.ctx}
              href={`/account/messages?about=${encodeURIComponent(order.orderNumber)}`}
              className="w-btn w-btn--solid"
            >
              <MessageCircle size={15} />
              Message the shop about this order
            </SiteLink>
          )}
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-btn w-btn--outline">
              {chat ? <WhatsAppIcon size={15} /> : <MessageCircle size={15} />}
              {chat ? "Ask on WhatsApp" : "Message us about this order"}
            </a>
          )}
        </div>
      )}
    </AccountPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span className="w-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

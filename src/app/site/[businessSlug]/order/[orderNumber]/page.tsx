import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, MessageCircle, Package } from "lucide-react";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { loadPublishedSite } from "@/lib/website/load-site";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { SiteLink } from "@/components/website/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ businessSlug: string; orderNumber: string }>;
}) {
  const { businessSlug, orderNumber } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  await connectDB();
  const order = await Order.findOne({ businessId: site.businessId, orderNumber }).lean();
  if (!order) notFound();

  const plain = serialize(order);
  const { business } = site.ctx;

  const waHref =
    business.whatsapp || business.phone
      ? whatsappLink(
          business.whatsapp || business.phone!,
          `Hello ${business.name}, I have a question about my order ${plain.orderNumber}.`,
        )
      : undefined;

  return (
    <WebsiteRenderer sections={[]} header={site.header} footer={site.footer} ctx={site.ctx} mode="public">
      <div className="w-in" style={{ paddingBlock: 64, maxWidth: 720 }}>
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "inline-flex",
              width: 56,
              height: 56,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "color-mix(in srgb,var(--w-primary) 14%,transparent)",
              color: "var(--w-primary)",
            }}
          >
            <CheckCircle2 size={26} />
          </span>
          <h1 style={{ marginTop: 20, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 600 }}>
            Thank you for your order
          </h1>
          <p className="w-muted" style={{ marginTop: 10, fontSize: 15.5, lineHeight: 1.7 }}>
            We have received it and will be in touch shortly to confirm your delivery.
          </p>
          <p style={{ marginTop: 18, fontSize: 14 }}>
            Order number{" "}
            <strong style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>{plain.orderNumber}</strong>
          </p>
        </div>

        <div
          style={{
            marginTop: 36,
            borderRadius: "var(--w-radius)",
            background: "var(--w-surface)",
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>What you ordered</h2>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {(plain.items ?? []).map((item, index) => (
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
            <Row label="Subtotal" value={formatCurrency(plain.subtotal ?? 0, { decimals: false })} />
            {(plain.discount ?? 0) > 0 && (
              <Row label="Discount" value={`− ${formatCurrency(plain.discount ?? 0, { decimals: false })}`} />
            )}
            <Row
              label="Delivery"
              value={(plain.deliveryFee ?? 0) === 0 ? "Free" : formatCurrency(plain.deliveryFee ?? 0, { decimals: false })}
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
              <span>{formatCurrency(plain.total ?? 0, { decimals: false })}</span>
            </div>
          </div>
        </div>

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
              {plain.customer?.name}
              <br />
              {[plain.customer?.address, plain.customer?.city, plain.customer?.district].filter(Boolean).join(", ")}
              <br />
              {plain.customer?.phone}
            </p>
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Payment</p>
            <p className="w-muted" style={{ lineHeight: 1.7 }}>
              {plain.paymentMethod === "cod"
                ? "Cash on delivery"
                : plain.paymentMethod === "bank_transfer"
                  ? "Bank transfer — we will send you the details"
                  : "Online payment"}
              <br />
              Placed {formatDate(plain.createdAt as unknown as string, "long")}
            </p>
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <SiteLink ctx={site.ctx} href="/shop" className="w-btn w-btn--solid">
            <Package size={15} />
            Keep shopping
          </SiteLink>
          {/* Only where the shop pays for tracking; otherwise the page it
              points at does not exist. */}
          {site.addons.includes("order_tracking") && (
            <SiteLink ctx={site.ctx} href="/track" className="w-btn w-btn--outline">
              <MapPin size={15} />
              Track this order
            </SiteLink>
          )}
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-btn w-btn--outline">
              <MessageCircle size={15} />
              Message us about this order
            </a>
          )}
        </div>
      </div>
    </WebsiteRenderer>
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

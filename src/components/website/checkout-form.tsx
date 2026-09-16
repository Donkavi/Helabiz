"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Banknote, ChevronLeft, CreditCard, Landmark, Loader2, Lock, ShoppingBag } from "lucide-react";
import type { SiteContext } from "@/lib/website/render-types";
import { formatCurrency } from "@/lib/utils";
import { SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";
import { useCart } from "./cart-provider";
import { trackEvent } from "./analytics-beacon";
import { SiteImage, SiteLink } from "./primitives";

const PAYMENT_METHODS = [
  {
    value: "cod",
    label: "Cash on delivery",
    hint: "Pay the courier when your order arrives.",
    icon: Banknote,
    available: true,
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
    hint: "We will send you the account details to complete your order.",
    icon: Landmark,
    available: true,
  },
  {
    value: "online",
    label: "Card payment",
    hint: "Coming soon — please choose another method for now.",
    icon: CreditCard,
    available: false,
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  font: "inherit",
  fontSize: 14.5,
  padding: "11px 13px",
  borderRadius: "calc(var(--w-radius) * .8)",
  border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
  background: "var(--w-bg)",
  color: "inherit",
};

export function CheckoutForm({ ctx, businessSlug }: { ctx: SiteContext; businessSlug: string }) {
  const router = useRouter();
  const cart = useCart();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cod");
  const trackedRef = React.useRef(false);

  React.useEffect(() => {
    if (trackedRef.current || !cart.ready || cart.lines.length === 0 || !ctx.businessId) return;
    trackedRef.current = true;
    trackEvent({
      businessId: ctx.businessId,
      websiteId: ctx.websiteId,
      type: "begin_checkout",
      value: cart.subtotal,
    });
  }, [cart.ready, cart.lines.length, cart.subtotal, ctx.businessId, ctx.websiteId]);

  const delivery =
    ctx.business.freeDeliveryOver > 0 && cart.subtotal >= ctx.business.freeDeliveryOver
      ? 0
      : ctx.business.deliveryFee;
  const total = cart.subtotal + delivery;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/site/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          customer: {
            name: String(form.get("name") ?? ""),
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? ""),
            address: String(form.get("address") ?? ""),
            city: String(form.get("city") ?? ""),
            district: String(form.get("district") ?? ""),
          },
          // Only ids and quantities — the server sets every price.
          items: cart.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
          })),
          paymentMethod,
          notes: String(form.get("notes") ?? ""),
        }),
      });

      const result = (await response.json()) as { ok: boolean; orderNumber?: string; error?: string };

      if (!result.ok) {
        setError(result.error ?? "We could not place your order. Please try again.");
        setSubmitting(false);
        return;
      }

      if (ctx.businessId) {
        trackEvent({ businessId: ctx.businessId, websiteId: ctx.websiteId, type: "order", value: total });
      }

      cart.clear();
      router.push(`${ctx.basePath}/order/${result.orderNumber}`);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (cart.ready && cart.lines.length === 0) {
    return (
      <div className="w-in" style={{ padding: "80px 20px", textAlign: "center" }}>
        <ShoppingBag size={30} style={{ color: "var(--w-muted)" }} />
        <h1 style={{ marginTop: 16, fontSize: 24, fontWeight: 600 }}>Your cart is empty</h1>
        <p className="w-muted" style={{ marginTop: 8, fontSize: 15 }}>
          Add something to your cart before checking out.
        </p>
        <div style={{ marginTop: 24 }}>
          <SiteLink ctx={ctx} href="/shop" className="w-btn w-btn--solid">
            Browse the shop
          </SiteLink>
        </div>
      </div>
    );
  }

  return (
    <div className="w-in" style={{ paddingBlock: 48 }}>
      <SiteLink ctx={ctx} href="/shop">
        <span
          className="w-muted"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5, marginBottom: 20 }}
        >
          <ChevronLeft size={14} />
          Continue shopping
        </span>
      </SiteLink>

      <h1 style={{ fontSize: "clamp(26px,3.4vw,36px)", fontWeight: 600, marginBottom: 32 }}>Checkout</h1>

      <form
        onSubmit={submit}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "start" }}
      >
        {/* Details */}
        <div style={{ display: "grid", gap: 26 }}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Your details</legend>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Full name" name="name" required autoComplete="name" />
              <Field
                label="Phone number"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                hint="We will call or message you about your delivery."
              />
              <Field label="Email (optional)" name="email" type="email" autoComplete="email" />
            </div>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Delivery address</legend>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Address" name="address" required autoComplete="street-address" textarea />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
                <Field label="City" name="city" required autoComplete="address-level2" />
                <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
                  District
                  <select name="district" style={inputStyle} defaultValue="">
                    <option value="">Select district</option>
                    {SRI_LANKA_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Field label="Order notes (optional)" name="notes" textarea hint="Landmarks, delivery times, anything else." />
            </div>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Payment</legend>
            <div style={{ display: "grid", gap: 10 }}>
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method.value;
                return (
                  <label
                    key={method.value}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      padding: 14,
                      borderRadius: "calc(var(--w-radius) * .8)",
                      border: `1px solid ${active ? "var(--w-primary)" : "color-mix(in srgb,var(--w-text) 16%,transparent)"}`,
                      background: active ? "color-mix(in srgb,var(--w-primary) 7%,transparent)" : "transparent",
                      cursor: method.available ? "pointer" : "not-allowed",
                      opacity: method.available ? 1 : 0.55,
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={active}
                      disabled={!method.available}
                      onChange={() => setPaymentMethod(method.value)}
                      style={{ marginTop: 3, accentColor: "var(--w-primary)" }}
                    />
                    <method.icon size={17} style={{ marginTop: 1, flexShrink: 0, color: "var(--w-primary)" }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{method.label}</span>
                      <span className="w-muted" style={{ display: "block", fontSize: 13, marginTop: 2 }}>
                        {method.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Summary */}
        <aside
          className="w-card"
          style={{
            padding: 22,
            borderRadius: "var(--w-radius)",
            background: "var(--w-surface)",
            position: "sticky",
            top: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your order</h2>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
            {cart.lines.map((line) => (
              <li key={cart.lineKey(line)} style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    position: "relative",
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: "calc(var(--w-radius) * .6)",
                    overflow: "hidden",
                    background: "var(--w-bg)",
                  }}
                >
                  <SiteImage src={line.image} alt="" className="w-img" />
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "var(--w-primary)",
                      color: "var(--w-btn-on-primary,#fff)",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      padding: "0 4px",
                    }}
                  >
                    {line.quantity}
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.4 }}>{line.name}</p>
                  {line.variantName && (
                    <p className="w-muted" style={{ fontSize: 12.5 }}>
                      {line.variantName}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {formatCurrency(line.price * line.quantity, { decimals: false })}
                </p>
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
            }}
          >
            <SummaryRow label="Subtotal" value={formatCurrency(cart.subtotal, { decimals: false })} />
            <SummaryRow label="Delivery" value={delivery === 0 ? "Free" : formatCurrency(delivery, { decimals: false })} />
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
              <span>{formatCurrency(total, { decimals: false })}</span>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "10px 12px",
                borderRadius: "calc(var(--w-radius) * .7)",
                background: "rgba(180,52,31,.1)",
                color: "#b4341f",
                fontSize: 13,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-btn w-btn--solid w-btn--lg"
            style={{ width: "100%", marginTop: 18, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? <Loader2 size={16} className="w-spin" /> : <Lock size={15} />}
            {submitting ? "Placing your order…" : `Place order · ${formatCurrency(total, { decimals: false })}`}
          </button>

          <p className="w-muted" style={{ marginTop: 12, fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
            By placing this order you agree to be contacted about your delivery.
          </p>
        </aside>
      </form>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
      <span className="w-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  textarea?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
      <span>
        {label}
        {required && <span style={{ color: "#b4341f" }}> *</span>}
      </span>
      {textarea ? (
        <textarea name={name} required={required} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      ) : (
        <input name={name} type={type} required={required} autoComplete={autoComplete} style={inputStyle} />
      )}
      {hint && (
        <span className="w-muted" style={{ fontSize: 12, fontWeight: 400 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

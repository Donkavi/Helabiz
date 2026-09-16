"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { SiteContext } from "@/lib/website/render-types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "./cart-provider";
import { SiteImage, SiteLink } from "./primitives";

/** The full-page cart (spec §26), for people who prefer it to the drawer. */
export function CartPage({ ctx }: { ctx: SiteContext }) {
  const cart = useCart();

  const delivery =
    ctx.business.freeDeliveryOver > 0 && cart.subtotal >= ctx.business.freeDeliveryOver
      ? 0
      : ctx.business.deliveryFee;
  const remaining = Math.max(0, ctx.business.freeDeliveryOver - cart.subtotal);

  if (cart.ready && cart.lines.length === 0) {
    return (
      <div className="w-in" style={{ padding: "90px 20px", textAlign: "center" }}>
        <ShoppingBag size={30} style={{ color: "var(--w-muted)" }} />
        <h1 style={{ marginTop: 16, fontSize: 26, fontWeight: 600 }}>Your cart is empty</h1>
        <p className="w-muted" style={{ marginTop: 8, fontSize: 15 }}>
          Browse the shop and add something you like.
        </p>
        <div style={{ marginTop: 26 }}>
          <SiteLink ctx={ctx} href="/shop" className="w-btn w-btn--solid w-btn--lg">
            Start shopping
          </SiteLink>
        </div>
      </div>
    );
  }

  return (
    <div className="w-in" style={{ paddingBlock: 48 }}>
      <h1 style={{ fontSize: "clamp(26px,3.4vw,36px)", fontWeight: 600, marginBottom: 28 }}>
        Your cart
        {cart.count > 0 && <span className="w-muted" style={{ fontWeight: 400 }}> ({cart.count})</span>}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 40, alignItems: "start" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {cart.lines.map((line) => {
            const key = cart.lineKey(line);
            return (
              <li
                key={key}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "18px 0",
                  borderBottom: "1px solid color-mix(in srgb,var(--w-text) 10%,transparent)",
                }}
              >
                <SiteLink ctx={ctx} href={`/products/${line.slug}`}>
                  <div
                    style={{
                      width: 92,
                      height: 92,
                      flexShrink: 0,
                      borderRadius: "calc(var(--w-radius) * .7)",
                      overflow: "hidden",
                      background: "var(--w-surface)",
                    }}
                  >
                    <SiteImage src={line.image} alt={line.name} className="w-img" />
                  </div>
                </SiteLink>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <SiteLink ctx={ctx} href={`/products/${line.slug}`}>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{line.name}</p>
                  </SiteLink>
                  {line.variantName && (
                    <p className="w-muted" style={{ fontSize: 13, marginTop: 3 }}>
                      {line.variantName}
                    </p>
                  )}
                  <p style={{ marginTop: 8, fontSize: 14.5, fontWeight: 600 }}>
                    {formatCurrency(line.price, { decimals: false })}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
                        borderRadius: "calc(var(--w-radius) * .7)",
                        padding: 3,
                      }}
                    >
                      <QtyButton label="Decrease quantity" onClick={() => cart.setQuantity(key, line.quantity - 1)}>
                        <Minus size={13} />
                      </QtyButton>
                      <span style={{ minWidth: 26, textAlign: "center", fontSize: 14 }}>{line.quantity}</span>
                      <QtyButton
                        label="Increase quantity"
                        disabled={line.stock !== undefined && line.quantity >= line.stock}
                        onClick={() => cart.setQuantity(key, line.quantity + 1)}
                      >
                        <Plus size={13} />
                      </QtyButton>
                    </div>

                    <button
                      type="button"
                      onClick={() => cart.remove(key)}
                      aria-label={`Remove ${line.name}`}
                      className="w-muted"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "none",
                        border: 0,
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: 13,
                        color: "inherit",
                      }}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {formatCurrency(line.price * line.quantity, { decimals: false })}
                </p>
              </li>
            );
          })}
        </ul>

        <aside
          style={{
            padding: 24,
            borderRadius: "var(--w-radius)",
            background: "var(--w-surface)",
            position: "sticky",
            top: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Summary</h2>

          {remaining > 0 && ctx.business.freeDeliveryOver > 0 && (
            <p className="w-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
              Spend {formatCurrency(remaining, { decimals: false })} more for free delivery.
            </p>
          )}

          <div style={{ display: "grid", gap: 7 }}>
            <Row label="Subtotal" value={formatCurrency(cart.subtotal, { decimals: false })} />
            <Row label="Delivery" value={delivery === 0 ? "Free" : formatCurrency(delivery, { decimals: false })} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(cart.subtotal + delivery, { decimals: false })}</span>
          </div>

          {ctx.settings.allowCheckout ? (
            <SiteLink ctx={ctx} href="/checkout" className="w-btn w-btn--solid w-btn--lg" style={{ width: "100%", marginTop: 20 }}>
              Checkout
            </SiteLink>
          ) : (
            <p className="w-muted" style={{ marginTop: 20, fontSize: 13, textAlign: "center" }}>
              Online checkout is currently closed. Please contact us to place an order.
            </p>
          )}

          <SiteLink ctx={ctx} href="/shop" className="w-btn w-btn--outline w-btn--sm" style={{ width: "100%", marginTop: 10 }}>
            Continue shopping
          </SiteLink>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
      <span className="w-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function QtyButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: 0,
        background: "transparent",
        color: "inherit",
        display: "grid",
        placeItems: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
}

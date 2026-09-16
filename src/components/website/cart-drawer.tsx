"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { SiteContext } from "@/lib/website/render-types";
import { resolveHref } from "@/lib/website/render-types";
import { formatCurrency } from "@/lib/utils";
import { themeCssVars } from "@/lib/website/styles";
import { useCart } from "./cart-provider";
import { SiteImage } from "./primitives";

/** The slide-over cart (spec §26). Styled from the site's own theme, not the app's. */
export function CartDrawer({ ctx }: { ctx: SiteContext }) {
  const cart = useCart();

  React.useEffect(() => {
    if (!cart.open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cart.setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [cart]);

  if (!ctx.settings.showCart) return null;

  const delivery =
    ctx.business.freeDeliveryOver > 0 && cart.subtotal >= ctx.business.freeDeliveryOver
      ? 0
      : ctx.business.deliveryFee;
  const remaining = Math.max(0, ctx.business.freeDeliveryOver - cart.subtotal);

  return (
    <>
      {cart.open && (
        <div
          className="w-cart-overlay"
          onClick={() => cart.setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 90 }}
          aria-hidden
        />
      )}

      <aside
        role="dialog"
        aria-modal={cart.open}
        aria-label="Shopping cart"
        aria-hidden={!cart.open}
        className="w-root"
        style={{
          ...themeCssVars(ctx.theme),
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(26rem, 100vw)",
          zIndex: 91,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-18px 0 50px -24px rgba(0,0,0,.45)",
          transform: cart.open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .32s cubic-bezier(.22,1,.36,1)",
          visibility: cart.open ? "visible" : "hidden",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>
            Your cart
            {cart.count > 0 && <span className="w-muted"> ({cart.count})</span>}
          </h2>
          <button
            type="button"
            onClick={() => cart.setOpen(false)}
            aria-label="Close cart"
            style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", padding: 4 }}
          >
            <X size={19} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px" }}>
          {cart.lines.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%", textAlign: "center", padding: 24 }}>
              <div>
                <ShoppingBag size={28} style={{ color: "var(--w-muted)" }} />
                <p style={{ marginTop: 14, fontWeight: 600, fontSize: 15 }}>Your cart is empty</p>
                <p className="w-muted" style={{ marginTop: 6, fontSize: 14 }}>
                  Add something you like and it will show up here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    cart.setOpen(false);
                    window.location.href = resolveHref(ctx, "/shop") ?? "/";
                  }}
                  className="w-btn w-btn--solid"
                  style={{ marginTop: 20 }}
                >
                  Start shopping
                </button>
              </div>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {cart.lines.map((line) => {
                const key = cart.lineKey(line);
                return (
                  <li
                    key={key}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "14px 0",
                      borderBottom: "1px solid color-mix(in srgb,var(--w-text) 10%,transparent)",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: "calc(var(--w-radius) * .7)",
                        overflow: "hidden",
                        background: "var(--w-surface)",
                      }}
                    >
                      <SiteImage src={line.image} alt={line.name} className="w-img" />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{line.name}</p>
                      {line.variantName && (
                        <p className="w-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                          {line.variantName}
                        </p>
                      )}
                      <p style={{ marginTop: 6, fontSize: 13.5, fontWeight: 600 }}>
                        {formatCurrency(line.price, { decimals: false })}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                        <QtyButton label="Decrease quantity" onClick={() => cart.setQuantity(key, line.quantity - 1)}>
                          <Minus size={12} />
                        </QtyButton>
                        <span style={{ fontSize: 13.5, minWidth: 18, textAlign: "center" }}>{line.quantity}</span>
                        <QtyButton
                          label="Increase quantity"
                          disabled={line.stock !== undefined && line.quantity >= line.stock}
                          onClick={() => cart.setQuantity(key, line.quantity + 1)}
                        >
                          <Plus size={12} />
                        </QtyButton>
                        <button
                          type="button"
                          onClick={() => cart.remove(key)}
                          aria-label={`Remove ${line.name}`}
                          style={{
                            marginLeft: "auto",
                            background: "none",
                            border: 0,
                            cursor: "pointer",
                            color: "var(--w-muted)",
                            padding: 2,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {line.stock !== undefined && line.quantity >= line.stock && (
                        <p style={{ marginTop: 6, fontSize: 12, color: "#b4341f" }}>
                          Only {line.stock} left in stock
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 && (
          <footer
            style={{
              padding: "16px 20px 20px",
              borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
              background: "var(--w-surface)",
            }}
          >
            {remaining > 0 && ctx.business.freeDeliveryOver > 0 && (
              <p className="w-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                Spend {formatCurrency(remaining, { decimals: false })} more for free delivery.
              </p>
            )}

            <Row label="Subtotal" value={formatCurrency(cart.subtotal, { decimals: false })} />
            <Row
              label="Delivery"
              value={delivery === 0 ? "Free" : formatCurrency(delivery, { decimals: false })}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(cart.subtotal + delivery, { decimals: false })}</span>
            </div>

            {ctx.settings.allowCheckout ? (
              <button
                type="button"
                onClick={() => {
                  cart.setOpen(false);
                  window.location.href = resolveHref(ctx, "/checkout") ?? "/";
                }}
                className="w-btn w-btn--solid"
                style={{ width: "100%", marginTop: 16 }}
              >
                Checkout
              </button>
            ) : (
              <p className="w-muted" style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
                Online checkout is currently closed. Please contact us to place an order.
              </p>
            )}

            <button
              type="button"
              onClick={() => cart.setOpen(false)}
              className="w-btn w-btn--outline w-btn--sm"
              style={{ width: "100%", marginTop: 8 }}
            >
              Keep shopping
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginTop: 4 }}>
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
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
        background: "transparent",
        color: "inherit",
        display: "grid",
        placeItems: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Minus, MessageCircle, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { PublicProduct, SiteContext } from "@/lib/website/render-types";
import { formatCurrency } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { useCart } from "./cart-provider";
import { trackEvent } from "./analytics-beacon";
import { ProductCard } from "./sections/commerce";
import { SectionHeading, SiteImage, SiteLink, paragraphs } from "./primitives";

/** The product page body (spec §25). */
export function ProductDetail({
  product,
  related,
  ctx,
}: {
  product: PublicProduct;
  related: PublicProduct[];
  ctx: SiteContext;
}) {
  const router = useRouter();
  const cart = useCart();
  const [imageIndex, setImageIndex] = React.useState(0);
  const [variantId, setVariantId] = React.useState(
    () => (product.variants?.find((v) => !product.trackInventory || v.stock > 0) ?? product.variants?.[0])?.id,
  );
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    if (!ctx.businessId) return;
    trackEvent({
      businessId: ctx.businessId,
      websiteId: ctx.websiteId,
      type: "product_view",
      productId: product.id,
      productName: product.name,
      path: `/products/${product.slug}`,
    });
  }, [ctx.businessId, ctx.websiteId, product.id, product.name, product.slug]);

  // With variants, every figure comes from the chosen one — never mixed with the product's.
  const variant = product.variants?.find((v) => v.id === variantId);
  const price = variant ? variant.price : product.price;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const stock = variant ? variant.stock : product.stock;
  const soldOut = product.trackInventory && stock <= 0;
  const onSale = !!compareAtPrice && compareAtPrice > price;
  const images = product.images?.length ? product.images : [""];

  const addToCart = () => {
    if (soldOut) return;
    cart.add({
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantName: variant?.name,
      price,
      compareAtPrice,
      image: product.images?.[0],
      slug: product.slug,
      stock: product.trackInventory ? stock : undefined,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);

    if (ctx.businessId) {
      trackEvent({
        businessId: ctx.businessId,
        websiteId: ctx.websiteId,
        type: "add_to_cart",
        productId: product.id,
        productName: product.name,
        value: price * quantity,
      });
    }
  };

  const whatsappHref =
    ctx.business.whatsapp || ctx.business.phone
      ? whatsappLink(
          ctx.business.whatsapp || ctx.business.phone!,
          `Hello ${ctx.business.name}, I would like to order:\n\n${product.name}${variant ? ` (${variant.name})` : ""}\n${formatCurrency(price, { decimals: false })}`,
        )
      : undefined;

  return (
    <>
      <section className="w-sec" style={{ paddingBlock: 40 }}>
        <div className="w-in" style={{ maxWidth: "var(--w-container)" }}>
          <SiteLink ctx={ctx} href="/shop">
            <span
              className="w-muted"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5, marginBottom: 24 }}
            >
              <ChevronLeft size={14} />
              Back to shop
            </span>
          </SiteLink>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 48 }}>
            {/* Gallery */}
            <div>
              <div
                style={{
                  aspectRatio: "1/1",
                  borderRadius: "var(--w-radius)",
                  overflow: "hidden",
                  background: "var(--w-surface)",
                }}
              >
                <SiteImage src={images[imageIndex]} alt={product.name} className="w-img" priority />
              </div>

              {images.length > 1 && (
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setImageIndex(index)}
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={index === imageIndex}
                      style={{
                        width: 68,
                        height: 68,
                        padding: 0,
                        borderRadius: "calc(var(--w-radius) * .7)",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: "var(--w-surface)",
                        border: `2px solid ${index === imageIndex ? "var(--w-primary)" : "transparent"}`,
                      }}
                    >
                      <SiteImage src={image} alt="" className="w-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1 style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 600 }}>{product.name}</h1>

              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 16 }}>
                <span style={{ fontSize: 26, fontWeight: 600 }}>{formatCurrency(price, { decimals: false })}</span>
                {onSale && (
                  <span className="w-muted" style={{ fontSize: 17, textDecoration: "line-through" }}>
                    {formatCurrency(compareAtPrice!, { decimals: false })}
                  </span>
                )}
                {onSale && (
                  <span
                    style={{
                      background: "var(--w-primary)",
                      color: "var(--w-btn-on-primary,#fff)",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 999,
                    }}
                  >
                    Save {Math.round((1 - price / compareAtPrice!) * 100)}%
                  </span>
                )}
              </div>

              {product.shortDescription && (
                <p className="w-muted" style={{ marginTop: 16, fontSize: 15.5, lineHeight: 1.7 }}>
                  {product.shortDescription}
                </p>
              )}

              {/* Stock */}
              <p style={{ marginTop: 18, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: soldOut ? "#b4341f" : "#3f9d53",
                    display: "inline-block",
                  }}
                />
                {soldOut
                  ? "Out of stock"
                  : product.trackInventory
                    ? stock <= 5
                      ? `Only ${stock} left`
                      : "In stock"
                    : "In stock"}
              </p>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Choose an option</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {product.variants.map((option) => {
                      const active = option.id === variantId;
                      const optionSoldOut = product.trackInventory && option.stock <= 0;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setVariantId(option.id);
                            setQuantity(1);
                          }}
                          disabled={optionSoldOut}
                          aria-pressed={active}
                          style={{
                            font: "inherit",
                            fontSize: 13.5,
                            padding: "9px 16px",
                            borderRadius: "calc(var(--w-radius) * .8)",
                            cursor: optionSoldOut ? "not-allowed" : "pointer",
                            border: `1px solid ${active ? "var(--w-primary)" : "color-mix(in srgb,var(--w-text) 18%,transparent)"}`,
                            background: active ? "color-mix(in srgb,var(--w-primary) 12%,transparent)" : "transparent",
                            color: "inherit",
                            opacity: optionSoldOut ? 0.4 : 1,
                            textDecoration: optionSoldOut ? "line-through" : undefined,
                          }}
                        >
                          {option.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + actions */}
              {ctx.settings.showCart && (
                <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
                      borderRadius: "calc(var(--w-radius) * .8)",
                      padding: 4,
                    }}
                  >
                    <QtyButton label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                      <Minus size={14} />
                    </QtyButton>
                    <span style={{ minWidth: 28, textAlign: "center", fontSize: 14.5 }}>{quantity}</span>
                    <QtyButton
                      label="Increase quantity"
                      disabled={product.trackInventory && quantity >= stock}
                      onClick={() => setQuantity((q) => q + 1)}
                    >
                      <Plus size={14} />
                    </QtyButton>
                  </div>

                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={soldOut}
                    className="w-btn w-btn--solid w-btn--lg"
                    style={{ flex: "1 1 180px", opacity: soldOut ? 0.5 : 1, cursor: soldOut ? "not-allowed" : "pointer" }}
                  >
                    {added ? <Check size={16} /> : <ShoppingBag size={16} />}
                    {added ? "Added to cart" : soldOut ? "Out of stock" : "Add to cart"}
                  </button>
                </div>
              )}

              {ctx.settings.allowCheckout && ctx.settings.showCart && !soldOut && (
                <button
                  type="button"
                  onClick={() => {
                    addToCart();
                    router.push(`${ctx.basePath}/checkout`);
                  }}
                  className="w-btn w-btn--outline w-btn--lg"
                  style={{ width: "100%", marginTop: 10 }}
                >
                  Buy it now
                </button>
              )}

              {ctx.settings.whatsappOrdering && whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-btn w-btn--soft"
                  style={{ width: "100%", marginTop: 10 }}
                >
                  <MessageCircle size={16} />
                  Order on WhatsApp
                </a>
              )}

              {/* Reassurance */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "28px 0 0",
                  display: "grid",
                  gap: 12,
                  borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
                  paddingTop: 22,
                }}
              >
                <Reassurance icon={Truck}>
                  {ctx.business.freeDeliveryOver > 0
                    ? `Free delivery on orders over ${formatCurrency(ctx.business.freeDeliveryOver, { decimals: false })}`
                    : "Island-wide delivery in 2–4 working days"}
                </Reassurance>
                <Reassurance icon={ShieldCheck}>Cash on delivery and bank transfer accepted</Reassurance>
              </ul>

              {/* Description */}
              {product.description && (
                <div style={{ marginTop: 30 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Details</h2>
                  <div style={{ display: "grid", gap: 14 }}>
                    {paragraphs(product.description).map((para, index) => (
                      <p key={index} className="w-muted" style={{ fontSize: 14.5, lineHeight: 1.75 }}>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="w-sec" style={{ paddingBlock: 72, background: "var(--w-surface)" }}>
          <div className="w-in" style={{ maxWidth: "var(--w-container)" }}>
            <SectionHeading title="You might also like" align="center" />
            <div className="w-grid" style={{ "--sec-cols": 4, "--sec-gap": "20px" } as React.CSSProperties}>
              {related.map((item) => (
                <ProductCard key={item.id} product={item} ctx={ctx} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Reassurance({ icon: Icon, children }: { icon: typeof Truck; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13.5 }}>
      <Icon size={16} style={{ color: "var(--w-primary)", flexShrink: 0 }} />
      <span className="w-muted">{children}</span>
    </li>
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
        width: 30,
        height: 30,
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

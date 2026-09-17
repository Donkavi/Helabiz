"use client";

import * as React from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { SectionNode } from "@/types";
import type { PublicProduct, SiteContext } from "@/lib/website/render-types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "../cart-provider";
import { SectionHeading, SiteButton, SiteImage, SiteLink, cardClass, lines } from "../primitives";
import { CatalogueFilterBar, useCatalogueFilters } from "./catalogue-filters";

type P = { node: SectionNode; ctx: SiteContext };
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export type CatalogueFilters = { category?: string; q?: string; sort?: string };

/**
 * Resolves the products a commerce section should display from live catalogue
 * data. URL filters (set by category links and the shop filter bar) win over
 * the section's own settings so one grid can serve as the whole shop page.
 */
export function selectProducts(
  props: Record<string, unknown>,
  products: PublicProduct[],
  filters: CatalogueFilters = {},
  categories: { id: string; slug: string }[] = [],
): PublicProduct[] {
  const source = str(props.source, "all");
  let list = [...products];

  if (source === "featured") list = list.filter((p) => p.featured);
  if (source === "category" && str(props.categoryId)) list = list.filter((p) => p.categoryId === str(props.categoryId));

  if (filters.category) {
    const match = categories.find((c) => c.slug === filters.category || c.id === filters.category);
    if (match) list = list.filter((p) => p.categoryId === match.id);
  }
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.shortDescription ?? ""}`.toLowerCase().includes(needle));
  }
  if (source === "manual") {
    const ids = arr<string>(props.productIds);
    list = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is PublicProduct => Boolean(p));
    return list.slice(0, num(props.limit, 8));
  }

  switch (filters.sort || str(props.sort, "newest")) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "best-selling":
      list.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }

  // A filtered shop view should show everything that matches, not just a teaser.
  const limit = filters.category || filters.q ? Math.max(num(props.limit, 8), 60) : num(props.limit, 8);
  return list.slice(0, limit);
}

/* ── Product card (shared by grid, shop page and related products) ─────── */
export function ProductCard({
  product,
  ctx,
  showPrice = true,
  showSaleBadge = true,
  showStock = false,
  showAddToCart = true,
}: {
  product: PublicProduct;
  ctx: SiteContext;
  showPrice?: boolean;
  showSaleBadge?: boolean;
  showStock?: boolean;
  showAddToCart?: boolean;
}) {
  const cart = useCart();
  const [added, setAdded] = React.useState(false);
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const soldOut = product.trackInventory && product.stock <= 0;
  const discount = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ctx.editor || soldOut) return;
    cart.add({
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.images?.[0],
      slug: product.slug,
      stock: product.trackInventory ? product.stock : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <SiteLink ctx={ctx} href={`/products/${product.slug}`} className={`${cardClass(ctx)} w-prod`} >
      <div style={{ position: "relative", aspectRatio: "1/1", background: "var(--w-surface)", overflow: "hidden" }}>
        <SiteImage src={product.images?.[0]} alt={product.name} className="w-img w-prod-img" />
        {showSaleBadge && onSale && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "var(--w-primary)",
              color: "var(--w-btn-on-primary,#fff)",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: 999,
            }}
          >
            −{discount}%
          </span>
        )}
        {soldOut && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,.72)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 999,
            }}
          >
            Sold out
          </span>
        )}
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{product.name}</h3>
        {showPrice && (
          <p style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 14.5, fontWeight: 600 }}>
            {formatCurrency(product.price, { decimals: false })}
            {onSale && (
              <span className="w-muted" style={{ fontWeight: 400, fontSize: 13, textDecoration: "line-through" }}>
                {formatCurrency(product.compareAtPrice!, { decimals: false })}
              </span>
            )}
          </p>
        )}
        {showStock && (
          <p className="w-muted" style={{ fontSize: 12.5 }}>
            {soldOut ? "Out of stock" : product.trackInventory ? `${product.stock} in stock` : "In stock"}
          </p>
        )}
        {showAddToCart && ctx.settings.showCart && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="w-btn w-btn--sm"
            style={{
              marginTop: 4,
              width: "100%",
              background: added ? "color-mix(in srgb,var(--w-primary) 16%,transparent)" : "var(--w-primary)",
              color: added ? "var(--w-primary)" : "var(--w-btn-on-primary,#fff)",
              opacity: soldOut ? 0.5 : 1,
              cursor: soldOut ? "not-allowed" : "pointer",
            }}
          >
            {added ? <Check size={14} /> : <ShoppingBag size={14} />}
            {added ? "Added" : soldOut ? "Sold out" : "Add to cart"}
          </button>
        )}
      </div>
    </SiteLink>
  );
}

/* ── Product grid ─────────────────────────────────────────────────────── */

const NO_FILTERS: CatalogueFilters = {};

/**
 * The editor and the template previews have no URL to filter by, and
 * useSearchParams() opts a route out of static rendering entirely. So the
 * URL-reading variant is only ever mounted on the public site.
 */
export function ProductGridSection({ node, ctx }: P) {
  if (ctx.editor) return <ProductGrid node={node} ctx={ctx} filters={NO_FILTERS} />;
  return <FilteredProductGrid node={node} ctx={ctx} />;
}

function FilteredProductGrid({ node, ctx }: P) {
  const filters = useCatalogueFilters();
  return <ProductGrid node={node} ctx={ctx} filters={filters} />;
}

function ProductGrid({ node, ctx, filters }: P & { filters: CatalogueFilters }) {
  const p = node.props;
  const products = selectProducts(p, ctx.products, filters, ctx.categories);
  const filtering = Boolean(filters.category || filters.q || filters.sort);
  const activeCategory = ctx.categories.find((c) => c.slug === filters.category);

  if (!products.length) {
    return (
      <div className="w-in">
        <SectionHeading title={str(p.title)} subtitle={str(p.subtitle)} align={node.styles.align ?? "center"} />
        <div
          style={{
            border: "1px dashed color-mix(in srgb,var(--w-text) 20%,transparent)",
            borderRadius: "var(--sec-radius)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, fontSize: 15 }}>
            {filtering ? "Nothing matches that" : "No products to show yet"}
          </p>
          <p className="w-muted" style={{ marginTop: 6, fontSize: 14 }}>
            {filtering
              ? "Try another category, or clear the filters to see everything."
              : ctx.editor
                ? "Add products in your dashboard and they will appear here automatically."
                : "New products are coming soon — check back shortly."}
          </p>
          {filtering && !ctx.editor && (
            <div style={{ marginTop: 18 }}>
              <SiteButton ctx={ctx} href="/shop" label="Show everything" variant="outline" size="sm" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-in">
      <SectionHeading title={str(p.title)} subtitle={str(p.subtitle)} align={node.styles.align ?? "center"} />

      {bool(p.showFilters, false) && !ctx.editor && (
        <CatalogueFilterBar
          ctx={ctx}
          filters={filters}
          count={products.length}
          activeCategoryName={activeCategory?.name}
        />
      )}

      <div className="w-grid" style={{ "--sec-cols": num(p.columns, 4) } as React.CSSProperties}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            ctx={ctx}
            showPrice={bool(p.showPrice, true)}
            showSaleBadge={bool(p.showSaleBadge, true)}
            showStock={bool(p.showStock, false)}
            showAddToCart={bool(p.showAddToCart, true)}
          />
        ))}
      </div>
      {bool(p.showViewAll, true) && !filtering && (
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <SiteButton ctx={ctx} href="/shop" label="View all products" variant="outline" />
        </div>
      )}
    </div>
  );
}

/* ── Featured product ─────────────────────────────────────────────────── */
export function FeaturedProductSection({ node, ctx }: P) {
  const p = node.props;
  const ids = Array.isArray(p.productId) ? (p.productId as string[]) : [str(p.productId)];
  const product = ctx.products.find((x) => x.id === ids[0]) ?? ctx.products.find((x) => x.featured) ?? ctx.products[0];
  const imageRight = str(p.layout, "image-left") === "image-right";

  if (!product) {
    return (
      <div className="w-in" style={{ textAlign: "center", padding: 40 }}>
        <p className="w-muted">Add a product to your catalogue to feature it here.</p>
      </div>
    );
  }

  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div
      className="w-in"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
        gap: "var(--sec-gap,48px)",
        alignItems: "center",
        direction: imageRight ? "rtl" : undefined,
      }}
    >
      <div style={{ direction: "ltr", borderRadius: "var(--sec-radius)", overflow: "hidden", aspectRatio: "1/1", background: "var(--w-surface)" }}>
        <SiteImage src={product.images?.[0]} alt={product.name} className="w-img" />
      </div>
      <div style={{ direction: "ltr" }}>
        {str(p.eyebrow) && <p className="w-eyebrow" style={{ marginBottom: 12 }}>{str(p.eyebrow)}</p>}
        <h2 style={{ fontSize: "clamp(24px,3.2vw,38px)", fontWeight: 600 }}>{product.name}</h2>
        {product.shortDescription && (
          <p className="w-muted" style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.7 }}>
            {product.shortDescription}
          </p>
        )}
        {bool(p.showPrice, true) && (
          <p style={{ marginTop: 20, fontSize: 24, fontWeight: 600, display: "flex", gap: 12, alignItems: "baseline" }}>
            {formatCurrency(product.price, { decimals: false })}
            {onSale && (
              <span className="w-muted" style={{ fontSize: 16, fontWeight: 400, textDecoration: "line-through" }}>
                {formatCurrency(product.compareAtPrice!, { decimals: false })}
              </span>
            )}
          </p>
        )}
        <div style={{ marginTop: 26 }}>
          <SiteButton ctx={ctx} href={`/products/${product.slug}`} label={str(p.buttonText, "View product")} size="lg" />
        </div>
      </div>
    </div>
  );
}

/* ── Categories ───────────────────────────────────────────────────────── */
export function CategoriesSection({ node, ctx }: P) {
  const p = node.props;
  const items = ctx.categories.slice(0, num(p.limit, 6));
  const textOnly = str(p.style, "image") === "text";

  if (!items.length) {
    return (
      <div className="w-in" style={{ textAlign: "center", padding: 32 }}>
        <p className="w-muted">Create categories in your dashboard to show them here.</p>
      </div>
    );
  }

  return (
    <div className="w-in">
      <SectionHeading title={str(p.title)} align={node.styles.align ?? "center"} />
      <div className="w-grid" style={{ "--sec-cols": num(p.columns, 3) } as React.CSSProperties}>
        {items.map((category) => (
          <SiteLink
            ctx={ctx}
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className={cardClass(ctx)}
            style={{ display: "block", position: "relative", overflow: "hidden" }}
          >
            {!textOnly && (
              <div style={{ aspectRatio: "4/3", background: "var(--w-surface)" }}>
                <SiteImage src={category.image} alt={category.name} className="w-img" />
              </div>
            )}
            <div style={{ padding: textOnly ? "28px 20px" : 16, textAlign: textOnly ? "center" : "left" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{category.name}</h3>
            </div>
          </SiteLink>
        ))}
      </div>
    </div>
  );
}

/* ── Cards ────────────────────────────────────────────────────────────── */
export function CardsSection({ node, ctx }: P) {
  const p = node.props;
  const items = arr<{ image?: string; icon?: string; title?: string; description?: string; price?: string; buttonText?: string; link?: string }>(p.items);

  return (
    <div className="w-in">
      <SectionHeading title={str(p.title)} align={node.styles.align ?? "center"} />
      <div className="w-grid" style={{ "--sec-cols": num(p.columns, 3) } as React.CSSProperties}>
        {items.map((item, i) => (
          <article key={i} className={cardClass(ctx)} style={{ display: "flex", flexDirection: "column" }}>
            {item.image && (
              <div style={{ aspectRatio: "4/3", background: "var(--w-surface)" }}>
                <SiteImage src={item.image} alt={item.title ?? ""} className="w-img" />
              </div>
            )}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>{item.title}</h3>
              {item.description && (
                <p className="w-muted" style={{ fontSize: 14, lineHeight: 1.65 }}>
                  {item.description}
                </p>
              )}
              {item.price && (
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--w-primary)", marginTop: 2 }}>{item.price}</p>
              )}
              {bool(p.showButton, true) && item.buttonText && (
                <div style={{ marginTop: "auto", paddingTop: 12 }}>
                  <SiteButton ctx={ctx} href={item.link} label={item.buttonText} variant="outline" size="sm" />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────── */
export function PricingSection({ node, ctx }: P) {
  const p = node.props;
  const items = arr<{ name?: string; price?: string; period?: string; features?: string; buttonText?: string; link?: string; featured?: boolean }>(p.items);

  return (
    <div className="w-in">
      <SectionHeading title={str(p.title)} align={node.styles.align ?? "center"} />
      <div className="w-grid" style={{ "--sec-cols": Math.min(items.length || 3, 3) } as React.CSSProperties}>
        {items.map((item, i) => (
          <article
            key={i}
            className={cardClass(ctx)}
            style={{
              padding: 26,
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
              outline: item.featured ? "2px solid var(--w-primary)" : undefined,
            }}
          >
            {item.featured && (
              <span
                style={{
                  alignSelf: "flex-start",
                  background: "var(--w-primary)",
                  color: "var(--w-btn-on-primary,#fff)",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 999,
                  marginBottom: 14,
                }}
              >
                Most popular
              </span>
            )}
            <h3 style={{ fontSize: 17, fontWeight: 600 }}>{item.name}</h3>
            <p style={{ marginTop: 12, fontSize: 30, fontWeight: 600, fontFamily: "var(--w-heading-font)" }}>
              {item.price}
              {item.period && (
                <span className="w-muted" style={{ fontSize: 13.5, fontWeight: 400 }}>
                  {" "}
                  {item.period}
                </span>
              )}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "22px 0 0", display: "grid", gap: 10, flex: 1 }}>
              {lines(item.features).map((feature, f) => (
                <li key={f} style={{ display: "flex", gap: 9, fontSize: 14, alignItems: "flex-start" }}>
                  <Check size={15} style={{ color: "var(--w-primary)", flexShrink: 0, marginTop: 2 }} />
                  {feature}
                </li>
              ))}
            </ul>
            {item.buttonText && (
              <div style={{ marginTop: 24 }}>
                <SiteButton
                  ctx={ctx}
                  href={item.link}
                  label={item.buttonText}
                  variant={item.featured ? undefined : "outline"}
                  className="w-btn-full"
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ── Shopping CTA ─────────────────────────────────────────────────────── */
export function ShoppingCtaSection({ node, ctx }: P) {
  const p = node.props;
  return (
    <div className="w-in">
      <div
        style={{
          position: "relative",
          borderRadius: "var(--sec-radius)",
          overflow: "hidden",
          minHeight: node.styles.minHeight ?? 320,
          display: "grid",
          placeItems: "center",
          padding: "56px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <SiteImage src={str(p.image)} alt="" className="w-img" />
          <span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.48)" }} />
        </div>
        <div style={{ position: "relative", color: "#fff", maxWidth: 560 }}>
          <h2 style={{ fontSize: "clamp(24px,3.2vw,38px)", fontWeight: 600 }}>{str(p.title)}</h2>
          {str(p.description) && (
            <p style={{ marginTop: 14, fontSize: 16, color: "rgba(255,255,255,.88)", lineHeight: 1.6 }}>
              {str(p.description)}
            </p>
          )}
          <div style={{ marginTop: 26 }}>
            <SiteButton ctx={ctx} href={str(p.buttonUrl)} label={str(p.buttonText)} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

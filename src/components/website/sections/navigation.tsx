"use client";

import * as React from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { useCart } from "../cart-provider";
import { SiteButton, SiteImage, SiteLink } from "../primitives";

type P = { node: SectionNode; ctx: SiteContext };
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);

function navItems(ctx: SiteContext) {
  if (ctx.navigation?.length) return ctx.navigation;
  return ctx.pages
    .filter((p) => !p.isHome)
    .map((p) => ({ id: p.slug, label: p.title, href: `/${p.slug}` }));
}

export function HeaderSection({ node, ctx }: P) {
  const p = node.props;
  const cart = useCart();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const style = str(p.style, "simple");
  const items = navItems(ctx);
  const logoText = str(p.logoText) || ctx.business.name;

  const logo = (
    <SiteLink ctx={ctx} href="/" className="w-logo">
      {ctx.business.logo ? (
        <SiteImage src={ctx.business.logo} alt={ctx.business.name} style={{ height: 34, width: "auto", objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "var(--w-heading-font)" }}>
          {logoText}
        </span>
      )}
    </SiteLink>
  );

  const links = (
    <nav style={{ display: "flex", gap: 26, alignItems: "center" }} aria-label="Site">
      {items.map((item) => (
        <SiteLink ctx={ctx} key={item.id} href={item.href} className="w-nav-link">
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>{item.label}</span>
        </SiteLink>
      ))}
    </nav>
  );

  const actions = (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {str(p.buttonText) && <SiteButton ctx={ctx} href={str(p.buttonUrl)} label={str(p.buttonText)} size="sm" />}
      {ctx.settings.customerAccounts && (
        <SiteLink ctx={ctx} href="/account" ariaLabel="My account" style={{ display: "inline-flex", padding: 4, color: "inherit" }}>
          <UserRound size={20} />
        </SiteLink>
      )}
      {bool(p.showCart, true) && ctx.settings.showCart && (
        <button
          type="button"
          onClick={() => !ctx.editor && cart.setOpen(true)}
          aria-label={`Cart, ${cart.count} item${cart.count === 1 ? "" : "s"}`}
          style={{ position: "relative", background: "none", border: 0, cursor: "pointer", color: "inherit", padding: 4 }}
        >
          <ShoppingBag size={20} />
          {cart.count > 0 && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                minWidth: 17,
                height: 17,
                borderRadius: 999,
                background: "var(--w-primary)",
                color: "var(--w-btn-on-primary,#fff)",
                fontSize: 10.5,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                padding: "0 4px",
              }}
            >
              {cart.count}
            </span>
          )}
        </button>
      )}
      <button
        type="button"
        className="w-burger"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", padding: 4, display: "none" }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );

  return (
    <>
      <div
        className="w-in"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          justifyContent: style === "centered" ? "center" : "space-between",
          flexDirection: style === "centered" ? "column" : "row",
        }}
      >
        {style === "split" ? (
          <>
            <div className="w-nav-desktop">{links}</div>
            {logo}
            {actions}
          </>
        ) : style === "centered" ? (
          <>
            {logo}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div className="w-nav-desktop">{links}</div>
              {actions}
            </div>
          </>
        ) : style === "minimal" ? (
          <>
            {logo}
            {actions}
          </>
        ) : (
          <>
            {logo}
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div className="w-nav-desktop">{links}</div>
              {actions}
            </div>
          </>
        )}
      </div>

      {mobileOpen && (
        <div className="w-in" style={{ paddingTop: 14, paddingBottom: 6 }}>
          <nav style={{ display: "grid", gap: 4 }} aria-label="Mobile">
            {items.map((item) => (
              <SiteLink ctx={ctx} key={item.id} href={item.href}>
                <span style={{ display: "block", padding: "10px 0", fontSize: 15, fontWeight: 500 }}>{item.label}</span>
              </SiteLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

export function FooterSection({ node, ctx }: P) {
  const p = node.props;
  const style = str(p.style, "columns");
  const items = navItems(ctx);
  const { business } = ctx;
  const copyright = str(p.copyright) || `© ${new Date().getFullYear()} ${business.name}. All rights reserved.`;

  const about = str(p.about) || business.description;

  if (style === "simple" || style === "centered") {
    const centered = style === "centered";
    return (
      <div
        className="w-in"
        style={{
          display: "flex",
          flexDirection: centered ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          textAlign: centered ? "center" : undefined,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16, fontFamily: "var(--w-heading-font)" }}>{business.name}</span>
        {bool(p.showNav, true) && (
          <nav style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }} aria-label="Footer">
            {items.map((item) => (
              <SiteLink ctx={ctx} key={item.id} href={item.href}>
                <span className="w-muted" style={{ fontSize: 14 }}>
                  {item.label}
                </span>
              </SiteLink>
            ))}
          </nav>
        )}
        <span className="w-muted" style={{ fontSize: 13 }}>
          {copyright}
        </span>
      </div>
    );
  }

  return (
    <div className="w-in">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 40 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 18, fontFamily: "var(--w-heading-font)" }}>{business.name}</p>
          {about && (
            <p className="w-muted" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.65, maxWidth: 300 }}>
              {about}
            </p>
          )}
        </div>

        {bool(p.showNav, true) && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Pages</p>
            <nav style={{ display: "grid", gap: 10, marginTop: 16 }} aria-label="Footer">
              {items.map((item) => (
                <SiteLink ctx={ctx} key={item.id} href={item.href}>
                  <span className="w-muted" style={{ fontSize: 14 }}>
                    {item.label}
                  </span>
                </SiteLink>
              ))}
            </nav>
          </div>
        )}

        {bool(p.showContact, true) && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Contact</p>
            <div className="w-muted" style={{ display: "grid", gap: 10, marginTop: 16, fontSize: 14 }}>
              {business.phone && <span>{business.phone}</span>}
              {business.email && <span>{business.email}</span>}
              {(business.address || business.city) && (
                <span>{[business.address, business.city].filter(Boolean).join(", ")}</span>
              )}
            </div>
          </div>
        )}

        {bool(p.showSocial, true) && business.social && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Follow</p>
            <div style={{ display: "grid", gap: 10, marginTop: 16, fontSize: 14 }}>
              {Object.entries(business.social)
                .filter(([, value]) => value)
                .map(([key, value]) =>
                  ctx.editor ? (
                    <span key={key} className="w-muted" style={{ textTransform: "capitalize" }}>
                      {key}
                    </span>
                  ) : (
                    <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="w-muted" style={{ textTransform: "capitalize" }}>
                      {key}
                    </a>
                  ),
                )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 40,
          paddingTop: 22,
          borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)",
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <span className="w-muted" style={{ fontSize: 13 }}>
          {copyright}
        </span>
        {bool(p.poweredBy, true) && (
          <span className="w-muted" style={{ fontSize: 13 }}>
            Made with Helabiz
          </span>
        )}
      </div>
    </div>
  );
}

export function NavMenuSection({ node, ctx }: P) {
  const items = navItems(ctx);
  const align = str(node.props.align, "center");
  return (
    <div
      className="w-in"
      style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}
    >
      {items.map((item) => (
        <SiteLink ctx={ctx} key={item.id} href={item.href}>
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>{item.label}</span>
        </SiteLink>
      ))}
    </div>
  );
}

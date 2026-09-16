"use client";

import * as React from "react";
import { ChevronDown, Star } from "lucide-react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { iconFor } from "@/lib/website/icons";
import { SectionHeading, SiteButton, SiteImage, SiteLink, cardClass, paragraphs } from "../primitives";

type P = { node: SectionNode; ctx: SiteContext };
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* ── Hero ─────────────────────────────────────────────────────────────── */
export function HeroSection({ node, ctx }: P) {
  const p = node.props;
  const layout = str(p.layout, "text-left");
  const title = str(p.title);
  const image = str(p.image);
  const textWidth = num(p.textWidth, 560);
  const centered = layout === "centered" || layout === "background";

  const copy = (
    <div style={{ maxWidth: centered ? Math.max(textWidth, 640) : textWidth, marginInline: centered ? "auto" : undefined }}>
      {str(p.eyebrow) && <p className="w-eyebrow" style={{ marginBottom: 14 }}>{str(p.eyebrow)}</p>}
      {title && (
        <h1 style={{ fontSize: "clamp(32px,5vw,58px)", fontWeight: 600, whiteSpace: "pre-line" }}>{title}</h1>
      )}
      {str(p.description) && (
        <p
          className="w-muted"
          style={{ marginTop: 18, fontSize: "clamp(15px,1.5vw,18px)", lineHeight: 1.6, color: layout === "background" ? "rgba(255,255,255,.86)" : undefined }}
        >
          {str(p.description)}
        </p>
      )}
      {(str(p.buttonText) || str(p.secondaryButtonText)) && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 30,
            flexWrap: "wrap",
            justifyContent: centered ? "center" : undefined,
          }}
        >
          <SiteButton ctx={ctx} href={str(p.buttonUrl)} label={str(p.buttonText)} size="lg" />
          <SiteButton
            ctx={ctx}
            href={str(p.secondaryButtonUrl)}
            label={str(p.secondaryButtonText)}
            variant="outline"
            size="lg"
          />
        </div>
      )}
    </div>
  );

  if (layout === "background") {
    return (
      <>
        {image && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <SiteImage src={image} alt="" className="w-img" priority />
            <span className="w-overlay" />
          </div>
        )}
        <div
          className="w-in"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#fff", minHeight: "inherit" }}
        >
          {copy}
        </div>
      </>
    );
  }

  if (layout === "centered") {
    return (
      <div className="w-in" style={{ textAlign: "center" }}>
        {copy}
        {image && (
          <div
            style={{ marginTop: 48, borderRadius: "var(--sec-radius)", overflow: "hidden", aspectRatio: "16/8" }}
          >
            <SiteImage src={image} alt="" className="w-img" priority />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-in w-hero-split"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
        gap: 48,
        alignItems: "center",
        direction: layout === "text-right" ? "rtl" : undefined,
      }}
    >
      <div style={{ direction: "ltr" }}>{copy}</div>
      <div
        style={{
          direction: "ltr",
          borderRadius: "var(--sec-radius)",
          overflow: "hidden",
          aspectRatio: "4/3",
          background: "var(--w-surface)",
        }}
      >
        <SiteImage src={image} alt="" className="w-img" priority />
      </div>
    </div>
  );
}

/* ── Call to action ───────────────────────────────────────────────────── */
export function CtaSection({ node, ctx }: P) {
  const p = node.props;
  const boxed = bool(p.boxed, true);
  const inner = (
    <div style={{ textAlign: "center" }}>
      <h2 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 600 }}>{str(p.title)}</h2>
      {str(p.description) && (
        <p className="w-muted" style={{ marginTop: 12, fontSize: 16, maxWidth: 560, marginInline: "auto", lineHeight: 1.6 }}>
          {str(p.description)}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 26, justifyContent: "center", flexWrap: "wrap" }}>
        <SiteButton ctx={ctx} href={str(p.buttonUrl)} label={str(p.buttonText)} size="lg" />
        <SiteButton ctx={ctx} href={str(p.secondaryButtonUrl)} label={str(p.secondaryButtonText)} variant="outline" size="lg" />
      </div>
    </div>
  );
  return (
    <div className="w-in">
      {boxed ? (
        <div className={cardClass(ctx)} style={{ padding: "56px 28px", borderRadius: "var(--sec-radius)" }}>
          {inner}
        </div>
      ) : (
        inner
      )}
    </div>
  );
}

/* ── Features ─────────────────────────────────────────────────────────── */
export function FeaturesSection({ node }: P) {
  const p = node.props;
  const items = arr<{ icon?: string; title?: string; description?: string }>(p.items);
  return (
    <div className="w-in">
      <SectionHeading eyebrow={str(p.eyebrow)} title={str(p.title)} align={node.styles.align ?? "center"} />
      <div className="w-grid" style={{ "--sec-cols": num(p.columns, 3) } as React.CSSProperties}>
        {items.map((item, i) => {
          const Icon = iconFor(item.icon);
          return (
            <div key={i} style={{ textAlign: node.styles.align === "left" ? "left" : "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  width: 46,
                  height: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--sec-radius)",
                  background: "color-mix(in srgb,var(--w-primary) 12%,transparent)",
                  color: "var(--w-primary)",
                  marginBottom: 16,
                }}
              >
                <Icon size={21} />
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>{item.title}</h3>
              <p className="w-muted" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.65 }}>
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────── */
export function TestimonialsSection({ node, ctx }: P) {
  const p = node.props;
  const items = arr<{ quote?: string; name?: string; role?: string; rating?: number }>(p.items);
  const single = str(p.layout, "cards") === "single";

  return (
    <div className="w-in">
      <SectionHeading eyebrow={str(p.eyebrow)} title={str(p.title)} align={node.styles.align ?? "center"} />
      <div
        className={single ? undefined : "w-grid"}
        style={single ? { maxWidth: 720, marginInline: "auto", textAlign: "center" } : ({ "--sec-cols": Math.min(items.length || 3, 3) } as React.CSSProperties)}
      >
        {(single ? items.slice(0, 1) : items).map((item, i) => (
          <figure
            key={i}
            className={single ? undefined : cardClass(ctx)}
            style={{ padding: single ? 0 : 26, margin: 0, display: "flex", flexDirection: "column" }}
          >
            {!!item.rating && (
              <div style={{ display: "flex", gap: 2, marginBottom: 14, justifyContent: single ? "center" : undefined }}>
                {Array.from({ length: Math.round(item.rating) }).map((_, s) => (
                  <Star key={s} size={15} fill="currentColor" style={{ color: "var(--w-primary)" }} />
                ))}
              </div>
            )}
            <blockquote style={{ margin: 0, fontSize: single ? 21 : 15.5, lineHeight: 1.65, flex: 1 }}>
              “{item.quote}”
            </blockquote>
            <figcaption style={{ marginTop: 20, fontSize: 14 }}>
              <strong style={{ fontWeight: 600 }}>{item.name}</strong>
              {item.role && <span className="w-muted"> · {item.role}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ── Statistics ───────────────────────────────────────────────────────── */
export function StatsSection({ node }: P) {
  const items = arr<{ value?: string; label?: string }>(node.props.items);
  return (
    <div className="w-in">
      <div className="w-grid" style={{ "--sec-cols": Math.min(items.length || 4, 4) } as React.CSSProperties}>
        {items.map((item, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <p style={{ fontSize: "clamp(28px,3.4vw,40px)", fontWeight: 600, color: "var(--w-primary)", fontFamily: "var(--w-heading-font)" }}>
              {item.value}
            </p>
            <p className="w-muted" style={{ marginTop: 6, fontSize: 14 }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */
export function FaqSection({ node, ctx }: P) {
  const items = arr<{ question?: string; answer?: string }>(node.props.items);
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <div className="w-in">
      <SectionHeading title={str(node.props.title)} align={node.styles.align ?? "left"} />
      <div style={{ borderTop: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)" }}>
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderBottom: "1px solid color-mix(in srgb,var(--w-text) 12%,transparent)" }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "18px 0",
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  font: "inherit",
                  color: "inherit",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {item.question}
                <ChevronDown
                  size={17}
                  style={{ flexShrink: 0, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : undefined, color: "var(--w-muted)" }}
                />
              </button>
              {isOpen && (
                <p className="w-muted" style={{ paddingBottom: 20, fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {ctx.editor && !items.length && <p className="w-muted">Add your first question in the settings panel.</p>}
    </div>
  );
}

/* ── Announcement ─────────────────────────────────────────────────────── */
export function AnnouncementSection({ node, ctx }: P) {
  const p = node.props;
  return (
    <div className="w-in" style={{ display: "flex", justifyContent: "center", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span>{str(p.text)}</span>
      {str(p.linkText) && (
        <SiteLink ctx={ctx} href={str(p.linkUrl)} className="w-ann-link">
          <span style={{ textDecoration: "underline", fontWeight: 600 }}>{str(p.linkText)}</span>
        </SiteLink>
      )}
    </div>
  );
}

/* ── Rich text / about-style prose helper shared by content sections ──── */
export function Prose({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={className} style={{ display: "grid", gap: 16 }}>
      {paragraphs(text).map((para, i) => (
        <p key={i} style={{ fontSize: 15.5, lineHeight: 1.75 }} className="w-muted">
          {para}
        </p>
      ))}
    </div>
  );
}

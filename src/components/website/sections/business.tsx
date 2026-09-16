"use client";

import * as React from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { iconFor } from "@/lib/website/icons";
import { SOCIAL_ICONS } from "../social-icons";
import { whatsappLink } from "@/lib/whatsapp";
import { Prose } from "./marketing";
import { SectionHeading, SiteButton, SiteImage, cardClass } from "../primitives";

type P = { node: SectionNode; ctx: SiteContext };
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* ── About ────────────────────────────────────────────────────────────── */
export function AboutSection({ node, ctx }: P) {
  const p = node.props;
  const imageLeft = str(p.layout, "image-right") === "image-left";
  return (
    <div
      className="w-in"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
        gap: "var(--sec-gap,56px)",
        alignItems: "center",
        direction: imageLeft ? "rtl" : undefined,
      }}
    >
      <div style={{ direction: "ltr" }}>
        {str(p.eyebrow) && <p className="w-eyebrow" style={{ marginBottom: 12 }}>{str(p.eyebrow)}</p>}
        <h2 style={{ fontSize: "clamp(24px,3.2vw,36px)", fontWeight: 600, marginBottom: 20 }}>{str(p.title)}</h2>
        <Prose text={str(p.body)} />
        {str(p.buttonText) && (
          <div style={{ marginTop: 26 }}>
            <SiteButton ctx={ctx} href={str(p.buttonUrl)} label={str(p.buttonText)} />
          </div>
        )}
      </div>
      <div style={{ direction: "ltr", borderRadius: "var(--sec-radius)", overflow: "hidden", aspectRatio: "4/5", background: "var(--w-surface)" }}>
        <SiteImage src={str(p.image)} alt="" className="w-img" />
      </div>
    </div>
  );
}

/* ── Services ─────────────────────────────────────────────────────────── */
export function ServicesSection({ node, ctx }: P) {
  const p = node.props;
  const items = arr<{ icon?: string; title?: string; description?: string; price?: string }>(p.items);
  return (
    <div className="w-in">
      <SectionHeading eyebrow={str(p.eyebrow)} title={str(p.title)} align={node.styles.align ?? "left"} />
      <div className="w-grid" style={{ "--sec-cols": num(p.columns, 2) } as React.CSSProperties}>
        {items.map((item, i) => {
          const Icon = iconFor(item.icon);
          return (
            <article key={i} className={cardClass(ctx)} style={{ padding: 24, display: "flex", gap: 16 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 42,
                  height: 42,
                  borderRadius: "var(--sec-radius)",
                  display: "grid",
                  placeItems: "center",
                  background: "color-mix(in srgb,var(--w-primary) 12%,transparent)",
                  color: "var(--w-primary)",
                }}
              >
                <Icon size={19} />
              </span>
              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 600 }}>{item.title}</h3>
                {item.description && (
                  <p className="w-muted" style={{ marginTop: 7, fontSize: 14, lineHeight: 1.65 }}>
                    {item.description}
                  </p>
                )}
                {item.price && (
                  <p style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: "var(--w-primary)" }}>{item.price}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ── Team ─────────────────────────────────────────────────────────────── */
export function TeamSection({ node }: P) {
  const p = node.props;
  const items = arr<{ image?: string; name?: string; role?: string; bio?: string }>(p.items);
  return (
    <div className="w-in">
      <SectionHeading title={str(p.title)} align={node.styles.align ?? "center"} />
      <div className="w-grid" style={{ "--sec-cols": num(p.columns, 3) } as React.CSSProperties}>
        {items.map((item, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                maxWidth: 200,
                margin: "0 auto",
                aspectRatio: "1/1",
                borderRadius: "var(--sec-radius)",
                overflow: "hidden",
                background: "var(--w-surface)",
              }}
            >
              <SiteImage src={item.image} alt={item.name ?? ""} className="w-img" />
            </div>
            <h3 style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>{item.name}</h3>
            <p className="w-muted" style={{ marginTop: 3, fontSize: 13.5 }}>
              {item.role}
            </p>
            {item.bio && (
              <p className="w-muted" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
                {item.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Contact ──────────────────────────────────────────────────────────── */
export function ContactSection({ node, ctx }: P) {
  const p = node.props;
  const { business } = ctx;
  const [sent, setSent] = React.useState(false);

  const details = [
    business.phone && { icon: Phone, label: business.phone, href: `tel:${business.phone}` },
    business.email && { icon: Mail, label: business.email, href: `mailto:${business.email}` },
    (business.address || business.city) &&
      { icon: MapPin, label: [business.address, business.city].filter(Boolean).join(", "), href: undefined },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href?: string }[];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (ctx.editor) return;
    const data = new FormData(e.currentTarget);
    const message = [
      `Hello ${business.name},`,
      "",
      `My name is ${data.get("name")}.`,
      data.get("phone") ? `Phone: ${data.get("phone")}` : "",
      "",
      String(data.get("message") ?? ""),
    ]
      .filter((l) => l !== "")
      .join("\n");
    const target = business.whatsapp || business.phone;
    if (target) window.open(whatsappLink(target, message), "_blank", "noopener");
    setSent(true);
  };

  return (
    <div className="w-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--sec-gap,48px)" }}>
      <div>
        <h2 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 600 }}>{str(p.title)}</h2>
        {str(p.description) && (
          <p className="w-muted" style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.7 }}>
            {str(p.description)}
          </p>
        )}
        {bool(p.showDetails, true) && (
          <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "grid", gap: 14 }}>
            {details.map((detail, i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14.5 }}>
                <detail.icon size={17} style={{ color: "var(--w-primary)", flexShrink: 0 }} />
                {detail.href && !ctx.editor ? <a href={detail.href}>{detail.label}</a> : <span>{detail.label}</span>}
              </li>
            ))}
          </ul>
        )}
        {bool(p.whatsappButton, true) && (business.whatsapp || business.phone) && (
          <div style={{ marginTop: 26 }}>
            <SiteButton
              ctx={ctx}
              href={whatsappLink(business.whatsapp || business.phone!, `Hello ${business.name}, I have a question.`)}
              label="Message on WhatsApp"
              variant="soft"
            />
          </div>
        )}
      </div>

      {bool(p.showForm, true) && (
        <form onSubmit={onSubmit} className={cardClass(ctx)} style={{ padding: 24, display: "grid", gap: 14 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "28px 8px" }}>
              <MessageCircle size={26} style={{ color: "var(--w-primary)" }} />
              <p style={{ marginTop: 12, fontWeight: 600 }}>Thank you — your message is on its way.</p>
              <p className="w-muted" style={{ marginTop: 6, fontSize: 14 }}>
                We will get back to you as soon as we can.
              </p>
            </div>
          ) : (
            <>
              <ContactField label="Your name" name="name" required />
              <ContactField label="Phone number" name="phone" type="tel" />
              <ContactField label="Email" name="email" type="email" />
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
                Message
                <textarea
                  name="message"
                  rows={4}
                  required
                  style={{
                    font: "inherit",
                    fontSize: 14,
                    padding: "10px 12px",
                    borderRadius: "calc(var(--w-radius) * .8)",
                    border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
                    background: "var(--w-bg)",
                    color: "inherit",
                    resize: "vertical",
                  }}
                />
              </label>
              <button type="submit" className="w-btn w-btn--solid" style={{ width: "100%" }}>
                {str(p.buttonText, "Send message")}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}

function ContactField({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        style={{
          font: "inherit",
          fontSize: 14,
          padding: "10px 12px",
          borderRadius: "calc(var(--w-radius) * .8)",
          border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
          background: "var(--w-bg)",
          color: "inherit",
        }}
      />
    </label>
  );
}

/* ── Location ─────────────────────────────────────────────────────────── */
export function LocationSection({ node, ctx }: P) {
  const p = node.props;
  const address = str(p.address) || [ctx.business.address, ctx.business.city, ctx.business.district].filter(Boolean).join(", ");
  const query = str(p.mapQuery) || address || ctx.business.city || "Sri Lanka";

  return (
    <div className="w-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--sec-gap,32px)", alignItems: "center" }}>
      <div>
        <h2 style={{ fontSize: "clamp(22px,2.8vw,32px)", fontWeight: 600 }}>{str(p.title)}</h2>
        {address && (
          <p className="w-muted" style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {address}
          </p>
        )}
      </div>
      {bool(p.showMap, true) && (
        <div style={{ borderRadius: "var(--sec-radius)", overflow: "hidden", aspectRatio: "16/10", background: "var(--w-surface)" }}>
          <iframe
            title="Map"
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
            style={{ width: "100%", height: "100%", border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}

/* ── Business hours ───────────────────────────────────────────────────── */
export function HoursSection({ node, ctx }: P) {
  const items = arr<{ day?: string; hours?: string }>(node.props.items);
  return (
    <div className="w-in">
      <SectionHeading title={str(node.props.title)} align={node.styles.align ?? "left"} />
      <div className={cardClass(ctx)} style={{ padding: "8px 22px" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              padding: "14px 0",
              borderBottom: i === items.length - 1 ? undefined : "1px solid color-mix(in srgb,var(--w-text) 10%,transparent)",
              fontSize: 14.5,
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.day}</span>
            <span className="w-muted">{item.hours}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Social links ─────────────────────────────────────────────────────── */
const SOCIALS = [
  { key: "facebook", label: "Facebook", icon: SOCIAL_ICONS.facebook },
  { key: "instagram", label: "Instagram", icon: SOCIAL_ICONS.instagram },
  { key: "youtube", label: "YouTube", icon: SOCIAL_ICONS.youtube },
  { key: "tiktok", label: "TikTok", icon: SOCIAL_ICONS.tiktok },
] as const;

export function SocialSection({ node, ctx }: P) {
  const p = node.props;
  const social = ctx.business.social ?? {};
  const available = SOCIALS.filter((s) => social[s.key]);
  const iconsOnly = str(p.style, "buttons") === "icons";

  if (!available.length) {
    return (
      <div className="w-in" style={{ textAlign: "center" }}>
        <p className="w-muted" style={{ fontSize: 14 }}>
          Add your social links in Website → Settings to show them here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-in" style={{ textAlign: "center" }}>
      {str(p.title) && <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>{str(p.title)}</h2>}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {available.map((s) => {
          const href = social[s.key]!;
          const content = iconsOnly ? <s.icon size={18} /> : (
            <>
              <s.icon size={16} />
              {s.label}
            </>
          );
          const style: React.CSSProperties = iconsOnly
            ? { width: 42, height: 42, borderRadius: 999, padding: 0 }
            : {};
          return ctx.editor ? (
            <span key={s.key} className="w-btn w-btn--outline" style={style}>
              {content}
            </span>
          ) : (
            <a key={s.key} href={href} target="_blank" rel="noopener noreferrer" className="w-btn w-btn--outline" style={style}>
              {content}
            </a>
          );
        })}
      </div>
    </div>
  );
}

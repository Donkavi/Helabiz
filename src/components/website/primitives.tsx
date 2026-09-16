"use client";

import * as React from "react";
import Link from "next/link";
import type { SiteContext } from "@/lib/website/render-types";
import { resolveHref } from "@/lib/website/render-types";

/** A link that becomes inert inside the builder so clicks do not navigate away. */
export function SiteLink({
  ctx,
  href,
  className,
  children,
  style,
  ariaLabel,
}: {
  ctx: SiteContext;
  href?: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const resolved = resolveHref(ctx, href);
  if (ctx.editor || !resolved) {
    return (
      <span className={className} style={style} role="link" aria-label={ariaLabel}>
        {children}
      </span>
    );
  }
  const external = /^(https?:|mailto:|tel:)/i.test(resolved);
  if (external) {
    return (
      <a href={resolved} className={className} style={style} aria-label={ariaLabel} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={resolved} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function SiteButton({
  ctx,
  href,
  label,
  variant,
  size = "md",
  className,
}: {
  ctx: SiteContext;
  href?: string;
  label?: string;
  variant?: "solid" | "outline" | "soft" | "pill";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!label) return null;
  const style = variant ?? ctx.theme.buttonStyle;
  return (
    <SiteLink
      ctx={ctx}
      href={href}
      className={[
        "w-btn",
        `w-btn--${style}`,
        size !== "md" ? `w-btn--${size}` : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </SiteLink>
  );
}

const PLACEHOLDER_DATA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#e8e6e1"/><path d="M0 430l210-170 150 120 130-100 310 240z" fill="#d3cfc7"/><circle cx="600" cy="150" r="62" fill="#d3cfc7"/></svg>`,
  );

/**
 * Plain <img> rather than next/image: section images are arbitrary user URLs and
 * data URIs that the optimizer cannot be configured for ahead of time. Sizing,
 * lazy-loading and decoding hints are set explicitly instead.
 */
export function SiteImage({
  src,
  alt = "",
  className,
  style,
  priority,
}: {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  const resolved = !src || failed ? PLACEHOLDER_DATA : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: string;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <header
      style={{
        marginBottom: 40,
        textAlign: (align as React.CSSProperties["textAlign"]) ?? "center",
        maxWidth: align === "center" ? 680 : undefined,
        marginInline: align === "center" ? "auto" : undefined,
      }}
    >
      {eyebrow && <p className="w-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</p>}
      {title && <h2 style={{ fontSize: "clamp(24px,3.2vw,36px)", fontWeight: 600 }}>{title}</h2>}
      {subtitle && (
        <p className="w-muted" style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}

export function cardClass(ctx: SiteContext) {
  return `w-card w-card--${ctx.theme.cardStyle}`;
}

/** Splits a textarea value into paragraphs on blank lines. */
export function paragraphs(text?: string) {
  return (text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function lines(text?: string) {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function embedUrl(url?: string) {
  if (!url) return null;
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i.exec(url);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(\d+)/i.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

"use client";

import * as React from "react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { Prose } from "./marketing";
import { SiteButton, SiteImage, SiteLink, embedUrl } from "../primitives";

type P = { node: SectionNode; ctx: SiteContext; children?: React.ReactNode };
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);

export function HeadingSection({ node }: P) {
  const p = node.props;
  const level = str(p.level, "h2");
  const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as "h1" | "h2" | "h3";
  const size = level === "h1" ? "clamp(30px,4.4vw,50px)" : level === "h3" ? "clamp(18px,2vw,22px)" : "clamp(24px,3.2vw,36px)";
  return (
    <div className="w-in">
      {str(p.eyebrow) && <p className="w-eyebrow" style={{ marginBottom: 12 }}>{str(p.eyebrow)}</p>}
      <Tag style={{ fontSize: size, fontWeight: 600 }}>{str(p.text)}</Tag>
      {str(p.subtext) && (
        <p className="w-muted" style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65, maxWidth: 680, marginInline: node.styles.align === "center" ? "auto" : undefined }}>
          {str(p.subtext)}
        </p>
      )}
    </div>
  );
}

export function ParagraphSection({ node }: P) {
  return (
    <div className="w-in">
      <Prose text={str(node.props.text)} />
    </div>
  );
}

export function RichTextSection({ node }: P) {
  return (
    <div className="w-in">
      {str(node.props.heading) && (
        <h2 style={{ fontSize: "clamp(22px,2.8vw,32px)", fontWeight: 600, marginBottom: 18 }}>
          {str(node.props.heading)}
        </h2>
      )}
      <Prose text={str(node.props.body)} />
    </div>
  );
}

export function ImageSection({ node, ctx }: P) {
  const p = node.props;
  const ratio = str(p.ratio, "16/9");
  const media = (
    <div
      style={{
        borderRadius: "var(--sec-radius)",
        overflow: "hidden",
        aspectRatio: ratio === "auto" ? undefined : ratio,
        background: "var(--w-surface)",
      }}
    >
      <SiteImage
        src={str(p.src)}
        alt={str(p.alt)}
        className="w-img"
        style={{ objectFit: str(p.fit, "cover") as React.CSSProperties["objectFit"], height: ratio === "auto" ? "auto" : "100%" }}
      />
    </div>
  );
  return (
    <div className="w-in">
      {str(p.link) ? <SiteLink ctx={ctx} href={str(p.link)}>{media}</SiteLink> : media}
      {str(p.caption) && (
        <p className="w-muted" style={{ marginTop: 12, fontSize: 13.5, textAlign: "center" }}>
          {str(p.caption)}
        </p>
      )}
    </div>
  );
}

export function VideoSection({ node }: P) {
  const src = embedUrl(str(node.props.url));
  return (
    <div className="w-in">
      <div style={{ borderRadius: "var(--sec-radius)", overflow: "hidden", aspectRatio: "16/9", background: "var(--w-surface)" }}>
        {src ? (
          <iframe
            src={src}
            title={str(node.props.caption) || "Video"}
            style={{ width: "100%", height: "100%", border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--w-muted)", fontSize: 14 }}>
            Add a YouTube or Vimeo link in the settings panel
          </div>
        )}
      </div>
      {str(node.props.caption) && (
        <p className="w-muted" style={{ marginTop: 12, fontSize: 13.5, textAlign: "center" }}>
          {str(node.props.caption)}
        </p>
      )}
    </div>
  );
}

export function ButtonSection({ node, ctx }: P) {
  const p = node.props;
  const align = node.styles.align ?? "center";
  return (
    <div className="w-in" style={{ display: "flex", justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}>
      <SiteButton
        ctx={ctx}
        href={str(p.url)}
        label={str(p.text)}
        variant={str(p.variant, "solid") as "solid" | "outline" | "soft"}
        size={str(p.size, "md") as "sm" | "md" | "lg"}
      />
    </div>
  );
}

export function DividerSection({ node }: P) {
  const p = node.props;
  return (
    <div className="w-in" style={{ display: "flex", justifyContent: "center" }}>
      <hr
        style={{
          width: `${num(p.width, 100)}%`,
          border: 0,
          borderTop: `1px ${str(p.style, "solid")} color-mix(in srgb,var(--w-text) 18%,transparent)`,
          margin: 0,
        }}
      />
    </div>
  );
}

export function SpacerSection({ node }: P) {
  return <div style={{ height: num(node.props.height, 64) }} aria-hidden />;
}

/* ── Containers ───────────────────────────────────────────────────────── */

export function LayoutSection({ children }: P) {
  return <div className="w-in">{children}</div>;
}

export function ColumnsSection({ node, children }: P) {
  const columns = num(node.props.columns, 2);
  const kids = React.Children.toArray(children);
  return (
    <div className="w-in">
      <div className="w-grid" style={{ "--sec-cols": columns } as React.CSSProperties}>
        {kids.length ? kids : null}
      </div>
    </div>
  );
}

export function GridSection({ node, children }: P) {
  return (
    <div className="w-in">
      <div className="w-grid" style={{ "--sec-cols": num(node.props.columns, 3) } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}

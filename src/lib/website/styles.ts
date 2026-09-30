import type { SectionNode, StyleProps, ThemeTokens, Viewport } from "@/types";
import { fontStack } from "./themes";

export const VIEWPORT_WIDTH: Record<Viewport, number> = { desktop: 1440, tablet: 834, mobile: 390 };
export const TABLET_BREAKPOINT = 1024;
export const MOBILE_BREAKPOINT = 640;
/** Where the desktop navigation gives way to the burger. */
export const NAV_BREAKPOINT = 820;

const MAX_WIDTHS = { sm: 640, md: 880, lg: 0, xl: 1320, full: 0 } as const;

export function mergeStyles(node: SectionNode, viewport: Viewport): StyleProps {
  const base = node.styles ?? {};
  if (viewport === "desktop") return base;
  const tablet = { ...base, ...(node.responsiveStyles?.tablet ?? {}) };
  if (viewport === "tablet") return tablet;
  return { ...tablet, ...(node.responsiveStyles?.mobile ?? {}) };
}

function px(value?: number) {
  return typeof value === "number" ? `${value}px` : undefined;
}

const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 6px 20px -8px rgba(0,0,0,0.18)",
  lg: "0 24px 60px -24px rgba(0,0,0,0.3)",
};

/** Turns a StyleProps bag into CSS declarations for a section wrapper. */
function declarations(style: StyleProps, theme: ThemeTokens): string {
  const out: string[] = [];
  const push = (prop: string, value?: string) => {
    if (value !== undefined && value !== "") out.push(`${prop}:${value}`);
  };

  if (style.hidden) push("display", "none");

  push("padding-block", px(style.paddingY));
  push("padding-inline", px(style.paddingX));
  push("margin-top", px(style.marginTop));
  push("margin-bottom", px(style.marginBottom));
  push("min-height", px(style.minHeight));
  push("color", style.color);
  push("text-align", style.align);
  push("font-size", px(style.fontSize));
  push("font-weight", style.fontWeight ? String(style.fontWeight) : undefined);
  push("line-height", style.lineHeight ? String(style.lineHeight) : undefined);
  push("letter-spacing", style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined);
  if (style.fontFamily) push("font-family", fontStack(style.fontFamily));

  if (style.background && style.background !== "transparent") push("background-color", style.background);
  if (style.borderWidth) {
    push("border-width", px(style.borderWidth));
    push("border-style", "solid");
    push("border-color", style.borderColor || "currentColor");
  }
  if (style.shadow && style.shadow !== "none") push("box-shadow", SHADOWS[style.shadow] ?? SHADOWS.md);

  // Custom properties consumed by the section internals.
  const maxKey = style.maxWidth ?? "lg";
  const max = maxKey === "full" ? "100%" : `${MAX_WIDTHS[maxKey] || theme.containerWidth}px`;
  push("--sec-max", max);
  push("--sec-radius", px(style.radius ?? theme.radius));
  push("--sec-gap", px(style.gap));
  push("--sec-cols", style.columns ? String(style.columns) : undefined);
  push("--sec-overlay", style.backgroundOverlay !== undefined ? String(style.backgroundOverlay / 100) : undefined);

  return out.join(";");
}

function rule(selector: string, body: string) {
  return body ? `${selector}{${body}}` : "";
}

/**
 * Compiles a page's section tree into a stylesheet.
 *
 * On the public site this emits real media queries so one HTML document is
 * responsive. In the editor we are simulating a device inside a fixed-width
 * frame, where viewport media queries would not fire — so we flatten the
 * selected viewport's merged styles into the base rule instead.
 */
export function buildSectionCss(
  nodes: SectionNode[],
  options: { theme: ThemeTokens; mode: "public" | "editor"; viewport?: Viewport },
): string {
  const { theme, mode, viewport = "desktop" } = options;
  const flat: SectionNode[] = [];
  const walk = (list: SectionNode[]) => {
    for (const node of list) {
      flat.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);

  if (mode === "editor") {
    return flat
      .map((node) => rule(`[data-sid="${node.id}"]`, declarations(mergeStyles(node, viewport), theme)))
      .join("\n");
  }

  const base: string[] = [];
  const tablet: string[] = [];
  const mobile: string[] = [];

  for (const node of flat) {
    base.push(rule(`[data-sid="${node.id}"]`, declarations(node.styles ?? {}, theme)));
    const t = node.responsiveStyles?.tablet;
    if (t && Object.keys(t).length) tablet.push(rule(`[data-sid="${node.id}"]`, declarations(t, theme)));
    const m = node.responsiveStyles?.mobile;
    if (m && Object.keys(m).length) mobile.push(rule(`[data-sid="${node.id}"]`, declarations(m, theme)));
  }

  return [
    base.join("\n"),
    tablet.filter(Boolean).length ? `@media (max-width:${TABLET_BREAKPOINT}px){${tablet.join("")}}` : "",
    mobile.filter(Boolean).length ? `@media (max-width:${MOBILE_BREAKPOINT}px){${mobile.join("")}}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Picks black or white text for a background colour, so buttons stay readable. */
export function readableOn(hex: string): string {
  const m = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(hex?.trim() ?? "");
  if (!m) return "#ffffff";
  let value = m[1];
  if (value.length === 3) value = value.split("").map((c) => c + c).join("");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.55 ? "#111111" : "#ffffff";
}

/** The theme's design tokens, exposed as CSS variables on the site wrapper. */
export function themeCssVars(theme: ThemeTokens): React.CSSProperties {
  return {
    "--w-primary": theme.primary,
    "--w-btn-on-primary": readableOn(theme.primary),
    "--w-secondary": theme.secondary,
    "--w-bg": theme.background,
    "--w-surface": theme.surface,
    "--w-text": theme.text,
    "--w-muted": theme.muted,
    "--w-radius": `${theme.radius}px`,
    "--w-space": `${theme.sectionSpacing}px`,
    "--w-container": `${theme.containerWidth}px`,
    "--w-heading-font": fontStack(theme.headingFont),
    "--w-body-font": fontStack(theme.bodyFont),
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: fontStack(theme.bodyFont),
  } as React.CSSProperties;
}

export function buttonClassFor(theme: ThemeTokens) {
  return theme.buttonStyle;
}

/** Shared base stylesheet for every rendered website (editor and public). */
/**
 * The responsive rules, kept as plain declarations rather than only inside
 * media queries.
 *
 * The editor simulates a device inside a fixed-width frame, so a viewport
 * media query measures the builder window and never fires — a phone preview
 * would keep the desktop grid. Holding the declarations here lets the public
 * site wrap them in media queries and the editor replay them unconditionally,
 * from one definition, so the preview cannot drift from the real thing.
 */
const TABLET_RULES = `.w-grid{grid-template-columns:repeat(min(var(--sec-cols,3),2),minmax(0,1fr));}`;
const MOBILE_RULES = `.w-grid{grid-template-columns:minmax(0,1fr);}.w-in{padding-inline:18px;}`;

export const WEBSITE_BASE_CSS = `
.w-root{color:var(--w-text);background:var(--w-bg);font-family:var(--w-body-font);}
.w-root h1,.w-root h2,.w-root h3,.w-root h4{font-family:var(--w-heading-font);letter-spacing:-0.02em;line-height:1.12;margin:0;}
.w-root p{margin:0;}
.w-sec{position:relative;width:100%;}
.w-in{width:100%;max-width:var(--sec-max,var(--w-container));margin-inline:auto;padding-inline:20px;position:relative;z-index:1;}
.w-eyebrow{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--w-primary);}
.w-muted{color:var(--w-muted);}
.w-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:14px;line-height:1;padding:13px 22px;border-radius:var(--w-radius);border:1px solid transparent;cursor:pointer;transition:transform .15s ease,opacity .15s ease,background-color .15s ease,color .15s ease;text-decoration:none;}
.w-btn:hover{opacity:.92;transform:translateY(-1px);}
.w-btn:active{transform:translateY(0);}
.w-btn--solid{background:var(--w-primary);color:var(--w-btn-on-primary,#fff);}
.w-btn--outline{background:transparent;color:var(--w-text);border-color:currentColor;}
.w-btn--soft{background:color-mix(in srgb,var(--w-primary) 14%,transparent);color:var(--w-primary);}
.w-btn--pill{background:var(--w-primary);color:var(--w-btn-on-primary,#fff);border-radius:999px;}
.w-btn--sm{padding:9px 16px;font-size:13px;}
.w-btn--lg{padding:16px 30px;font-size:15px;}
.w-card{background:var(--w-surface);border-radius:var(--sec-radius,var(--w-radius));overflow:hidden;}
.w-card--bordered{background:var(--w-bg);border:1px solid color-mix(in srgb,var(--w-text) 12%,transparent);}
.w-card--shadow{background:var(--w-bg);box-shadow:0 10px 30px -18px rgba(0,0,0,.45);}
.w-card--elevated{background:var(--w-bg);box-shadow:0 22px 48px -28px rgba(0,0,0,.5);}
.w-card--flat{background:var(--w-surface);}
.w-grid{display:grid;gap:var(--sec-gap,20px);grid-template-columns:repeat(var(--sec-cols,3),minmax(0,1fr));}
.w-overlay{position:absolute;inset:0;background:#000;opacity:var(--sec-overlay,0);z-index:0;}
.w-img{display:block;width:100%;height:100%;object-fit:cover;}
.w-sec a{color:inherit;}
@media (max-width:${TABLET_BREAKPOINT}px){${TABLET_RULES}}
@media (max-width:${MOBILE_BREAKPOINT}px){${MOBILE_RULES}}
[data-anim="fade-up"]{animation:w-fade-up .6s cubic-bezier(.22,1,.36,1) both;}
[data-anim="fade"]{animation:w-fade .6s ease both;}
[data-anim="zoom"]{animation:w-zoom .5s cubic-bezier(.22,1,.36,1) both;}
@keyframes w-fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes w-fade{from{opacity:0}to{opacity:1}}
@keyframes w-zoom{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){[data-anim]{animation:none!important}}
`;

/** The nav rules that swap the desktop menu for the burger. */
export const NAV_RULES = `.w-nav-desktop{display:none}.w-burger{display:inline-flex!important}.w-hero-split{gap:28px!important}`;

/**
 * What a real browser would apply at the width the editor is simulating.
 *
 * Media queries measure the builder window, not the device frame, so a phone
 * preview would otherwise show the desktop layout squeezed into 390px — four
 * columns where a phone gets one. This replays the very same declarations the
 * media queries hold, unconditionally, narrowest last so the cascade matches
 * a browser resizing for real.
 *
 * Returns nothing for desktop, where the frame and the breakpoints agree.
 */
export function viewportOverrideCss(viewport: Viewport): string {
  const width = VIEWPORT_WIDTH[viewport];
  const out: string[] = [];
  if (width <= TABLET_BREAKPOINT) out.push(TABLET_RULES);
  if (width <= NAV_BREAKPOINT) out.push(NAV_RULES);
  if (width <= MOBILE_BREAKPOINT) out.push(MOBILE_RULES);
  return out.join("\n");
}

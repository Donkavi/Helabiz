"use client";

import * as React from "react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { WEBSITE_BASE_CSS, buildSectionCss, themeCssVars } from "@/lib/website/styles";
import { SectionList, SectionRenderer } from "./section-renderer";

const RESPONSIVE_CSS = `
.w-nav-desktop{display:block}
.w-prod{display:flex;flex-direction:column;text-decoration:none}
.w-prod-img{transition:transform .5s cubic-bezier(.22,1,.36,1)}
.w-prod:hover .w-prod-img{transform:scale(1.045)}
.w-gal-zoom:hover img{transform:scale(1.07)}
.w-gal-lift:hover{transform:translateY(-4px);box-shadow:0 18px 40px -22px rgba(0,0,0,.5)}
.w-gal-fade:hover img{opacity:.78}
.w-nav-link:hover{color:var(--w-primary)}
.w-btn-full{width:100%}
.w-scroll-row{scrollbar-width:thin}
.w-scroll-row::-webkit-scrollbar{height:6px}
.w-scroll-row::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--w-text) 20%,transparent);border-radius:999px}
@media (max-width:820px){
  .w-nav-desktop{display:none}
  .w-burger{display:inline-flex!important}
  .w-hero-split{gap:28px!important}
}
`;

/** Emits the compiled stylesheet for a page's sections. */
export function WebsiteStyles({
  nodes,
  ctx,
  mode,
}: {
  nodes: SectionNode[];
  ctx: SiteContext;
  mode: "public" | "editor";
}) {
  const css = React.useMemo(
    () => buildSectionCss(nodes, { theme: ctx.theme, mode, viewport: ctx.viewport }),
    [nodes, ctx.theme, ctx.viewport, mode],
  );
  return <style dangerouslySetInnerHTML={{ __html: `${WEBSITE_BASE_CSS}\n${RESPONSIVE_CSS}\n${css}` }} />;
}

/**
 * Renders a complete page: header, the page's sections, then footer.
 * `header` and `footer` are stored on the website (not the page) so they stay
 * consistent across every page of the site.
 */
export function WebsiteRenderer({
  sections,
  header,
  footer,
  ctx,
  mode = "public",
  children,
}: {
  sections: SectionNode[];
  header?: SectionNode | null;
  footer?: SectionNode | null;
  ctx: SiteContext;
  mode?: "public" | "editor";
  /** Replaces the page body — used by shop, product, cart and checkout routes. */
  children?: React.ReactNode;
}) {
  const all = React.useMemo(
    () => [header, ...sections, footer].filter(Boolean) as SectionNode[],
    [header, sections, footer],
  );

  return (
    <div className="w-root" style={themeCssVars(ctx.theme)}>
      <WebsiteStyles nodes={all} ctx={ctx} mode={mode} />
      {header && (
        <header
          style={{
            position: header.props?.sticky && mode === "public" ? "sticky" : "relative",
            top: 0,
            zIndex: 40,
            background: ctx.theme.background,
            borderBottom: "1px solid color-mix(in srgb,var(--w-text) 10%,transparent)",
          }}
        >
          <SectionRenderer node={header} ctx={ctx} />
        </header>
      )}

      <main>{children ?? <SectionList nodes={sections} ctx={ctx} />}</main>

      {footer && (
        <footer style={{ background: ctx.theme.surface }}>
          <SectionRenderer node={footer} ctx={ctx} />
        </footer>
      )}
    </div>
  );
}

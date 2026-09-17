"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Monitor, Smartphone, Tablet } from "lucide-react";
import type { SectionNode, Viewport } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { VIEWPORT_WIDTH } from "@/lib/website/styles";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/misc";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

export type PreviewPage = { title: string; slug: string; isHome: boolean; sections: SectionNode[] };

const DEVICES: { value: Viewport; label: string; icon: typeof Monitor }[] = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

/**
 * A live template preview: the real section renderer, the template's own theme,
 * and stand-in products — so what a visitor sees here is what the template
 * actually produces, not a mock-up.
 */
export function TemplatePreview({
  templateId,
  name,
  category,
  description,
  pages,
  header,
  footer,
  ctx,
}: {
  templateId: string;
  name: string;
  category: string;
  description: string;
  pages: PreviewPage[];
  header: SectionNode | null;
  footer: SectionNode | null;
  ctx: SiteContext;
}) {
  const [slug, setSlug] = React.useState(pages.find((p) => p.isHome)?.slug ?? pages[0]?.slug ?? "");
  const [viewport, setViewport] = React.useState<Viewport>("desktop");

  const page = pages.find((p) => p.slug === slug) ?? pages[0];
  const renderCtx = React.useMemo<SiteContext>(() => ({ ...ctx, viewport }), [ctx, viewport]);

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-15 max-w-[1600px] items-center gap-3 px-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/templates" aria-label="Back to all templates">
              <ArrowLeft />
            </Link>
          </Button>

          <Link href="/" className="hidden sm:block" aria-label="Helabiz home">
            <LogoMark />
          </Link>

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[14px] font-semibold leading-tight">
              <span className="truncate">{name}</span>
              <Badge variant="soft" className="hidden shrink-0 sm:inline-flex">
                {category}
              </Badge>
            </p>
            <p className="hidden truncate text-[12px] text-muted-foreground md:block">{description}</p>
          </div>

          {/* Pages in this template */}
          <nav className="ml-auto hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 lg:flex" aria-label="Template pages">
            {pages.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSlug(item.slug)}
                aria-pressed={item.slug === slug}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-all",
                  item.slug === slug
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.title}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5 lg:ml-2">
            {DEVICES.map((device) => (
              <Tooltip key={device.value} content={device.label}>
                <button
                  type="button"
                  onClick={() => setViewport(device.value)}
                  aria-pressed={viewport === device.value}
                  aria-label={device.label}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md transition-all",
                    viewport === device.value
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <device.icon className="size-3.5" />
                </button>
              </Tooltip>
            ))}
          </div>

          <Button size="sm" asChild>
            <Link href={`/sign-up?template=${templateId}`}>
              <span className="hidden sm:inline">Use this template</span>
              <span className="sm:hidden">Use</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* Pages, on narrow screens */}
        <div className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 no-scrollbar lg:hidden">
          {pages.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setSlug(item.slug)}
              aria-pressed={item.slug === slug}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all",
                item.slug === slug ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 justify-center p-4 sm:p-6">
        <div
          className={cn(
            "w-full origin-top overflow-hidden bg-background transition-[max-width] duration-300 ease-out",
            viewport === "desktop" ? "rounded-xl border border-border" : "rounded-2xl border-8 border-foreground/85 shadow-2xl",
          )}
          style={{ maxWidth: viewport === "desktop" ? "100%" : VIEWPORT_WIDTH[viewport] }}
        >
          {page && (
            <WebsiteRenderer
              key={`${page.slug}-${viewport}`}
              sections={page.sections}
              header={header}
              footer={footer}
              ctx={renderCtx}
              mode="editor"
            />
          )}
        </div>
      </div>

      {/* z-40 matches the header: without it, any positioned section inside the
          rendered template paints straight over this bar. */}
      <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">
            Sample products and pictures. Your own catalogue appears here once you add products.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/templates">All templates</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/sign-up?template=${templateId}`}>
                Use this template
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES } from "@/lib/website/templates";

export const metadata: Metadata = {
  title: "Website templates",
  description:
    "Eight designed website templates for Sri Lankan businesses — fashion, bakery, restaurant, beauty, electronics, photography and services.",
};

export default function TemplatesPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center lg:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">Templates</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[38px] font-semibold tracking-[-0.035em] sm:text-5xl">
            Start from a design, not a blank page
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-muted-foreground text-pretty">
            Every template arrives with its pages, sections, fonts and colours already set. Swap in your products and
            your words — change anything you like.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <article key={template.id} id={template.id} className="group scroll-mt-24">
              <div
                className="relative aspect-16/11 overflow-hidden rounded-2xl border border-border"
                style={{ background: template.theme.background }}
              >
                {/* A miniature of the template's own theme tokens. */}
                <div
                  className="absolute inset-x-0 top-0 flex h-9 items-center justify-between px-5"
                  style={{ borderBottom: `1px solid ${template.theme.text}14` }}
                >
                  <span
                    className="text-[11px] font-bold tracking-tight"
                    style={{ color: template.theme.text, fontFamily: template.theme.headingFont }}
                  >
                    {template.name.toUpperCase()}
                  </span>
                  <span className="flex gap-2.5">
                    {["Shop", "About", "Contact"].map((l) => (
                      <span key={l} className="text-[9px]" style={{ color: template.theme.muted }}>
                        {l}
                      </span>
                    ))}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 top-9 grid grid-cols-2 gap-5 p-6">
                  <div className="flex flex-col justify-center gap-2.5">
                    <span className="h-2 w-10 rounded-full" style={{ background: template.theme.primary }} />
                    <span className="h-3.5 w-4/5 rounded-full" style={{ background: template.theme.text, opacity: 0.85 }} />
                    <span className="h-3.5 w-3/5 rounded-full" style={{ background: template.theme.text, opacity: 0.85 }} />
                    <span className="mt-1 h-1.5 w-full rounded-full" style={{ background: template.theme.muted, opacity: 0.45 }} />
                    <span className="h-1.5 w-4/5 rounded-full" style={{ background: template.theme.muted, opacity: 0.45 }} />
                    <span
                      className="mt-2.5 h-7 w-24"
                      style={{
                        background: template.theme.primary,
                        borderRadius: template.theme.buttonStyle === "pill" ? 999 : template.theme.radius,
                      }}
                    />
                  </div>
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(140deg, ${template.theme.secondary}, ${template.theme.surface})`,
                      borderRadius: template.theme.radius,
                    }}
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 gap-2.5 p-4 pt-0">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="aspect-square"
                      style={{ background: template.theme.surface, borderRadius: template.theme.radius }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold">{template.name}</h2>
                  <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <Badge variant="soft">{template.category}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted-foreground">
                {template.pages.map((page) => (
                  <span key={page.slug} className="flex items-center gap-1.5">
                    <Check className="size-3 text-primary" />
                    {page.title}
                  </span>
                ))}
              </div>

              <Button variant="outline" size="sm" className="mt-5" asChild>
                <Link href={`/sign-up?template=${template.id}`}>
                  Use this template
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:px-8">
          <h2 className="text-[28px] font-semibold tracking-[-0.025em]">Or start from a blank page</h2>
          <p className="mt-4 text-[15.5px] text-muted-foreground text-pretty">
            Templates are a starting point, never a cage. Every section can be moved, edited, restyled or removed — and
            you can add any of the 40+ sections to any page.
          </p>
          <Button size="xl" className="mt-8" asChild>
            <Link href="/sign-up">Start building</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES } from "@/lib/website/templates";
import { artFor } from "@/lib/website/template-art";
import { getLang } from "@/lib/i18n/server";
import { marketingCopy } from "@/lib/i18n/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const t = marketingCopy(await getLang()).templatesPage;
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function TemplatesPage() {
  const t = marketingCopy(await getLang()).templatesPage;

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center lg:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">{t.eyebrow}</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[38px] font-semibold tracking-[-0.035em] sm:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-muted-foreground text-pretty">
            {t.lede}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                {t.startFree}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">{t.seePricing}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
          {TEMPLATES.map((template) => {
            const art = artFor(template.category);
            const premium = template.tier === "premium";
            return (
            <article key={template.id} id={template.id} className="group scroll-mt-24">
              <Link
                href={`/templates/${template.id}`}
                aria-label={`${t.viewTemplate} — ${template.name}`}
                className="group/tile relative block aspect-16/11 overflow-hidden rounded-2xl border border-border transition-all duration-200 hover:border-primary/40 hover:shadow-md"
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

                <div className="absolute inset-x-0 top-9 bottom-[32%] grid grid-cols-2 gap-5 px-6 pt-5">
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
                    className="h-full w-full overflow-hidden"
                    style={{
                      background: `linear-gradient(140deg, ${template.theme.secondary}, ${template.theme.surface})`,
                      borderRadius: template.theme.radius,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art[0]} alt="" className="size-full object-cover" />
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 gap-2.5 px-6 pb-5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="aspect-square overflow-hidden"
                      style={{ background: template.theme.surface, borderRadius: template.theme.radius }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={art[(i + 1) % art.length]} alt="" className="size-full object-cover" />
                    </span>
                  ))}
                </div>

                <span className="absolute inset-0 flex items-center justify-center bg-foreground/35 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/tile:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-background px-4 py-2.5 text-[13.5px] font-semibold shadow-lg">
                    <Eye className="size-4 text-primary" />
                    {t.viewTemplate}
                  </span>
                </span>
              </Link>

              <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold">{template.name}</h2>
                  <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <Badge variant="soft">{template.category}</Badge>
                  {premium ? (
                    <Badge variant="muted">
                      <Lock className="size-3" />
                      Starter
                    </Badge>
                  ) : (
                    <Badge variant="success">{t.free}</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted-foreground">
                {template.pages.map((page) => (
                  <span key={page.slug} className="flex items-center gap-1.5">
                    <Check className="size-3 text-primary" />
                    {page.title}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`/templates/${template.id}`}>
                    <Eye className="size-3.5" />
                    {t.viewTemplate}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={premium ? "/pricing" : `/sign-up?template=${template.id}`}>
                    {premium ? t.unlock : t.useTemplate}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:px-8">
          <h2 className="text-[28px] font-semibold tracking-[-0.025em]">{t.blankTitle}</h2>
          <p className="mt-4 text-[15.5px] text-muted-foreground text-pretty">
            {t.blankBody}
          </p>
          <Button size="xl" className="mt-8" asChild>
            <Link href="/sign-up">{t.blankCta}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

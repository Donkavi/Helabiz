import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES } from "@/lib/website/templates";
import { TemplatePreview } from "@/components/marketing/template-preview";
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
                <TemplatePreview template={template} />

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

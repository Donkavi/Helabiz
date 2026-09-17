import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CreditCard,
  FileText,
  Globe,
  Layers,
  MessageCircle,
  MousePointerClick,
  Package,
  Palette,
  Receipt,
  Rocket,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuilderMockup } from "@/components/marketing/builder-mockup";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/misc";
import { TEMPLATES } from "@/lib/website/templates";
import { getLang } from "@/lib/i18n/server";
import { marketingCopy } from "@/lib/i18n/marketing";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = marketingCopy(await getLang()).home;
  // Absolute: the root layout appends "· Helabiz", and the title already ends in it.
  return { title: { absolute: t.metaTitle }, description: t.metaDescription };
}

/* Icons stay here, beside the layout. Only the words are translated. */
const PROBLEM_ICONS = [MessageCircle, Receipt, Globe];
const BUILDER_ICONS = [MousePointerClick, Palette, Smartphone, Package];
const BUSINESS_ICONS = [ShoppingBag, Boxes, Users, Wallet, FileText, BarChart3];
const STRIP_ICONS = [TrendingUp, Layers, CreditCard];

export default async function LandingPage() {
  const lang = await getLang();
  const c = marketingCopy(lang);
  const t = c.home;

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.55] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-border/80 bg-card px-3 py-1 text-[12px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              {t.badge}
            </Badge>

            <h1 className="text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-6xl">
              {t.headline[0]}
              <br />
              {t.headline[1]}
              <br />
              <span className="text-primary">{t.headline[2]}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed text-muted-foreground text-pretty">
{t.lede}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="xl" asChild className="w-full sm:w-auto">
                <Link href="/sign-up">
                  {t.startFree}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/templates">
                  <Sparkles className="size-4" />
                  {t.createWebsite}
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-[13px] text-muted-foreground">
              {t.reassurance}
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="absolute -inset-x-6 -top-6 bottom-10 rounded-[2rem] bg-gradient-to-b from-primary/8 to-transparent blur-2xl" aria-hidden />
            <BuilderMockup className="relative animate-fade-up" />
          </div>
        </div>
      </section>

      {/* ── Problem ────────────────────────────────────────────────────── */}
      <Section>
        <SectionIntro eyebrow={t.problem.eyebrow} title={t.problem.title} body={t.problem.body} />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.problem.items.map((item, i) => {
            const Icon = PROBLEM_ICONS[i];
            return (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/8 text-destructive">
                <Icon className="size-4.5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
            );
          })}
        </div>
      </Section>

      {/* ── Solution ───────────────────────────────────────────────────── */}
      <Section className="border-y border-border bg-card/40">
        <SectionIntro eyebrow={t.solution.eyebrow} title={t.solution.title} body={t.solution.body} />
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <HalfCard icon={Globe} {...t.solution.front} learnMore={t.solution.learnMore} href="#website-builder" />
          <HalfCard icon={Store} {...t.solution.back} learnMore={t.solution.learnMore} href="#business" tone="gold" />
        </div>
      </Section>

      {/* ── Website builder ────────────────────────────────────────────── */}
      <Section id="website-builder">
        <SectionIntro
          eyebrow={t.builder.eyebrow}
          title={t.builder.title}
          body={t.builder.body}
        />

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 lg:order-1">
            <ol className="space-y-1">
              {t.builder.steps.map((step, i) => (
                <li key={step.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl border text-[13px] font-semibold",
                        i === 3
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    {i < 3 && <span className="my-1 h-7 w-px bg-border" />}
                  </div>
                  <div className={cn(i < 3 && "pb-6")}>
                    <p className="text-[15px] font-semibold">{step.label}</p>
                    <p className="mt-0.5 text-[13.5px] text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="order-1 grid grid-cols-2 gap-3 lg:order-2">
            {t.builder.features.map((f, i) => {
              const Icon = BUILDER_ICONS[i];
              return (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5">
                <Icon className="size-4.5 text-primary" />
                <h3 className="mt-3 text-[14px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
              );
            })}
          </div>
        </div>

        {/* Section showcase */}
        <div className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.builder.sectionsIncluded}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.builder.sections.map((label) => (
              <span
                key={label}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-muted hover:text-primary"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Business management ────────────────────────────────────────── */}
      <Section id="business" className="border-y border-border bg-card/40">
        <SectionIntro
          eyebrow={t.business.eyebrow}
          title={t.business.title}
          body={t.business.body}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.business.features.map((f, i) => {
            const Icon = BUSINESS_ICONS[i];
            return (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted text-primary transition-transform duration-200 group-hover:scale-105">
                <Icon className="size-4.5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3 sm:p-8">
          {t.business.strip.map((item, i) => {
            const Icon = STRIP_ICONS[i];
            return (
            <div key={item.title} className="flex gap-3">
              <Icon className="mt-0.5 size-4.5 shrink-0 text-primary" />
              <div>
                <p className="text-[14px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{item.body}</p>
              </div>
            </div>
            );
          })}
        </div>
      </Section>

      {/* ── Templates ──────────────────────────────────────────────────── */}
      <Section id="templates">
        <SectionIntro
          eyebrow={t.templates.eyebrow}
          title={t.templates.title}
          body={t.templates.body}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.slice(0, 8).map((template) => (
            <Link
              key={template.id}
              href={`/templates#${template.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div
                className="relative aspect-4/3 overflow-hidden"
                style={{ background: `linear-gradient(140deg, ${template.theme.primary}, ${template.theme.secondary})` }}
              >
                <div className="absolute inset-0 flex flex-col justify-end gap-1.5 p-4">
                  <span className="h-1.5 w-16 rounded-full bg-white/85" />
                  <span className="h-1.5 w-24 rounded-full bg-white/60" />
                  <div className="mt-1.5 flex gap-1.5">
                    <span className="h-4 w-12 rounded-[4px] bg-white/85" />
                    <span className="h-4 w-12 rounded-[4px] border border-white/60" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[14px] font-semibold group-hover:text-primary">{template.name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{template.category}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/templates">
              {t.templates.browseAll}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <Section className="border-y border-border bg-card/40">
        <SectionIntro eyebrow={t.steps.eyebrow} title={t.steps.title} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.items.map((step) => (
            <div key={step.n} className="relative">
              <span className="text-[13px] font-mono font-semibold text-primary">{step.n}</span>
              <h3 className="mt-2 text-[15px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <Section id="pricing">
        <SectionIntro
          eyebrow={t.pricing.eyebrow}
          title={t.pricing.title}
          body={t.pricing.body}
        />
        <div className="mt-12">
          <PricingTable lang={lang} />
        </div>
      </Section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <Section className="border-y border-border bg-card/40">
        <SectionIntro eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {t.testimonials.items.map((item) => (
            <figure key={item.name} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <blockquote className="flex-1 text-[14.5px] leading-relaxed text-foreground">“{item.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary-muted text-[12px] font-semibold text-primary">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">{item.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">{t.faq.eyebrow}</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] sm:text-[34px]">
              {t.faq.title}
            </h2>
            <p className="mt-3 text-[15px] text-muted-foreground">
              {t.faq.body}
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {t.faq.items.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
            <div className="relative">
              <Rocket className="mx-auto size-7 text-primary" />
              <h2 className="mt-5 text-[30px] font-semibold tracking-[-0.03em] sm:text-[38px]">
                {t.finalCta.title}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15.5px] text-muted-foreground text-pretty">
                {t.finalCta.body}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="xl" asChild className="w-full sm:w-auto">
                  <Link href="/sign-up">
                    {t.finalCta.startFree}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/pricing">{t.finalCta.seePricing}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Local layout helpers ─────────────────────────────────────────────── */

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">{children}</div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.028em] sm:text-[36px]">{title}</h2>
      {body && <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground text-pretty">{body}</p>}
    </div>
  );
}

function HalfCard({
  icon: Icon,
  kicker,
  title,
  body,
  points,
  href,
  learnMore,
  tone = "primary",
}: {
  icon: typeof Globe;
  kicker: string;
  title: string;
  body: string;
  points: string[];
  href: string;
  learnMore: string;
  tone?: "primary" | "gold";
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-xl",
          tone === "gold" ? "bg-gold/12 text-gold" : "bg-primary-muted text-primary",
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{kicker}</p>
      <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-[13.5px] text-foreground">
            <Check className={cn("size-3.5 shrink-0", tone === "gold" ? "text-gold" : "text-primary")} />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary hover:underline"
      >
        {learnMore} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

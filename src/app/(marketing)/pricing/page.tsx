import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/misc";
import { PLAN_LIST, UNLIMITED, type Plan } from "@/lib/plans";
import { getLang } from "@/lib/i18n/server";
import { marketingCopy } from "@/lib/i18n/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const t = marketingCopy(await getLang()).pricing;
  return { title: t.metaTitle, description: t.metaDescription };
}

/** Which rows in the comparison table are yes/no rather than a number. */
const BOOLEAN_ROWS = new Set<keyof Plan["limits"]>([
  "analytics",
  "invoices",
  "whatsappTools",
  "removeBranding",
  "aiGenerator",
  "customDomain",
]);

export default async function PricingPage() {
  const lang = await getLang();
  const c = marketingCopy(lang);
  const t = c.pricing;

  // "Unlimited" is the only limit value that is a word rather than a number.
  const limitLabel = (value: number) =>
    value === UNLIMITED ? c.limits.unlimited : value.toLocaleString("en-LK");

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">{t.eyebrow}</p>
            <h1 className="mt-3 text-[38px] font-semibold tracking-[-0.035em] sm:text-5xl">{t.title}</h1>
            <p className="mt-5 text-[16.5px] leading-relaxed text-muted-foreground text-pretty">{t.lede}</p>
          </div>
          <div className="mt-14">
            <PricingTable lang={lang} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <h2 className="text-center text-[26px] font-semibold tracking-[-0.025em]">{t.compare}</h2>
        <div className="mt-10 overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.feature}
                </th>
                {PLAN_LIST.map((plan) => (
                  <th key={plan.id} className="px-4 py-3 text-left text-[13.5px] font-semibold">
                    {c.plans[plan.id]?.name ?? plan.name}
                    {plan.popular && <span className="ml-2 text-[11px] font-medium text-primary">{t.popular}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row) => {
                const key = row.key as keyof Plan["limits"];
                return (
                  <tr key={row.key} className="border-b border-border last:border-0">
                    <td className="py-3.5 pr-4 text-[13.5px] text-muted-foreground">{row.label}</td>
                    {PLAN_LIST.map((plan) => {
                      const value = plan.limits[key];
                      return (
                        <td key={plan.id} className="px-4 py-3.5 text-[13.5px]">
                          {BOOLEAN_ROWS.has(key) ? (
                            value ? (
                              <Check className="size-4 text-primary" aria-label="✓" />
                            ) : (
                              <Minus className="size-4 text-muted-foreground/50" aria-label="—" />
                            )
                          ) : (
                            limitLabel(value as number)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
          <h2 className="text-center text-[26px] font-semibold tracking-[-0.025em]">{t.faqTitle}</h2>
          <Accordion type="single" collapsible className="mt-8 w-full">
            {t.faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`p-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-12 text-center">
            <Button size="xl" asChild>
              <Link href="/sign-up">{t.cta}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

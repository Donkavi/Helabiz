import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/misc";
import { PLAN_LIST, limitLabel } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing in Sri Lankan Rupees. Start free with a real published website, upgrade when your shop outgrows it.",
};

const COMPARISON: { label: string; key: keyof (typeof PLAN_LIST)[number]["limits"]; kind: "number" | "bool" }[] = [
  { label: "Orders per month", key: "ordersPerMonth", kind: "number" },
  { label: "Products", key: "products", kind: "number" },
  { label: "Websites", key: "websites", kind: "number" },
  { label: "Website pages", key: "pages", kind: "number" },
  { label: "Templates", key: "templates", kind: "number" },
  { label: "Staff accounts", key: "teamMembers", kind: "number" },
  { label: "Website analytics", key: "analytics", kind: "bool" },
  { label: "Invoices", key: "invoices", kind: "bool" },
  { label: "WhatsApp tools", key: "whatsappTools", kind: "bool" },
  { label: "Remove Helabiz branding", key: "removeBranding", kind: "bool" },
  { label: "AI website generation", key: "aiGenerator", kind: "bool" },
  { label: "Custom domain", key: "customDomain", kind: "bool" },
];

const FAQS = [
  { q: "Can I change plan later?", a: "Yes — upgrade or downgrade at any time. Changes apply from your next billing period and nothing is lost when you move." },
  { q: "What happens if I go over the free plan limits?", a: "Your website stays online and existing orders are untouched. You will be asked to upgrade before adding beyond the limit." },
  { q: "How do I pay?", a: "Bank transfer today, with local card gateways being added. The billing system is built so a provider can be connected without any change to your store." },
  { q: "Is there a contract?", a: "No. Plans are monthly and you can cancel whenever you like. Your site falls back to the free plan rather than going offline." },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">Pricing</p>
            <h1 className="mt-3 text-[38px] font-semibold tracking-[-0.035em] sm:text-5xl">
              Priced for a Sri Lankan small business
            </h1>
            <p className="mt-5 text-[16.5px] leading-relaxed text-muted-foreground text-pretty">
              Start free with a real, published website. Upgrade the month it starts paying for itself.
            </p>
          </div>
          <div className="mt-14">
            <PricingTable />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <h2 className="text-center text-[26px] font-semibold tracking-[-0.025em]">Compare the plans</h2>
        <div className="mt-10 overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Feature
                </th>
                {PLAN_LIST.map((plan) => (
                  <th key={plan.id} className="px-4 py-3 text-left text-[13.5px] font-semibold">
                    {plan.name}
                    {plan.popular && <span className="ml-2 text-[11px] font-medium text-primary">Popular</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="py-3.5 pr-4 text-[13.5px] text-muted-foreground">{row.label}</td>
                  {PLAN_LIST.map((plan) => {
                    const value = plan.limits[row.key];
                    return (
                      <td key={plan.id} className="px-4 py-3.5 text-[13.5px]">
                        {row.kind === "bool" ? (
                          value ? (
                            <Check className="size-4 text-primary" aria-label="Included" />
                          ) : (
                            <Minus className="size-4 text-muted-foreground/50" aria-label="Not included" />
                          )
                        ) : (
                          limitLabel(value as number)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
          <h2 className="text-center text-[26px] font-semibold tracking-[-0.025em]">Billing questions</h2>
          <Accordion type="single" collapsible className="mt-8 w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`p-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-12 text-center">
            <Button size="xl" asChild>
              <Link href="/sign-up">Create your free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

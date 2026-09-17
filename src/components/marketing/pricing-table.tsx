import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIST } from "@/lib/plans";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n";
import { marketingCopy } from "@/lib/i18n/marketing";
import { cn } from "@/lib/utils";

/**
 * Plan names, taglines and feature lists come from the dictionary rather than
 * `lib/plans.ts`, because that file is shared with the signed-in app, which is
 * still English only. The numbers stay in `lib/plans.ts` — there is one source
 * of truth for what a plan actually allows.
 */
export function PricingTable({ currentPlan, lang = DEFAULT_LANG }: { currentPlan?: string; lang?: Lang }) {
  const t = marketingCopy(lang);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {PLAN_LIST.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const copy = t.plans[plan.id] ?? { name: plan.name, tagline: plan.tagline, description: plan.description, features: plan.features };
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-7 transition-all duration-200",
              plan.popular
                ? "border-primary/45 shadow-[0_18px_50px_-30px_oklch(0.53_0.098_174/0.6)] lg:-my-2 lg:py-9"
                : "border-border hover:border-border/80",
            )}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-7 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground">
                {t.planCard.mostPopular}
              </span>
            )}

            <div>
              <h3 className="text-[17px] font-semibold">{copy.name}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{copy.tagline}</p>
            </div>

            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-[34px] font-semibold tracking-[-0.03em]">
                {plan.price === 0 ? t.planCard.free : `Rs. ${plan.price.toLocaleString("en-LK")}`}
              </span>
              {plan.price > 0 && <span className="text-[13.5px] text-muted-foreground">{t.planCard.perMonth}</span>}
            </div>

            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">{copy.description}</p>

            <ul className="mt-7 flex-1 space-y-2.5">
              {copy.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[13.5px]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-8 w-full"
              size="lg"
              variant={plan.popular ? "default" : "outline"}
              disabled={isCurrent}
              asChild={!isCurrent}
            >
              {isCurrent ? (
                <span>{t.planCard.currentPlan}</span>
              ) : (
                <Link href={currentPlan ? `/settings/billing?plan=${plan.id}` : "/sign-up"}>
                  {plan.price === 0 ? t.planCard.startFree : t.planCard.choose.replace("{plan}", copy.name)}
                </Link>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Globe, Package, Rocket, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { fill } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";

export function SetupChecklist({
  hasProducts,
  hasWebsite,
  isPublished,
  hasOrders,
}: {
  hasProducts: boolean;
  hasWebsite: boolean;
  isPublished: boolean;
  hasOrders: boolean;
}) {
  const t = useT();
  const done = [hasProducts, hasWebsite, isPublished, hasOrders];
  const icons = [Package, Globe, Rocket, ShoppingCart];
  const hrefs = ["/products/new", "/website", "/website", "/orders/new"];
  const steps = t.home.setup.map((step, i) => ({
    ...step,
    done: done[i],
    icon: icons[i],
    href: hrefs[i],
  }));

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  const next = steps.find((s) => !s.done);

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 animate-fade-up">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold">{t.home.setupTitle}</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {fill(t.home.setupProgress, { done: completed, total: steps.length })}
            </p>
          </div>
          {next && (
            <Button asChild>
              <Link href={next.href}>
                {next.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>

        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <li key={step.title}>
              <Link
                href={step.href}
                className={cn(
                  "flex h-full flex-col gap-1.5 rounded-lg border p-3.5 transition-all duration-150",
                  step.done
                    ? "border-primary/25 bg-primary-muted/40"
                    : "border-border bg-background hover:border-primary/30 hover:shadow-xs",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.done ? <Check className="size-3.5 stroke-[3]" /> : React.createElement(step.icon, { className: "size-3.5" })}
                </span>
                <span className="text-[13.5px] font-medium">{step.title}</span>
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">{step.body}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

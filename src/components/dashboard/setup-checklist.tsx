import Link from "next/link";
import { ArrowRight, Check, Globe, Package, Rocket, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const steps = [
    { done: hasProducts, icon: Package, title: "Add your products", body: "Name, price and a photo is enough to start.", href: "/products/new", cta: "Add product" },
    { done: hasWebsite, icon: Globe, title: "Create your website", body: "Pick a template — your products load in automatically.", href: "/website", cta: "Create website" },
    { done: isPublished, icon: Rocket, title: "Publish it", body: "Go live on your own helabiz.lk address.", href: "/website", cta: "Open builder" },
    { done: hasOrders, icon: ShoppingCart, title: "Take your first order", body: "Website orders arrive here automatically.", href: "/orders/new", cta: "Record an order" },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  const next = steps.find((s) => !s.done);

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 animate-fade-up">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold">Get set up</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {completed} of {steps.length} done — you are close.
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
                  {step.done ? <Check className="size-3.5 stroke-[3]" /> : <step.icon className="size-3.5" />}
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

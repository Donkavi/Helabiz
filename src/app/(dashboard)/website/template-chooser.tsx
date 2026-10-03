"use client";

import * as React from "react";
import { ArrowRight, Check, Eye, Globe, Loader2, Lock, Package, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_TEMPLATES } from "@/lib/website/templates";
import { ADDON_LIST, addonsTotal, type AddonId } from "@/lib/addons";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TemplateThumbnail } from "@/components/website/template-thumbnail";
import { PremiumTemplatePanel } from "@/components/dashboard/premium-template-panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createWebsiteAction } from "./actions";
import { AiGeneratorDialog } from "./ai-generator-dialog";
import { WebsiteHelpBanner } from "@/components/dashboard/support/website-help-banner";
import type { RequestStatus } from "@/lib/website-request";

export function TemplateChooser({
  productCount,
  canUsePremium,
  activeAddons = [],
  offeredAddons,
  requestStatus,
  defaultPhone,
}: {
  productCount: number;
  /** False on the free plan, which builds only from the free designs. */
  canUsePremium: boolean;
  /** Add-ons already paid for, so they are not offered a second time. */
  activeAddons?: string[];
  /** The add-ons on sale; defaults to all of them. */
  offeredAddons?: string[];
  /** Their "build it for me" request, if they have made one. */
  requestStatus?: RequestStatus | null;
  /** Prefills the request form. */
  defaultPhone?: string;
}) {
  // Never open on a design this plan cannot build from: the sticky bar would
  // say "Starting from Modern Fashion Store" and the server would then refuse
  // it. On the free trial that means the first design the trial includes.
  const [selected, setSelected] = React.useState(() =>
    canUsePremium
      ? "modern-fashion"
      : (ALL_TEMPLATES.find((t) => t.tier === "free" && t.id !== "blank")?.id ?? "blank"),
  );
  const [pending, startTransition] = React.useTransition();
  const [aiOpen, setAiOpen] = React.useState(false);
  // Chosen here, paid for afterwards: the site is built either way, and the
  // add-ons switch on once the deposit for them is approved.
  const [wanted, setWanted] = React.useState<AddonId[]>([]);
  const [locked, setLocked] = React.useState<(typeof ALL_TEMPLATES)[number] | null>(null);

  // The designs this plan can actually use come first, so the free trial is
  // not a scroll through mostly locked cards.
  const ordered = React.useMemo(
    () =>
      canUsePremium
        ? ALL_TEMPLATES
        : [...ALL_TEMPLATES].sort((a, b) => Number(a.tier === "premium") - Number(b.tier === "premium")),
    [canUsePremium],
  );
  const includedCount = ALL_TEMPLATES.filter((t) => t.tier === "free").length;

  const create = () => {
    startTransition(async () => {
      const result = await createWebsiteAction(selected, wanted);
      // A successful create redirects, so reaching here means it failed.
      if (result && !result.ok) toast.error(result.error ?? "Could not create your website");
    });
  };

  const offered = ADDON_LIST.filter(
    (addon) => !activeAddons.includes(addon.id) && (!offeredAddons || offeredAddons.includes(addon.id)),
  );
  const monthly = addonsTotal(wanted);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <Globe className="size-5" />
            </span>
            <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">No website yet</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
              Pick a starting point below. Your products load in automatically, and you can change every colour, word
              and section afterwards.
            </p>
            {productCount === 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-[13px] text-warning">
                <Package className="size-3.5 shrink-0" />
                Add a few products first so your shop pages have something to show.
              </p>
            )}
            {!canUsePremium && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                Your free trial builds from {includedCount} of these {ALL_TEMPLATES.length} designs. A paid plan opens
                the rest.
              </p>
            )}
          </div>

          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Wand2 className="size-4" />
            Create with AI
          </Button>
        </div>
      </div>

      {/* Or have the Helabiz team do it all */}
      <WebsiteHelpBanner variant="slim" status={requestStatus} defaultPhone={defaultPhone} />

      {/* Templates */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((template) => {
          const active = selected === template.id;
          const blank = template.id === "blank";
          const premium = template.tier === "premium" && !canUsePremium;
          return (
            // The preview link is an anchor, so it sits beside the select button
            // rather than inside it -- an <a> nested in a <button> is invalid.
            <div key={template.id} className="relative">
            <button
              type="button"
              onClick={() => (premium ? setLocked(template) : setSelected(template.id))}
              aria-pressed={active}
              className={cn(
                "group w-full overflow-hidden rounded-xl border bg-card text-left transition-all duration-200",
                active ? "border-primary shadow-md ring-2 ring-primary/15" : "border-border hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div
                className="relative aspect-16/10 overflow-hidden"
                style={{ background: blank ? undefined : template.theme.background }}
              >
                {blank ? (
                  <div className="flex size-full items-center justify-center bg-muted/60">
                    <Sparkles className="size-6 text-muted-foreground" />
                  </div>
                ) : (
                  <TemplateThumbnail theme={template.theme} category={template.category} />
                )}
                {active && (
                  <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="size-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{template.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <Badge variant={active ? "default" : premium ? "warning" : "muted"} className="shrink-0">
                  {premium && <Lock className="size-3" />}
                  {premium ? "Starter" : template.category}
                </Badge>
              </div>
            </button>

            {!blank && (
              <Link
                href={`/templates/${template.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`Preview the ${template.name} template`}
                className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-lg bg-background/90 px-2.5 py-1.5 text-[12px] font-semibold shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-background hover:text-primary"
              >
                <Eye className="size-3.5" />
                Preview
              </Link>
            )}
            </div>
          );
        })}
      </div>

      {offered.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold">Add more to your website</h3>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Optional extras, {formatCurrency(200, { decimals: false })} each per month. Your website is created either
            way — these switch on once you have paid for them.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {offered.map((addon) => {
              const ticked = wanted.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                    ticked
                      ? "border-primary/55 bg-primary-muted/30"
                      : "border-border bg-background hover:bg-accent/40",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-[var(--primary)]"
                    checked={ticked}
                    onChange={() =>
                      setWanted((current) =>
                        current.includes(addon.id)
                          ? current.filter((id) => id !== addon.id)
                          : [...current, addon.id],
                      )
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium">{addon.name}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                      {addon.tagline}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear of the "Need help?" pill in the corner. */}
      <div className="sticky bottom-16 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <p className="text-[13.5px] text-muted-foreground">
          Starting from{" "}
          <span className="font-semibold text-foreground">
            {ALL_TEMPLATES.find((t) => t.id === selected)?.name}
          </span>
          .{" "}
          {monthly > 0
            ? `Plus ${formatCurrency(monthly, { decimals: false })} a month of add-ons.`
            : "You can change everything later."}
        </p>
        <Button size="lg" onClick={create} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? "Building your website…" : "Create my website"}
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </div>

      <Dialog open={Boolean(locked)} onOpenChange={(next) => !next && setLocked(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Upgrade to use this template</DialogTitle>
          </DialogHeader>
          {locked && (
            <PremiumTemplatePanel
              templateId={locked.id}
              templateName={locked.name}
              onBack={() => setLocked(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AiGeneratorDialog open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

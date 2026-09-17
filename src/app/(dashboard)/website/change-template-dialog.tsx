"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Eye, Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/misc";
import { TemplateThumbnail } from "@/components/website/template-thumbnail";
import { PremiumTemplatePanel } from "@/components/dashboard/premium-template-panel";
import { ALL_TEMPLATES } from "@/lib/website/templates";
import { cn } from "@/lib/utils";
import { changeTemplateAction } from "./actions";

type Template = (typeof ALL_TEMPLATES)[number];

/**
 * Switches an existing website to a different template.
 *
 * Two steps on purpose: the second one spells out which of the business's own
 * pages are about to be overwritten, by name, before anything happens.
 */
export function ChangeTemplateDialog({
  open,
  onOpenChange,
  currentTemplateId,
  canUsePremium,
  pageTitles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplateId?: string;
  /** False on the free plan, which builds only from the free designs. */
  canUsePremium: boolean;
  /** The site's current pages, used to say exactly what will be replaced. */
  pageTitles: { title: string; slug: string; isHome: boolean }[];
}) {
  const router = useRouter();
  const [chosen, setChosen] = React.useState<Template | null>(null);
  const [locked, setLocked] = React.useState<Template | null>(null);
  const [applyTheme, setApplyTheme] = React.useState(true);
  const [pending, startTransition] = React.useTransition();

  const handleOpenChange = (next: boolean) => {
    if (pending) return;
    if (next) {
      setChosen(null);
      setLocked(null);
      setApplyTheme(true);
    }
    onOpenChange(next);
  };

  const apply = () => {
    if (!chosen) return;
    startTransition(async () => {
      const result = await changeTemplateAction(chosen.id, { applyTheme });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.skipped.length) {
        toast.warning(
          `Switched to ${chosen.name}, but your plan had no room for ${result.skipped.join(" and ")}.`,
        );
      } else {
        toast.success(`Your website now uses ${chosen.name}. Republish when you are happy with it.`);
      }
      onOpenChange(false);
      router.refresh();
    });
  };

  // Which of the business's pages the template will write over, and which it
  // will leave alone. Home matches on its flag, everything else on its slug.
  const templateSlugs = new Set(chosen?.pages.filter((page) => !page.isHome).map((page) => page.slug));
  const overwritten = chosen
    ? pageTitles.filter((page) => page.isHome || templateSlugs.has(page.slug))
    : [];
  const untouched = chosen
    ? pageTitles.filter((page) => !page.isHome && !templateSlugs.has(page.slug))
    : [];
  const brandNew = chosen
    ? chosen.pages.filter(
        (page) => !page.isHome && !pageTitles.some((existing) => existing.slug === page.slug),
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size={chosen || locked ? "lg" : "full"}>
        {locked ? (
          <>
            <DialogHeader>
              <DialogTitle>Upgrade to use this template</DialogTitle>
            </DialogHeader>
            <PremiumTemplatePanel
              templateId={locked.id}
              templateName={locked.name}
              onBack={() => setLocked(null)}
            />
          </>
        ) : !chosen ? (
          <>
            <DialogHeader>
              <DialogTitle>Change template</DialogTitle>
              <DialogDescription>
                Pick a new starting point. Your products, orders and customers are not affected, and your live
                site keeps showing the current design until you republish.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ALL_TEMPLATES.map((template) => {
                const current = template.id === currentTemplateId;
                const premium = template.tier === "premium" && !canUsePremium;
                return (
                  <div key={template.id} className="relative">
                    <button
                      type="button"
                      onClick={() => (premium ? setLocked(template) : setChosen(template))}
                      disabled={current}
                      className={cn(
                        "w-full overflow-hidden rounded-xl border bg-card text-left transition-all duration-200",
                        current
                          ? "cursor-default border-primary opacity-70 ring-2 ring-primary/15"
                          : "border-border hover:border-primary/40 hover:shadow-sm",
                      )}
                    >
                      <div className="relative aspect-16/10 overflow-hidden">
                        {template.id === "blank" ? (
                          <div className="flex size-full items-center justify-center bg-muted/60">
                            <Sparkles className="size-6 text-muted-foreground" />
                          </div>
                        ) : (
                          <TemplateThumbnail theme={template.theme} category={template.category} />
                        )}
                        {current && (
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
                        <Badge variant={current ? "default" : premium ? "warning" : "muted"} className="shrink-0">
                          {current ? "Current" : premium ? <Lock className="size-3" /> : null}
                          {current ? "" : premium ? "Starter" : template.category}
                        </Badge>
                      </div>
                    </button>

                    {template.id !== "blank" && (
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
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Switch to {chosen.name}?</DialogTitle>
              <DialogDescription>
                This rewrites the sections on the pages below. Anything you have edited on them is replaced and
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Row
                tone="danger"
                label={`${overwritten.length} page${overwritten.length === 1 ? "" : "s"} rewritten`}
                items={overwritten.map((page) => page.title)}
                note="Everything on these pages is replaced with the new design."
              />
              {brandNew.length > 0 && (
                <Row
                  tone="muted"
                  label={`${brandNew.length} page${brandNew.length === 1 ? "" : "s"} added`}
                  items={brandNew.map((page) => page.title)}
                  note="Added if your plan has room for them."
                />
              )}
              {untouched.length > 0 && (
                <Row
                  tone="muted"
                  label={`${untouched.length} page${untouched.length === 1 ? "" : "s"} left alone`}
                  items={untouched.map((page) => page.title)}
                  note="Pages the template does not cover keep their content."
                />
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5">
                <Checkbox
                  checked={applyTheme}
                  onCheckedChange={(value) => setApplyTheme(value === true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-[13.5px] font-medium">Use this template&apos;s colours and fonts</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                    Turn this off to keep the theme you have now and change only the layout.
                  </span>
                </span>
              </label>

              <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-[12.5px] text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Your live site is untouched until you republish, so you can look at the new design first.
              </p>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setChosen(null)} disabled={pending}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button onClick={apply} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {pending ? "Rebuilding your pages…" : `Switch to ${chosen.name}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  tone,
  label,
  items,
  note,
}: {
  tone: "danger" | "muted";
  label: string;
  items: string[];
  note: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5",
        tone === "danger" ? "border-destructive/30 bg-destructive/5" : "border-border",
      )}
    >
      <p className={cn("text-[13.5px] font-semibold", tone === "danger" && "text-destructive")}>{label}</p>
      <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[13px]">
        {items.map((item) => (
          <span key={item} className="rounded bg-muted px-1.5 py-0.5 font-medium">
            {item}
          </span>
        ))}
      </p>
      <p className="mt-2 text-[12.5px] text-muted-foreground">{note}</p>
    </div>
  );
}

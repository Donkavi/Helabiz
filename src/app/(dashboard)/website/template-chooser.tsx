"use client";

import * as React from "react";
import { ArrowRight, Check, Eye, Globe, Loader2, Package, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_TEMPLATES } from "@/lib/website/templates";
import { cn } from "@/lib/utils";
import { TemplateThumbnail } from "@/components/website/template-thumbnail";
import { createWebsiteAction } from "./actions";
import { AiGeneratorDialog } from "./ai-generator-dialog";

export function TemplateChooser({ productCount }: { productCount: number }) {
  const [selected, setSelected] = React.useState("modern-fashion");
  const [pending, startTransition] = React.useTransition();
  const [aiOpen, setAiOpen] = React.useState(false);

  const create = () => {
    startTransition(async () => {
      const result = await createWebsiteAction(selected);
      // A successful create redirects, so reaching here means it failed.
      if (result && !result.ok) toast.error(result.error ?? "Could not create your website");
    });
  };

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
          </div>

          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Wand2 className="size-4" />
            Create with AI
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ALL_TEMPLATES.map((template) => {
          const active = selected === template.id;
          const blank = template.id === "blank";
          return (
            // The preview link is an anchor, so it sits beside the select button
            // rather than inside it -- an <a> nested in a <button> is invalid.
            <div key={template.id} className="relative">
            <button
              type="button"
              onClick={() => setSelected(template.id)}
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
                  <TemplateThumbnail theme={template.theme} />
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
                <Badge variant={active ? "default" : "muted"} className="shrink-0">
                  {template.category}
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

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <p className="text-[13.5px] text-muted-foreground">
          Starting from{" "}
          <span className="font-semibold text-foreground">
            {ALL_TEMPLATES.find((t) => t.id === selected)?.name}
          </span>
          . You can change everything later.
        </p>
        <Button size="lg" onClick={create} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? "Building your website…" : "Create my website"}
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </div>

      <AiGeneratorDialog open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

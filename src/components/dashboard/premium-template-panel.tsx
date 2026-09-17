"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { ALL_TEMPLATES, FREE_TEMPLATE_IDS } from "@/lib/website/templates";
import { formatCurrency } from "@/lib/utils";

/**
 * Shown when a free plan picks a template it cannot build from.
 *
 * Names the designs the plan does include, so the answer is "here is what you
 * have, and here is what the next plan adds" rather than a bare refusal. The
 * preview stays open — there is no reason to hide what is being sold.
 */
export function PremiumTemplatePanel({
  templateId,
  templateName,
  onBack,
}: {
  templateId: string;
  templateName: string;
  onBack?: () => void;
}) {
  const included = ALL_TEMPLATES.filter((t) => FREE_TEMPLATE_IDS.includes(t.id) && t.id !== "blank");
  const starter = PLANS.starter;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3.5 rounded-xl border border-border bg-muted/40 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
          <Lock className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold">{templateName} is a premium template</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Your Free plan builds from {included.map((t) => t.name).join(" and ")}, or a blank page.{" "}
            {starter.name} at {formatCurrency(starter.price, { decimals: false })} a month opens all {ALL_TEMPLATES.length - 1}{" "}
            designs — and you can switch between them whenever you like.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/settings/billing">
            Upgrade to {starter.name}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/templates/${templateId}`} target="_blank" rel="noopener noreferrer">
            <Eye className="size-3.5" />
            Preview it first
          </Link>
        </Button>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-3.5" />
            Pick another
          </Button>
        )}
      </div>
    </div>
  );
}

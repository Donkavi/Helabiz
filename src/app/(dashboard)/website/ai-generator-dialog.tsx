"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { iconFor } from "@/lib/website/icons";
import { acceptAiPlanAction, generateWebsiteAction, type AiState } from "./ai-actions";

const EXAMPLE =
  "I run a women's clothing business in Colombo called Kavi Fashion. We sell modern casual clothing — dresses, tops and accessories — made in our own small workshop.";

export function AiGeneratorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AiState, FormData>(generateWebsiteAction, null);
  const [description, setDescription] = React.useState("");
  const [accepting, startAccept] = React.useTransition();

  const plan = state?.ok ? state.plan : null;
  const failure = state && !state.ok ? state : null;

  const accept = () => {
    if (!plan) return;
    startAccept(async () => {
      const result = await acceptAiPlanAction(plan);
      if (!result.ok) {
        toast.error(result.error ?? "Could not create your website");
        return;
      }
      toast.success("Your website is ready to customise");
      onOpenChange(false);
      router.push(result.pageId ? `/website/builder/${result.pageId}` : "/website");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            Create my website with AI
          </DialogTitle>
          <DialogDescription>
            Describe your business in your own words and we will draft a full website — structure, words, colours and
            fonts. You can change all of it afterwards.
          </DialogDescription>
        </DialogHeader>

        {!plan ? (
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-description">Tell us about your business</Label>
              <Textarea
                id="ai-description"
                name="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={EXAMPLE}
                aria-invalid={!!failure?.fieldErrors?.description}
              />
              {failure?.fieldErrors?.description ? (
                <p className="text-[12.5px] text-destructive">{failure.fieldErrors.description}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setDescription(EXAMPLE)}
                  className="text-[12.5px] text-primary hover:underline"
                >
                  Use the example
                </button>
              )}
            </div>

            <input type="hidden" name="tone" value="professional" />

            {failure?.error && (
              <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-[13px] text-destructive">
                {failure.error}
              </p>
            )}

            <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[12.5px] leading-relaxed text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              This runs on the built-in generator, so it works without any API key. The service is written behind a
              provider interface, so a language model can be connected later without changing your website.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                {pending ? "Designing…" : "Generate my website"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="success">Draft ready</Badge>
              <span className="text-[12.5px] text-muted-foreground">
                {plan.pages.length} pages · {plan.pages.reduce((sum, p) => sum + p.sections.length, 0)} sections
              </span>
            </div>

            {/* Theme preview */}
            <div className="rounded-xl border border-border p-4" style={{ background: plan.theme.background }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: plan.theme.primary }}>
                {plan.tagline}
              </p>
              <p
                className="mt-2 whitespace-pre-line text-[20px] font-semibold leading-tight"
                style={{ color: plan.theme.text }}
              >
                {plan.heroTitle}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: plan.theme.muted }}>
                {plan.heroDescription}
              </p>
              <span
                className="mt-4 inline-block px-4 py-2 text-[12px] font-semibold"
                style={{
                  background: plan.theme.primary,
                  color: "#fff",
                  borderRadius: plan.theme.buttonStyle === "pill" ? 999 : plan.theme.radius,
                }}
              >
                Shop now
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {plan.features.map((feature) => {
                const Icon = iconFor(feature.icon);
                return (
                  <div key={feature.title} className="rounded-lg border border-border p-3">
                    <Icon className="size-4 text-primary" />
                    <p className="mt-2 text-[13px] font-semibold">{feature.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-[12px] font-semibold">Pages it will create</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.pages.map((page) => (
                  <span key={page.slug} className="rounded-md bg-muted px-2 py-1 text-[11.5px] font-medium">
                    {page.title}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-1.5">
              {plan.notes.map((note) => (
                <li key={note} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                  <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                  {note}
                </li>
              ))}
            </ul>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Re-submitting the form is the only way back to step one.
                  onOpenChange(false);
                  setTimeout(() => onOpenChange(true), 10);
                }}
              >
                <ArrowLeft className="size-4" />
                Start over
              </Button>
              <Button onClick={accept} loading={accepting}>
                {accepting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Use this website
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

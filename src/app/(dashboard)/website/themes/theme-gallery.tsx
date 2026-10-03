"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { THEMES, type ThemePreset } from "@/lib/website/themes";
import { cn } from "@/lib/utils";
import { applyThemeAction } from "../actions";

export function ThemeGallery({ currentThemeId, builderHref }: { currentThemeId: string; builderHref: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<ThemePreset | null>(null);
  const [pending, startTransition] = React.useTransition();

  const apply = () => {
    if (!confirm) return;
    startTransition(async () => {
      const result = await applyThemeAction(confirm.id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not apply that theme");
        return;
      }
      toast.success(`${confirm.name} applied`, { description: "Publish when you are happy with it." });
      setConfirm(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4" data-tour="website-themes-builder">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary">
          <Palette className="size-4" />
        </span>
        <p className="min-w-0 flex-1 text-[13.5px] text-muted-foreground">
          Want to fine-tune instead? Every colour, font and radius can be adjusted individually in the builder.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={builderHref}>
            <Sparkles className="size-3.5" />
            Open builder
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEMES.map((theme) => {
          const active = theme.id === currentThemeId;
          return (
            <article
              key={theme.id}
              data-tour={active ? "website-themes-current" : undefined}
              className={cn(
                "overflow-hidden rounded-xl border bg-card transition-all duration-200",
                active ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <ThemePreviewTile theme={theme} />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[14.5px] font-semibold">
                      {theme.name}
                      {active && <Check className="size-3.5 text-primary" />}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{theme.description}</p>
                  </div>
                  <Badge variant="muted" className="shrink-0">
                    {theme.category}
                  </Badge>
                </div>

                <div className="mt-3.5 flex items-center gap-2">
                  <span className="flex gap-1">
                    {[theme.tokens.primary, theme.tokens.secondary, theme.tokens.surface, theme.tokens.background].map(
                      (color) => (
                        <span
                          key={color}
                          className="size-4 rounded border border-border"
                          style={{ background: color }}
                          title={color}
                        />
                      ),
                    )}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {theme.tokens.headingFont} · {theme.tokens.bodyFont}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={active ? "outline" : "default"}
                  className="mt-4 w-full"
                  disabled={active}
                  onClick={() => setConfirm(theme)}
                  data-tour={active ? undefined : "website-themes-apply"}
                >
                  {active ? "Current theme" : "Apply theme"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Apply “{confirm?.name}”?</DialogTitle>
            <DialogDescription>
              This replaces your colours, fonts, button shape and spacing. Your pages, sections and words stay exactly
              where they are — and it only goes live when you publish.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={apply} loading={pending}>
              Apply theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ThemePreviewTile({ theme }: { theme: ThemePreset }) {
  const t = theme.tokens;
  return (
    <div className="aspect-16/10" style={{ background: t.background }}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${t.text}12` }}>
          <span
            className="text-[9px] font-bold tracking-tight"
            style={{ color: t.text, fontFamily: t.headingFont }}
          >
            {theme.name.toUpperCase()}
          </span>
          <span className="flex gap-2">
            {["Shop", "About"].map((label) => (
              <span key={label} className="text-[8px]" style={{ color: t.muted }}>
                {label}
              </span>
            ))}
          </span>
        </div>

        <div className="grid flex-1 grid-cols-[1.2fr_1fr] gap-3 p-4">
          <div className="flex flex-col justify-center gap-2">
            <span className="h-1 w-8 rounded-full" style={{ background: t.primary }} />
            <span className="h-2.5 w-full rounded-full" style={{ background: t.text, opacity: 0.88 }} />
            <span className="h-2.5 w-2/3 rounded-full" style={{ background: t.text, opacity: 0.88 }} />
            <span className="mt-0.5 h-1 w-full rounded-full" style={{ background: t.muted, opacity: 0.4 }} />
            <div className="mt-2 flex gap-1.5">
              <span
                className="h-5 w-16"
                style={{
                  background: t.buttonStyle === "outline" ? "transparent" : t.primary,
                  border: t.buttonStyle === "outline" ? `1px solid ${t.text}` : undefined,
                  borderRadius: t.buttonStyle === "pill" ? 999 : t.radius,
                }}
              />
              <span
                className="h-5 w-16"
                style={{ border: `1px solid ${t.text}30`, borderRadius: t.buttonStyle === "pill" ? 999 : t.radius }}
              />
            </div>
          </div>
          <div
            className="size-full"
            style={{ background: `linear-gradient(140deg, ${t.secondary}, ${t.surface})`, borderRadius: t.radius }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="aspect-square"
              style={{
                background: t.surface,
                borderRadius: t.radius,
                boxShadow: t.cardStyle === "shadow" || t.cardStyle === "elevated" ? "0 4px 12px -6px rgba(0,0,0,.4)" : undefined,
                border: t.cardStyle === "bordered" ? `1px solid ${t.text}14` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

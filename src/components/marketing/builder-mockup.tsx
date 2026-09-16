"use client";

import * as React from "react";
import {
  AlignLeft,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Monitor,
  Quote,
  Redo2,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Type,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTE = [
  { icon: Sparkles, label: "Hero" },
  { icon: LayoutGrid, label: "Product grid" },
  { icon: ImageIcon, label: "Gallery" },
  { icon: Type, label: "Heading" },
  { icon: Quote, label: "Testimonials" },
  { icon: Square, label: "Button" },
];

/**
 * A non-interactive, high-fidelity picture of the real editor used on the
 * landing page. It loops a short "drag a section in" animation so visitors can
 * see the interaction model before signing up.
 */
export function BuilderMockup({ className }: { className?: string }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 2200);
    return () => clearInterval(id);
  }, []);

  const dropping = step === 1 || step === 2;
  const inserted = step >= 2;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_-30px_oklch(0_0_0/0.35)]",
        className,
      )}
      aria-hidden
    >
      {/* Toolbar */}
      <div className="flex h-11 items-center gap-3 border-b border-border bg-card px-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </div>
        <div className="ml-2 flex items-center gap-1">
          <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground">
            <Undo2 className="size-3.5" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground/40">
            <Redo2 className="size-3.5" />
          </span>
        </div>
        <div className="mx-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-card text-foreground shadow-xs">
            <Monitor className="size-3.5" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground">
            <Tablet className="size-3.5" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-md text-muted-foreground">
            <Smartphone className="size-3.5" />
          </span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">Saved</span>
        <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
          Publish
        </span>
      </div>

      <div className="grid grid-cols-[104px_1fr_112px] sm:grid-cols-[130px_1fr_140px]">
        {/* Component library */}
        <div className="border-r border-border bg-sidebar p-2">
          <p className="px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Components
          </p>
          <div className="space-y-1">
            {PALETTE.map((item, i) => {
              const isDragging = i === 1 && dropping;
              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-all duration-300",
                    i === 1 && "bg-card",
                    isDragging && "border-primary/40 bg-primary-muted text-primary shadow-sm",
                  )}
                >
                  <item.icon className="size-3 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative min-h-[260px] bg-muted/40 p-3 sm:min-h-[320px]">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            {/* Site header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[9px] font-semibold tracking-tight">KAVI FASHION</span>
              <div className="flex gap-2">
                {["Shop", "About", "Contact"].map((l) => (
                  <span key={l} className="text-[8px] text-muted-foreground">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero section — selected */}
            <div className="relative m-1.5 rounded-md outline-2 outline-primary">
              <span className="absolute -top-[7px] left-2 z-10 rounded-sm bg-primary px-1 py-px text-[7px] font-semibold text-primary-foreground">
                Hero
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-gradient-to-br from-primary-muted to-transparent p-3">
                <div className="flex flex-col justify-center gap-1">
                  <div className="h-1.5 w-4/5 rounded-full bg-foreground/80" />
                  <div className="h-1.5 w-3/5 rounded-full bg-foreground/80" />
                  <div className="mt-1 h-1 w-full rounded-full bg-muted-foreground/30" />
                  <div className="mt-1.5 flex gap-1">
                    <span className="h-3 w-10 rounded-[3px] bg-primary" />
                    <span className="h-3 w-10 rounded-[3px] border border-border bg-card" />
                  </div>
                </div>
                <div className="aspect-4/3 rounded-md bg-gradient-to-br from-gold/30 to-primary/20" />
              </div>
            </div>

            {/* Drop indicator */}
            <div
              className={cn(
                "mx-1.5 overflow-hidden transition-all duration-300",
                dropping && !inserted ? "h-5 opacity-100" : "h-0 opacity-0",
              )}
            >
              <div className="flex h-5 items-center gap-1 rounded-md border border-dashed border-primary bg-primary-muted/60 px-2">
                <span className="size-1 rounded-full bg-primary" />
                <span className="text-[7px] font-semibold text-primary">Drop here</span>
              </div>
            </div>

            {/* Inserted product grid */}
            <div
              className={cn(
                "mx-1.5 overflow-hidden transition-all duration-500",
                inserted ? "mb-1.5 max-h-24 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="rounded-md border border-border bg-card p-2">
                <div className="mb-1.5 flex items-center gap-1">
                  <GripVertical className="size-2 text-muted-foreground/50" />
                  <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Product grid · 4 products
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <div
                        className={cn(
                          "aspect-square rounded-[3px]",
                          i % 2 ? "bg-primary/15" : "bg-gold/20",
                        )}
                      />
                      <div className="h-0.5 w-full rounded-full bg-muted-foreground/30" />
                      <div className="h-0.5 w-2/3 rounded-full bg-muted-foreground/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating drag ghost */}
          <div
            className={cn(
              "pointer-events-none absolute z-20 flex items-center gap-1.5 rounded-md border border-primary/40 bg-card px-2 py-1.5 text-[9px] font-medium text-primary shadow-lg transition-all duration-700 ease-out",
              dropping ? "left-[18%] top-[52%] opacity-100" : "left-[-8%] top-[26%] opacity-0",
            )}
          >
            <LayoutGrid className="size-3" />
            Product grid
          </div>
        </div>

        {/* Settings panel */}
        <div className="border-l border-border bg-sidebar p-2">
          <p className="px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hero settings
          </p>
          <div className="space-y-2">
            <MockField label="Heading" />
            <MockField label="Button text" />
            <div>
              <p className="mb-1 text-[8px] text-muted-foreground">Background</p>
              <div className="flex gap-1">
                {["bg-primary", "bg-gold", "bg-foreground", "bg-info"].map((c) => (
                  <span key={c} className={cn("size-3.5 rounded-[4px] ring-1 ring-border", c)} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1 text-[8px] text-muted-foreground">
                <AlignLeft className="size-2.5" /> Alignment
              </p>
              <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn("h-3 flex-1 rounded-[3px]", i === 0 ? "bg-card shadow-xs" : "bg-transparent")}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[8px] text-muted-foreground">Spacing</p>
              <div className="relative h-1 rounded-full bg-muted">
                <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-primary" />
                <span className="absolute -top-0.5 left-2/3 size-2 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockField({ label }: { label: string }) {
  return (
    <div>
      <p className="mb-1 text-[8px] text-muted-foreground">{label}</p>
      <div className="h-4 rounded-[4px] border border-border bg-card" />
    </div>
  );
}

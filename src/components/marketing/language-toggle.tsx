"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLangAction } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

/**
 * Switches the marketing site between Sinhala and English.
 *
 * The choice is stored server-side in a cookie rather than in component state,
 * so it survives navigation and the pages arrive already translated — title
 * included — instead of flickering from one language to the other.
 */
export function LanguageToggle({ current, className }: { current: Lang; className?: string }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5",
        pending && "opacity-60",
        className,
      )}
    >
      <Languages className="ml-1.5 mr-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {LANGS.map((option) => (
        <button
          key={option.id}
          type="button"
          lang={option.id}
          disabled={pending || option.id === current}
          onClick={() => startTransition(() => setLangAction(option.id))}
          aria-pressed={option.id === current}
          className={cn(
            "rounded-md px-2 py-1 text-[12.5px] font-medium transition-colors",
            option.id === current
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

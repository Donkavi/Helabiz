import { artFor } from "@/lib/website/template-art";
import { cn } from "@/lib/utils";
import type { ThemeTokens } from "@/types";

/* Plain <img>: these are local SVGs, which the image optimizer passes through
   unchanged, and they render a few dozen pixels wide inside a miniature. */
/* eslint-disable @next/next/no-img-element */

export type PreviewTemplate = {
  name: string;
  category: string;
  theme: ThemeTokens;
};

/**
 * A miniature of a template, drawn from its own theme tokens and filled with
 * the artwork that belongs to its category.
 *
 * Shared by the template gallery and the home page, so a bakery template looks
 * like a bakery in both places rather than being a coloured rectangle in one
 * and a shop in the other. `compact` is the four-across home page card, which
 * has room for the hero but not for the navigation or a full product row.
 */
export function TemplatePreview({
  template,
  compact,
  className,
}: {
  template: PreviewTemplate;
  compact?: boolean;
  className?: string;
}) {
  const art = artFor(template.category);
  const { theme } = template;
  const buttonRadius = theme.buttonStyle === "pill" ? 999 : theme.radius;

  return (
    <div className={cn("relative size-full overflow-hidden", className)} style={{ background: theme.background }}>
      {/* Chrome */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          compact ? "h-6 px-3" : "h-9 px-5",
        )}
        style={{ borderBottom: `1px solid ${theme.text}14` }}
      >
        <span
          className={cn("font-bold tracking-tight", compact ? "text-[8px]" : "text-[11px]")}
          style={{ color: theme.text, fontFamily: theme.headingFont }}
        >
          {template.name.toUpperCase()}
        </span>
        <span className={cn("flex", compact ? "gap-1.5" : "gap-2.5")}>
          {(compact ? ["Shop", "About"] : ["Shop", "About", "Contact"]).map((label) => (
            <span key={label} className={compact ? "text-[6px]" : "text-[9px]"} style={{ color: theme.muted }}>
              {label}
            </span>
          ))}
        </span>
      </div>

      {/* Hero: words on the left, a picture where a photograph would go. */}
      <div
        className={cn(
          "absolute inset-x-0 grid grid-cols-2",
          compact ? "top-6 bottom-[34%] gap-2.5 px-3 pt-2.5" : "top-9 bottom-[32%] gap-5 px-6 pt-5",
        )}
      >
        <div className={cn("flex flex-col justify-center", compact ? "gap-1.5" : "gap-2.5")}>
          <span
            className={cn("rounded-full", compact ? "h-1 w-5" : "h-2 w-10")}
            style={{ background: theme.primary }}
          />
          <span
            className={cn("rounded-full", compact ? "h-2 w-4/5" : "h-3.5 w-4/5")}
            style={{ background: theme.text, opacity: 0.85 }}
          />
          <span
            className={cn("rounded-full", compact ? "h-2 w-3/5" : "h-3.5 w-3/5")}
            style={{ background: theme.text, opacity: 0.85 }}
          />
          {!compact && (
            <>
              <span className="mt-1 h-1.5 w-full rounded-full" style={{ background: theme.muted, opacity: 0.45 }} />
              <span className="h-1.5 w-4/5 rounded-full" style={{ background: theme.muted, opacity: 0.45 }} />
            </>
          )}
          <span
            className={cn(compact ? "mt-1 h-4 w-14" : "mt-2.5 h-7 w-24")}
            style={{ background: theme.primary, borderRadius: buttonRadius }}
          />
        </div>

        <div
          className="h-full w-full overflow-hidden"
          style={{
            background: `linear-gradient(140deg, ${theme.secondary}, ${theme.surface})`,
            borderRadius: theme.radius,
          }}
        >
          <img src={art[0]} alt="" loading="lazy" className="size-full object-cover" />
        </div>
      </div>

      {/* The product row underneath, which is what makes it read as a shop. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 grid",
          compact ? "grid-cols-3 gap-1.5 px-3 pb-3" : "grid-cols-4 gap-2.5 px-6 pb-5",
        )}
      >
        {(compact ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => (
          <span
            key={i}
            className="aspect-square overflow-hidden"
            style={{ background: theme.surface, borderRadius: theme.radius }}
          >
            <img src={art[(i + 1) % art.length]} alt="" loading="lazy" className="size-full object-cover" />
          </span>
        ))}
      </div>
    </div>
  );
}

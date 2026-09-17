import type { ThemeTokens } from "@/types";
import { artFor } from "@/lib/website/template-art";

/* Plain <img>: these are local SVGs, which the image optimizer passes through
   unchanged anyway, and they render a few pixels wide inside a miniature. */
/* eslint-disable @next/next/no-img-element */

/**
 * A miniature of a template, drawn from its own theme tokens.
 *
 * Shared by the first-run template chooser and the change-template dialog, so
 * the same template always looks the same wherever it is offered.
 */
export function TemplateThumbnail({ theme, category }: { theme: ThemeTokens; category?: string }) {
  // Real artwork where a picture would go, so the miniature reads as a site
  // rather than a wireframe. Without a category it falls back to flat tone.
  const art = category ? artFor(category) : null;
  return (
    <div className="flex size-full flex-col" style={{ background: theme.background }}>
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${theme.text}12` }}
      >
        {/* Window dots rather than the name: every caller prints the name
            directly beneath, and a label here only gets covered by overlays. */}
        <span className="flex shrink-0 gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1 rounded-full" style={{ background: theme.text, opacity: 0.22 }} />
          ))}
        </span>
        <span className="flex shrink-0 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-4 rounded-full" style={{ background: theme.muted, opacity: 0.5 }} />
          ))}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-2 p-3">
        <div className="flex flex-col justify-center gap-1.5">
          <span className="h-1 w-6 rounded-full" style={{ background: theme.primary }} />
          <span className="h-2 w-full rounded-full" style={{ background: theme.text, opacity: 0.85 }} />
          <span className="h-2 w-3/4 rounded-full" style={{ background: theme.text, opacity: 0.85 }} />
          <span className="mt-0.5 h-1 w-full rounded-full" style={{ background: theme.muted, opacity: 0.4 }} />
          <span
            className="mt-1.5 h-4 w-14"
            style={{ background: theme.primary, borderRadius: theme.buttonStyle === "pill" ? 999 : theme.radius }}
          />
        </div>
        <div
          className="size-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.secondary}, ${theme.surface})`,
            borderRadius: theme.radius,
          }}
        >
          {art && <img src={art[0]} alt="" className="size-full object-cover" />}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="aspect-square overflow-hidden"
            style={{ background: theme.surface, borderRadius: theme.radius }}
          >
            {art && <img src={art[(i + 1) % art.length]} alt="" className="size-full object-cover" />}
          </span>
        ))}
      </div>
    </div>
  );
}

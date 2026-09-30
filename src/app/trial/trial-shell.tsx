import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The frame both trial screens sit in.
 *
 * Deliberately outside the dashboard layout, the same way `/suspended` is —
 * that layout calls the gate that sent the visitor here, so rendering inside
 * it would loop.
 */
export function TrialShell({
  tone = "primary",
  eyebrow,
  icon,
  title,
  lede,
  children,
  wide,
}: {
  tone?: "primary" | "warning";
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  lede: string;
  children?: React.ReactNode;
  /** Roomier, for the screens that carry the checkout. */
  wide?: boolean;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-16">
      <div
        className="pointer-events-none absolute inset-0 grid-pattern opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        aria-hidden
      />

      <div className={cn("relative w-full", wide ? "max-w-xl" : "max-w-lg")}>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_30px_80px_-50px_rgb(0_0_0/0.6)] sm:p-10">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl",
                tone === "warning" ? "bg-warning/12 text-warning" : "bg-primary-muted text-primary",
              )}
            >
              {icon}
            </span>
            <p
              className={cn(
                "text-[12px] font-semibold uppercase tracking-wider",
                tone === "warning" ? "text-warning" : "text-primary",
              )}
            >
              {eyebrow}
            </p>
          </div>

          <h1 className="mt-6 text-[27px] font-semibold leading-tight tracking-[-0.03em] text-balance sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground text-pretty">{lede}</p>

          {children}
        </div>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          <Link href="/settings/billing" className="font-medium text-foreground hover:underline">
            Plans &amp; billing
          </Link>
          <span className="px-2 text-border">·</span>
          <Link href="/" className="hover:underline">
            Helabiz home
          </Link>
        </p>
      </div>
    </main>
  );
}

/** The "what you get" list shared by both screens. */
export function TrialFeatureList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[13.5px]">
          <Check className={cn("mt-0.5 size-3.5 shrink-0", muted ? "text-muted-foreground" : "text-primary")} />
          <span className={muted ? "text-muted-foreground" : undefined}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
        {/* An "H" built from a storefront awning — business plus web. */}
        <path d="M4 7.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6.5 11v6.5M17.5 11v6.5M6.5 14.2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWord && (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-foreground">
          Hela<span className="text-primary">biz</span>
        </span>
      )}
    </span>
  );
}

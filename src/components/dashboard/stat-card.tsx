import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  change,
  icon: Icon,
  href,
  tone = "default",
  invertChange,
}: {
  label: string;
  value: string;
  sublabel?: string;
  change?: number;
  icon?: LucideIcon;
  href?: string;
  tone?: "default" | "primary" | "warning";
  /** For metrics where a rise is bad (expenses), flips the colour of the delta. */
  invertChange?: boolean;
}) {
  const positive = (change ?? 0) >= 0;
  const good = invertChange ? !positive : positive;

  const body = (
    <div
      className={cn(
        "group relative h-full rounded-xl border border-border bg-card p-5 transition-all duration-200",
        href && "hover:border-primary/30 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "primary" ? "bg-primary-muted text-primary" : tone === "warning" ? "bg-warning/14 text-warning" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>

      <p className="mt-3 text-[26px] font-semibold tracking-[-0.025em] tabular-nums">{value}</p>

      <div className="mt-2 flex items-center gap-2">
        {change !== undefined && Number.isFinite(change) && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold",
              good ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change).toFixed(change >= 100 ? 0 : 1)}%
          </span>
        )}
        {sublabel && <span className="text-[12px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

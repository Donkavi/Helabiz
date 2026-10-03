import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { AccessInfo } from "@/lib/access";
import { cn } from "@/lib/utils";

/**
 * The countdown across the top of the dashboard.
 *
 * A trial shows it for the whole month, so a trial is never mistaken for a
 * plan and the day it closes is never a surprise. A paid month only shows it
 * in the last five days, because there is no trial to remind anyone of. Both
 * turn urgent five days out, at the same point they turn useful.
 *
 * A locked business never gets this far, having been redirected by the gate.
 */
export function AccessBanner({ info, planName }: { info: AccessInfo; planName: string }) {
  const showing = info.state === "trial_active" || (info.state === "plan_active" && info.isEnding);
  if (!showing) return null;

  const { daysLeft, isEnding, isTrial } = info;
  const what = isTrial ? "free trial" : `${planName} plan`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 text-[13px] lg:px-8",
        isEnding ? "border-warning/25 bg-warning/10 text-warning" : "border-border bg-primary-muted/45 text-foreground",
      )}
    >
      <span className="flex items-center gap-2 font-medium">
        {isEnding ? <Clock className="size-4 shrink-0" /> : <Sparkles className="size-4 shrink-0 text-primary" />}
        {daysLeft === 1 ? `Last day of your ${what}` : `${daysLeft} days left on your ${what}`}
      </span>

      <span className={cn("hidden sm:block", isEnding ? "text-warning/80" : "text-muted-foreground")}>
        {isTrial
          ? "Your website and dashboard close when it ends."
          : "Renew before it ends to keep your website online."}
      </span>

      <Link
        href="/settings/billing"
        className={cn(
          "ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors",
          isEnding ? "bg-warning/15 hover:bg-warning/25" : "bg-primary/10 text-primary hover:bg-primary/15",
        )}
      >
        {isTrial ? "See plans" : "Renew now"}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import type { AddonStatus } from "@/lib/addons";

/**
 * The add-ons, on the website overview.
 *
 * They are also offered while a site is being built, but that screen is gone
 * the moment the site exists — so without this an owner who already has a
 * website has nowhere to find them except billing, which is not where anyone
 * looks for a website feature.
 */
export function WebsiteAddons({ statuses, trackUrl }: { statuses: AddonStatus[]; trackUrl: string }) {
  const off = statuses.filter((status) => !status.active);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Website add-ons</CardTitle>
        {off.length > 0 && (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/settings/billing?addons=${off.map((s) => s.addon.id).join(",")}#checkout`}>
              Add them
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-3 md:grid-cols-3">
          {statuses.map(({ addon, active, daysLeft, lapsed }) => (
            <div
              key={addon.id}
              className={cn(
                "rounded-xl border p-4",
                active ? "border-primary/40 bg-primary-muted/20" : "border-border bg-background",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {active ? <Check className="size-4" /> : <Plus className="size-4" />}
                </span>
                {active ? (
                  <Badge variant={daysLeft <= 5 ? "warning" : "success"}>
                    {daysLeft === 1 ? "Last day" : `${daysLeft} days left`}
                  </Badge>
                ) : lapsed ? (
                  <Badge variant="destructive">Ended</Badge>
                ) : (
                  <Badge variant="muted">{formatCurrency(addon.price, { decimals: false })}/mo</Badge>
                )}
              </div>

              <p className="mt-3 text-[14px] font-semibold">{addon.name}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{addon.tagline}</p>

              {/* The tracking page is no use to anyone who cannot find it, so
                  the owner is shown the address to put on receipts. */}
              {active && addon.id === "order_tracking" && (
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 break-all text-[12px] font-medium text-primary hover:underline"
                >
                  <ExternalLink className="size-3 shrink-0" />
                  {trackUrl.replace(/^https?:\/\//, "")}
                </a>
              )}

              {!active && (
                <Link
                  href={`/settings/billing?addons=${addon.id}#checkout`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
                >
                  {lapsed ? "Switch back on" : "Add it"}
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

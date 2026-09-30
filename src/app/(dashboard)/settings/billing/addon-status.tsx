import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { AddonStatus } from "@/lib/addons";

/**
 * Where each website add-on stands.
 *
 * Read-only, like the plan grid: an add-on is switched on by depositing for
 * it in the checkout above, so nothing here can grant one without a payment.
 */
export function AddonStatusCard({ statuses }: { statuses: AddonStatus[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Website add-ons</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {statuses.map(({ addon, active, endsAt, daysLeft, lapsed }) => (
            <li
              key={addon.id}
              className={cn(
                "flex flex-wrap items-start gap-3 rounded-2xl border p-4",
                active ? "border-primary/40 bg-primary-muted/20" : "border-border bg-background",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  active ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {active ? <Check className="size-4" /> : <Plus className="size-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium">{addon.name}</span>
                  {active ? (
                    <Badge variant={daysLeft <= 5 ? "warning" : "success"}>
                      {daysLeft === 1 ? "Last day" : `${daysLeft} days left`}
                    </Badge>
                  ) : lapsed ? (
                    <Badge variant="destructive">Ended</Badge>
                  ) : (
                    <Badge variant="muted">{formatCurrency(addon.price, { decimals: false })}/month</Badge>
                  )}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{addon.description}</p>
                {endsAt && (
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    {active ? "Renews" : "Ended"} {formatDate(endsAt.toISOString(), "long")}
                  </p>
                )}
              </div>

              {!active && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/settings/billing?addons=${addon.id}#checkout`} scroll>
                    {lapsed ? "Switch back on" : "Add it"}
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

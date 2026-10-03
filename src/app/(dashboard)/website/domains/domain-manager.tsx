"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SITE_DOMAIN } from "@/lib/website/urls";
import type { ActionState } from "@/lib/validations/errors";
import { addDomainAction, removeDomainAction } from "../actions";

type DomainRow = {
  id: string;
  hostname: string;
  status: string;
  verificationToken: string;
  createdAt: string;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "destructive"> = {
  active: "success",
  verifying: "warning",
  pending: "muted",
  failed: "destructive",
};

export function DomainManager({
  domains,
  canAdd,
  target,
}: {
  domains: DomainRow[];
  canAdd: boolean;
  target: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(addDomainAction, null);
  const [removing, startRemove] = React.useTransition();

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Domain added — now add the DNS records below.");
      router.refresh();
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy — select the text instead");
    }
  };

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your own domain</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <form action={action} className="flex flex-wrap items-end gap-2" data-tour="website-domains-add">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="hostname">Domain name</Label>
            <Input
              id="hostname"
              name="hostname"
              placeholder="kavifashion.lk"
              disabled={!canAdd}
              aria-invalid={!!errors.hostname}
              className="font-mono"
            />
            {errors.hostname && <p className="text-[12.5px] text-destructive">{errors.hostname}</p>}
          </div>
          <Button type="submit" loading={pending} disabled={!canAdd}>
            <Plus className="size-4" />
            Add domain
          </Button>
        </form>

        {domains.length === 0 ? (
          <EmptyState
            compact
            icon={AtSign}
            title="No custom domain yet"
            description={
              canAdd
                ? "Add a domain you already own and we will show you exactly which DNS records to create."
                : "Upgrade to the Business plan to connect a domain you own."
            }
          />
        ) : (
          <ul className="space-y-3" data-tour="website-domains-list">
            {domains.map((domain) => (
              <li key={domain.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[14px] font-medium">{domain.hostname}</span>
                    <span className="block text-[12.5px] text-muted-foreground">
                      {domain.status === "active"
                        ? "Serving your website"
                        : "Waiting for DNS records to be found"}
                    </span>
                  </span>
                  <Badge variant={STATUS_VARIANT[domain.status] ?? "muted"} className="capitalize">
                    {domain.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${domain.hostname}`}
                    disabled={removing}
                    onClick={() =>
                      startRemove(async () => {
                        await removeDomainAction(domain.id);
                        toast.success("Domain removed");
                        router.refresh();
                      })
                    }
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>

                {domain.status !== "active" && (
                  <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Add these at your registrar
                    </p>
                    <DnsRow type="CNAME" name={domain.hostname.split(".")[0] || "@"} value={`sites.${SITE_DOMAIN}`} onCopy={copy} />
                    <DnsRow type="TXT" name="_helabiz" value={domain.verificationToken} onCopy={copy} />
                    <p className="pt-1 text-[12px] text-muted-foreground">
                      Your website will keep working at {target.replace(/^https?:\/\//, "")} the whole time.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DnsRow({
  type,
  name,
  value,
  onCopy,
}: {
  type: string;
  name: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-[12.5px]">
      <span className="w-14 shrink-0 font-semibold">{type}</span>
      <span className="w-24 shrink-0 truncate font-mono text-muted-foreground">{name}</span>
      <span className="min-w-0 flex-1 truncate font-mono">{value}</span>
      <Button size="icon-xs" variant="ghost" onClick={() => onCopy(value)} aria-label={`Copy ${type} value`}>
        <Copy />
      </Button>
    </div>
  );
}

import { requireSuperAdmin } from "@/lib/permissions/admin";
import { listAdminAudit } from "@/services/admin-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Audit log" };

/** Actions that changed something, coloured so they stand out from the rest. */
const SERIOUS = new Set(["business.suspend", "user.promote", "user.demote"]);

export default async function AdminAuditPage() {
  await requireSuperAdmin();
  const entries = await listAdminAudit(150);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Everything administrators have done across the platform, newest first."
      />

      <Card>
        <CardContent className="py-5">
          {entries.length === 0 ? (
            <EmptyState
              compact
              title="Nothing yet"
              description="Plan changes, suspensions and access grants are recorded here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
                  <Badge variant={SERIOUS.has(entry.action) ? "warning" : "muted"}>{entry.action}</Badge>
                  <span className="text-[13.5px]">
                    {entry.business ?? <span className="text-muted-foreground">platform</span>}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground">{describe(entry.meta)}</span>
                  <span className="ml-auto text-[12px] text-muted-foreground">
                    {entry.admin} · {relativeTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Turns the stored meta into a short phrase, skipping the bookkeeping fields. */
function describe(meta: Record<string, unknown>) {
  const parts: string[] = [];
  if (meta.from && meta.to) parts.push(`${meta.from} → ${meta.to}`);
  if (typeof meta.reason === "string" && meta.reason) parts.push(`“${meta.reason}”`);
  return parts.join(" · ");
}

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { listSupportThreads } from "@/services/support-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatNumber, relativeTime, truncate } from "@/lib/utils";
import { RequestStatusBadge } from "../requests/request-status-badge";

export const metadata = { title: "Support" };

const LIMIT = 100;

export default async function AdminSupportPage() {
  await requireSuperAdmin();
  const threads = await listSupportThreads(LIMIT);
  const waiting = threads.filter((thread) => thread.unread > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description={
          waiting
            ? `${formatNumber(waiting)} ${waiting === 1 ? "conversation is" : "conversations are"} waiting on a reply.`
            : "Every conversation with a business. Nothing is waiting on a reply."
        }
      />

      <Card>
        <CardContent className="py-5">
          {threads.length === 0 ? (
            <EmptyState
              compact
              icon={MessagesSquare}
              title="No conversations yet"
              description="When a business messages the team from its dashboard, the conversation appears here."
            />
          ) : (
            <>
              <ul className="divide-y divide-border">
                {threads.map((thread) => (
                  <li key={thread.businessId}>
                    <Link
                      href={`/admin/support/${thread.businessId}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-[13.5px]", thread.unread ? "font-semibold" : "font-medium")}>
                            {thread.businessName}
                          </span>
                          {thread.openRequest && <RequestStatusBadge status={thread.openRequest} />}
                        </span>
                        <span
                          className={cn(
                            "block truncate text-[12.5px]",
                            thread.unread ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <span className="text-muted-foreground">
                            {thread.lastMessage.from === "helabiz" ? "Us: " : "Them: "}
                          </span>
                          {truncate(thread.lastMessage.body.replace(/\s+/g, " "), 140)}
                        </span>
                      </span>
                      {thread.unread > 0 && (
                        <Badge className="rounded-full tabular-nums">
                          {thread.unread > 99 ? "99+" : thread.unread} new
                        </Badge>
                      )}
                      <span className="hidden w-20 text-right text-[12px] text-muted-foreground sm:block">
                        {relativeTime(thread.lastMessage.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {threads.length >= LIMIT && (
                <p className="pt-3 text-[12px] text-muted-foreground">
                  Showing the {LIMIT} conversations that need attention first, then the most recent.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

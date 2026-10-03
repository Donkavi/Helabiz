import Link from "next/link";
import { ArrowRight, Building2, Globe, Inbox, MessagesSquare, ShoppingCart, Users } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { platformStats, listBusinesses } from "@/services/admin-service";
import { listWebsiteRequests, openRequestCount, unreadForHelabiz } from "@/services/support-service";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatNumber, relativeTime } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireSuperAdmin();
  const [stats, recent, openRequests, newRequests, unreadMessages] = await Promise.all([
    platformStats(),
    listBusinesses({ page: 1 }),
    openRequestCount(),
    listWebsiteRequests({ status: "new", perPage: 1 }),
    unreadForHelabiz(),
  ]);

  const peak = Math.max(1, ...stats.signupsByMonth.map((m) => m.businesses));

  return (
    <div className="space-y-7">
      <PageHeader title="Platform overview" description="Every business, user and order on Helabiz." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Businesses"
          value={formatNumber(stats.businesses.total)}
          sublabel={`${stats.businesses.newThisMonth} new this month`}
          icon={Building2}
          tone="primary"
          href="/admin/businesses"
        />
        <StatCard
          label="Users"
          value={formatNumber(stats.users.total)}
          sublabel={`${stats.users.newThisMonth} new this month`}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="Published sites"
          value={formatNumber(stats.websites.published)}
          sublabel={`of ${formatNumber(stats.websites.total)} created`}
          icon={Globe}
        />
        <StatCard
          label="Orders this month"
          value={formatNumber(stats.orders.thisMonth)}
          sublabel={`${formatCurrency(stats.orders.revenueThisMonth, { compact: true, decimals: false })} in value`}
          icon={ShoppingCart}
        />
      </div>

      {/* Work waiting on the Helabiz team */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Open website requests"
          value={formatNumber(openRequests)}
          sublabel={newRequests.total ? `${formatNumber(newRequests.total)} new, waiting for a call` : "None waiting for a call"}
          icon={Inbox}
          tone={newRequests.total ? "warning" : "default"}
          href="/admin/requests"
        />
        <StatCard
          label="Unread support messages"
          value={formatNumber(unreadMessages)}
          sublabel={unreadMessages ? "Businesses waiting on a reply" : "All caught up"}
          icon={MessagesSquare}
          tone={unreadMessages ? "warning" : "default"}
          href="/admin/support"
        />
      </div>

      {stats.businesses.suspended > 0 && (
        <Link
          href="/admin/businesses?status=suspended"
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] transition-colors hover:bg-destructive/10"
        >
          <span className="font-semibold text-destructive">
            {stats.businesses.suspended} suspended{" "}
            {stats.businesses.suspended === 1 ? "business" : "businesses"}
          </span>
          <span className="text-muted-foreground">— their dashboards and public sites are closed.</span>
          <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
        </Link>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        {/* Plan mix */}
        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {stats.plans.map(({ plan, count, share }) => (
              <div key={plan.id}>
                <div className="flex items-baseline justify-between text-[13.5px]">
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(count)} · {share.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={plan.id === "free" ? "h-full rounded-full bg-muted-foreground/40" : "h-full rounded-full bg-primary"}
                    style={{ width: `${Math.max(share, 1)}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-[12.5px] text-muted-foreground">
              {formatNumber(stats.plans.filter((p) => p.plan.id !== "free").reduce((sum, p) => sum + p.count, 0))} paying
              of {formatNumber(stats.businesses.total)} total.
            </p>
          </CardContent>
        </Card>

        {/* Signups */}
        <Card>
          <CardHeader>
            <CardTitle>New businesses</CardTitle>
            <CardAction>
              <Badge variant="soft">Last 12 months</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex h-40 items-end gap-1.5">
              {stats.signupsByMonth.map((month) => (
                <div key={month.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${(month.businesses / peak) * 100}%`, minHeight: month.businesses ? 4 : 1 }}
                    title={`${month.month}: ${month.businesses}`}
                  />
                  <span className="text-[10px] tabular-nums text-muted-foreground">{month.month.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newest businesses */}
      <Card>
        <CardHeader className="flex-row items-center">
          <CardTitle>Newest businesses</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/businesses">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y divide-border">
            {recent.rows.slice(0, 8).map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/businesses/${row.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{row.name}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">{row.ownerEmail}</span>
                  </span>
                  <Badge variant={row.plan === "free" ? "muted" : "default"}>{row.plan}</Badge>
                  {row.status === "suspended" && <Badge variant="destructive">suspended</Badge>}
                  <span className="hidden w-24 text-right text-[12px] text-muted-foreground sm:block">
                    {relativeTime(row.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

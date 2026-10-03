import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, MessagesSquare } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { businessDetail } from "@/services/admin-service";
import { latestWebsiteRequest } from "@/services/support-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { siteUrlFor } from "@/lib/website/urls";
import { formatCurrency, formatNumber, relativeTime } from "@/lib/utils";
import { BusinessControls } from "./business-controls";
import { BusinessEditor } from "./business-editor";
import { RequestStatusBadge } from "../../requests/request-status-badge";
import { SupportAccess } from "../../support/support-access";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await businessDetail(id);
  return { title: business?.name ?? "Business" };
}

export default async function AdminBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  const { id } = await params;
  const business = await businessDetail(id);
  if (!business) notFound();
  const request = await latestWebsiteRequest(business.id);

  // Helabiz team members let in to build or fix the site.
  const supportMembers = business.members.filter((member) => member.support);
  const mySupport = supportMembers.some((member) => member.userId === admin.id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/businesses">
            <ArrowLeft className="size-3.5" />
            All businesses
          </Link>
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{business.name}</h1>
          <Badge variant={business.plan === "free" ? "muted" : "default"}>{business.plan}</Badge>
          {business.status === "suspended" && <Badge variant="destructive">suspended</Badge>}
        </div>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          <span className="font-mono">/{business.slug}</span>
          {business.city && ` · ${business.city}`} · joined {relativeTime(business.createdAt)}
        </p>

        <div className="mt-4">
          <BusinessEditor
            businessId={business.id}
            counts={business.counts}
            initial={{
              name: business.name,
              slug: business.slug,
              type: business.type ?? "",
              phone: business.phone ?? "",
              email: business.email ?? "",
              address: business.address ?? "",
              city: business.city ?? "",
              district: business.district ?? "",
            }}
          />
        </div>
      </div>

      {business.status === "suspended" && business.suspendedReason && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px]">
          <span className="font-semibold text-destructive">Suspension reason: </span>
          {business.suspendedReason}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Figure label="Orders" value={formatNumber(business.counts.orders)} />
        <Figure label="Revenue" value={formatCurrency(business.counts.revenue, { compact: true, decimals: false })} />
        <Figure label="Products" value={formatNumber(business.counts.products)} />
        <Figure label="Customers" value={formatNumber(business.counts.customers)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* Owner and team */}
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {business.owner && (
                <div className="mb-4 rounded-lg border border-border p-3.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Owner</p>
                  <p className="mt-1 text-[14px] font-medium">{business.owner.name}</p>
                  <p className="text-[13px] text-muted-foreground">{business.owner.email}</p>
                </div>
              )}
              <ul className="divide-y divide-border">
                {business.members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px]">{member.name}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{member.email}</span>
                    </span>
                    {member.support ? (
                      <Badge variant="soft">Helabiz support</Badge>
                    ) : (
                      <Badge variant="muted">{member.role}</Badge>
                    )}
                    {member.status !== "active" && <Badge variant="destructive">{member.status}</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {business.recentOrders.length === 0 ? (
                <p className="py-4 text-[13px] text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {business.recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center gap-3 py-2.5">
                      <span className="font-mono text-[13px]">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status ?? "pending"} />
                      <span className="ml-auto tabular-nums text-[13px]">
                        {formatCurrency(order.total, { decimals: false })}
                      </span>
                      <span className="w-20 text-right text-[12px] text-muted-foreground">
                        {relativeTime(order.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Management */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <BusinessControls
                businessId={business.id}
                name={business.name}
                plan={business.plan}
                status={business.status}
              />
            </CardContent>
          </Card>

          {/* Help from the Helabiz team */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[13.5px]">
              <div className="flex flex-wrap items-center gap-2">
                {request && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/requests/${request.id}`}>
                      <FileText className="size-3.5" />
                      {request.status === "done" || request.status === "cancelled" ? "Last request" : "Website request"}
                      <RequestStatusBadge status={request.status} />
                    </Link>
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/support/${business.id}`}>
                    <MessagesSquare className="size-3.5" />
                    Chat
                  </Link>
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-[13px] font-medium">Support access</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  {supportMembers.length
                    ? `${supportMembers
                        .map((member) => (member.userId === admin.id ? "You" : member.name))
                        .join(", ")} ${supportMembers.length === 1 && !mySupport ? "is" : "are"} in this business as “Helabiz support”. The owner can see this.`
                    : "Nobody from the team is in this business. Opening it adds you as “Helabiz support”, which the owner can see."}
                </p>
                <div className="mt-3">
                  <SupportAccess
                    businessId={business.id}
                    hasAccess={mySupport}
                    othersHaveAccess={supportMembers.some((member) => member.userId !== admin.id)}
                    allowGrant
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Website */}
          <Card>
            <CardHeader>
              <CardTitle>Website</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-[13.5px]">
              {business.website ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant={business.website.status === "published" ? "success" : "muted"}>
                      {business.website.status}
                    </Badge>
                    {business.website.publishedAt && (
                      <span className="text-[12.5px] text-muted-foreground">
                        {relativeTime(business.website.publishedAt)}
                      </span>
                    )}
                  </div>
                  {business.website.status === "published" && business.status === "active" && (
                    <a
                      href={siteUrlFor(business.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12.5px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      {business.website.subdomain}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No website created yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0 text-[13px]">
              <Row label="Type" value={business.type} />
              <Row label="Phone" value={business.phone} />
              <Row label="Email" value={business.email} />
              <Row label="District" value={business.district} />
              <Row label="Subscription" value={business.subscription?.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right">{value}</span>
    </p>
  );
}

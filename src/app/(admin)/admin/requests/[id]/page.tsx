import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { getWebsiteRequestForAdmin } from "@/services/support-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_PAGE_LABELS } from "@/lib/website-request";
import { whatsappLink } from "@/lib/whatsapp";
import { siteUrlFor } from "@/lib/website/urls";
import { formatDate, relativeTime } from "@/lib/utils";
import { RequestStatusBadge } from "../request-status-badge";
import { RequestControls } from "./request-controls";

export const metadata = { title: "Website request" };

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  const { id } = await params;
  const request = await getWebsiteRequestForAdmin(id, admin.id);
  if (!request) notFound();

  const firstName = request.requestedBy.name.split(" ")[0] || "there";
  const whatsappMessage = `Hello ${firstName}, this is the Helabiz team about the website you asked us to build for ${request.business.name}.`;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/requests">
            <ArrowLeft className="size-3.5" />
            All requests
          </Link>
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{request.business.name}</h1>
          <RequestStatusBadge status={request.status} />
          <Badge variant={request.business.plan === "free" ? "muted" : "default"}>{request.business.plan}</Badge>
        </div>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Website request · received {relativeTime(request.createdAt)} ({formatDate(request.createdAt, "time")})
          {request.handledBy && ` · handled by ${request.handledBy.name}`}
          {request.closedAt && ` · closed ${relativeTime(request.closedAt)}`}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/businesses/${request.business.id}`}>
              <Building2 className="size-3.5" />
              Business
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/support/${request.business.id}`}>
              <MessagesSquare className="size-3.5" />
              Chat with them
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* What they filled in */}
          <Card>
            <CardHeader>
              <CardTitle>What they asked for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0 text-[13.5px]">
              <Field label="What they sell">{request.about}</Field>

              <Field label="Pages">
                {request.pages.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {request.pages.map((page) => (
                      <Badge key={page} variant="outline">
                        {REQUEST_PAGE_LABELS[page].en}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  <span className="text-muted-foreground">None chosen — the team decides.</span>
                )}
              </Field>

              {request.style && <Field label="Style">{request.style}</Field>}
              {request.links && <Field label="Their pages and links">{request.links}</Field>}
              {request.notes && <Field label="Anything else">{request.notes}</Field>}
            </CardContent>
          </Card>

          {/* How to reach them */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[13.5px]">
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[15px] font-medium">{request.phone}</span>
                  {request.whatsapp && <Badge variant="success">WhatsApp</Badge>}
                </p>
                {request.bestTime && (
                  <p className="mt-1 text-[12.5px] text-muted-foreground">Best time to call: {request.bestTime}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <a href={`tel:${request.phone}`}>
                      <Phone className="size-3.5" />
                      Call
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappLink(request.phone, whatsappMessage)} target="_blank" rel="noreferrer">
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-[13px]">
                <Row label="Asked by" value={request.requestedBy.name} />
                {request.requestedBy.email && (
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${request.requestedBy.email}`} className="truncate text-right hover:underline">
                      {request.requestedBy.email}
                    </a>
                  </p>
                )}
                {request.business.phone && request.business.phone !== request.phone && (
                  <Row label="Business phone" value={request.business.phone} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Handle request</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RequestControls
                requestId={request.id}
                businessId={request.business.id}
                status={request.status}
                adminNotes={request.adminNotes ?? ""}
                supportAccess={request.supportAccess}
              />
            </CardContent>
          </Card>

          {/* Website */}
          <Card>
            <CardHeader>
              <CardTitle>Website</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-[13.5px]">
              {request.website ? (
                <>
                  <Badge variant={request.website.status === "published" ? "success" : "muted"}>
                    {request.website.status}
                  </Badge>
                  {request.website.status === "published" && request.business.slug && (
                    <a
                      href={siteUrlFor(request.business.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1.5 font-mono text-[12.5px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      {request.website.subdomain}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No website created yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 whitespace-pre-line break-words">{children}</div>
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

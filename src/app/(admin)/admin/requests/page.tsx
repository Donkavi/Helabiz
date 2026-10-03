import Link from "next/link";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { listWebsiteRequests } from "@/services/support-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REQUEST_PAGE_LABELS } from "@/lib/website-request";
import { whatsappLink } from "@/lib/whatsapp";
import { formatNumber, relativeTime, truncate } from "@/lib/utils";
import { Pagination } from "../pagination";
import { RequestStatusBadge } from "./request-status-badge";

export const metadata = { title: "Website requests" };

const STATUSES = ["open", "new", "contacted", "building", "done", "cancelled", "all"] as const;
type StatusFilter = (typeof STATUSES)[number];

const STATUS_LABEL: Record<StatusFilter, string> = {
  open: "Open",
  new: "New",
  contacted: "Contacted",
  building: "Building",
  done: "Done",
  cancelled: "Cancelled",
  all: "All",
};

const PER_PAGE = 25;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  // Everything still waiting on the team is the job, so that opens by default.
  const status: StatusFilter = STATUSES.find((option) => option === params.status) ?? "open";
  const page = Math.max(1, Number(params.page) || 1);
  const { requests, total } = await listWebsiteRequests({
    status: status === "all" ? undefined : status,
    page,
    perPage: PER_PAGE,
  });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const linkTo = (next: StatusFilter) => (next === "open" ? "/admin/requests" : `/admin/requests?status=${next}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website requests"
        description={`${formatNumber(total)} ${status === "all" ? "in total" : STATUS_LABEL[status].toLowerCase()}. Businesses that asked the Helabiz team to build their website.`}
      />

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((option) => (
              <Link
                key={option}
                href={linkTo(option)}
                className={
                  "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors " +
                  (option === status
                    ? "border-primary/50 bg-primary-muted text-primary"
                    : "border-border text-muted-foreground hover:bg-accent")
                }
              >
                {STATUS_LABEL[option]}
              </Link>
            ))}
          </div>

          {requests.length === 0 ? (
            <EmptyState
              compact
              title="No requests here"
              description="A request appears the moment a business asks the team to build its website."
            />
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>What they sell</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Link href={`/admin/businesses/${request.businessId}`} className="font-medium hover:underline">
                            {request.businessName}
                          </Link>
                          <p className="text-[12px] text-muted-foreground">on {request.businessPlan}</p>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <a href={`tel:${request.phone}`} className="font-mono text-[12.5px] hover:underline">
                              {request.phone}
                            </a>
                            {request.whatsapp && (
                              <Badge variant="success" asChild>
                                <a
                                  href={whatsappLink(request.phone, "Hello, this is the Helabiz team about your website request.")}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  WhatsApp
                                </a>
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <Link
                            href={`/admin/requests/${request.id}`}
                            className="block truncate text-[13px] hover:underline"
                            title={request.about}
                          >
                            {truncate(request.about, 80)}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[220px] text-[12.5px] text-muted-foreground">
                          <span className="block truncate">
                            {request.pages.length
                              ? request.pages.map((item) => REQUEST_PAGE_LABELS[item].en).join(", ")
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/requests/${request.id}`}>
                            <RequestStatusBadge status={request.status} />
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-[12.5px] text-muted-foreground">
                          <Link href={`/admin/requests/${request.id}`} className="hover:underline">
                            {relativeTime(request.createdAt)}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination page={page} pages={pages} basePath={linkTo(status)} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

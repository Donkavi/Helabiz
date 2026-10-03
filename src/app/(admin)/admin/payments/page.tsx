import Link from "next/link";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { listPayments } from "@/services/admin-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, relativeTime } from "@/lib/utils";
import { storageBackend, viewableUrl } from "@/lib/storage";
import { ADDONS, type AddonId } from "@/lib/addons";
import { mailBackend, shopMailDomain } from "@/lib/mailer";
import { Pagination } from "../pagination";
import { PaymentReview } from "./payment-review";

export const metadata = { title: "Payments" };

const STATUSES = ["review", "pending", "succeeded", "failed", "all"];

const STATUS_LABEL: Record<string, string> = {
  review: "Awaiting review",
  pending: "No slip yet",
  succeeded: "Approved",
  failed: "Rejected",
  all: "All",
};

const STATUS_VARIANT: Record<string, "info" | "warning" | "success" | "destructive" | "muted"> = {
  review: "info",
  pending: "warning",
  succeeded: "success",
  failed: "destructive",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  // The queue is the job, so that is what opens by default.
  const status = params.status ?? "review";
  const { rows, total, page, pages } = await listPayments({ status, page: Number(params.page) || 1 });

  const linkTo = (next: string) => (next === "review" ? "/admin/payments" : `/admin/payments?status=${next}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={`${formatNumber(total)} ${STATUS_LABEL[status]?.toLowerCase() ?? status}. Slips are stored in ${
          storageBackend() === "cloudinary" ? "Cloudinary" : "local uploads"
        }. Order email is ${mailBackend() === "smtp" ? "configured" : "not configured"}${
          shopMailDomain() ? `, and shops send from @${shopMailDomain()}` : ", and shops send from MAIL_FROM"
        }.`}
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
                {STATUS_LABEL[option] ?? option}
              </Link>
            ))}
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Nothing to review"
              description="Deposit slips appear here the moment a business sends one."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link href={`/admin/businesses/${row.businessId}`} className="font-medium hover:underline">
                          {row.businessName}
                        </Link>
                        <p className="text-[12px] text-muted-foreground">now on {row.currentPlan}</p>
                      </TableCell>
                      <TableCell className="font-mono text-[12.5px]">{row.reference}</TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {row.plan && <Badge variant="outline">{row.plan}</Badge>}
                          {row.addons.map((id) => (
                            <Badge key={id} variant="soft">
                              {ADDONS[id as AddonId]?.name ?? id}
                            </Badge>
                          ))}
                          {!row.plan && row.addons.length === 0 ? "—" : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(row.amount, { decimals: false })}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {row.slipUploadedAt ? relativeTime(row.slipUploadedAt) : relativeTime(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {row.status === "review" || row.status === "pending" ? (
                            <PaymentReview
                              paymentId={row.id}
                              reference={row.reference}
                              businessName={row.businessName}
                              slipUrl={row.slipUrl ? viewableUrl(row.slipUrl) : undefined}
                            />
                          ) : (
                            <span className="flex items-center gap-2">
                              <Badge variant={STATUS_VARIANT[row.status] ?? "muted"}>
                                {STATUS_LABEL[row.status] ?? row.status}
                              </Badge>
                              {row.reviewNote && (
                                <span className="max-w-[220px] truncate text-[12px] text-muted-foreground">
                                  {row.reviewNote}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination page={page} pages={pages} basePath={linkTo(status)} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

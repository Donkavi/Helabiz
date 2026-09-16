import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Invoice } from "@/models/Invoice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import { UpgradeNotice } from "@/components/dashboard/upgrade-notice";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "info" | "destructive"> = {
  paid: "success",
  sent: "info",
  draft: "muted",
  overdue: "destructive",
  void: "muted",
};

export default async function InvoicesPage() {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const plan = getPlan(business.plan);
  const invoices = serialize(await Invoice.find({ businessId }).sort({ createdAt: -1 }).limit(200).lean());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Professional invoices generated from your orders, ready to print or send."
      />

      {!plan.limits.invoices && (
        <UpgradeNotice
          title="Invoices are a Starter feature"
          description="Upgrade to generate professional invoices from any order, complete with your business details."
        />
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Open any order and choose 'Create invoice' to generate one. It picks up your business details and the order's items automatically."
          action={
            <Button asChild>
              <Link href="/orders">Go to orders</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={String(invoice._id)}>
                  <TableCell>
                    <Link href={`/invoices/${invoice._id}`} className="font-mono text-[13px] font-medium hover:text-primary">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13.5px]">{invoice.customer?.name ?? "—"}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {formatDate(invoice.issueDate as unknown as string)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[invoice.status ?? "draft"]}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                    {formatCurrency(invoice.total ?? 0, { decimals: false })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

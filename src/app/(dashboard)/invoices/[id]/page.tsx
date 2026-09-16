import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Invoice } from "@/models/Invoice";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceToolbar } from "./invoice-toolbar";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { business, businessId } = await requireBusiness();
  const { id } = await params;
  await connectDB();

  const invoice = await Invoice.findOne({ _id: id, businessId }).lean();
  if (!invoice) notFound();
  const plain = serialize(invoice);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/invoices" aria-label="Back to invoices">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono text-[20px] font-semibold">{plain.invoiceNumber}</h1>
            <p className="text-[13px] text-muted-foreground">
              Issued {formatDate(plain.issueDate as unknown as string, "long")}
            </p>
          </div>
        </div>
        <InvoiceToolbar invoiceId={String(plain._id)} status={plain.status ?? "draft"} orderId={plain.orderId ? String(plain.orderId) : undefined} />
      </div>

      {/* The printable document. `print:` utilities strip the app chrome. */}
      <article className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-card p-8 text-foreground shadow-xs sm:p-12 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo} alt="" className="size-12 rounded-lg object-contain" />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-[15px] font-bold text-primary-foreground">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <h2 className="text-[17px] font-semibold">{business.name}</h2>
              <div className="mt-1 space-y-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {business.address && <p>{business.address}</p>}
                {(business.city || business.district) && (
                  <p>{[business.city, business.district].filter(Boolean).join(", ")}</p>
                )}
                {business.phone && <p>{business.phone}</p>}
                {business.email && <p>{business.email}</p>}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Invoice</p>
            <p className="mt-1 font-mono text-[18px] font-semibold">{plain.invoiceNumber}</p>
            <div className="mt-3 space-y-0.5 text-[12.5px] text-muted-foreground">
              <p>Issued: {formatDate(plain.issueDate as unknown as string)}</p>
              {plain.dueDate && <p>Due: {formatDate(plain.dueDate as unknown as string)}</p>}
            </div>
            <p
              className={`mt-3 inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                plain.status === "paid"
                  ? "bg-success/12 text-success"
                  : plain.status === "overdue"
                    ? "bg-destructive/12 text-destructive"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {plain.status}
            </p>
          </div>
        </header>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Billed to</p>
          <p className="mt-2 text-[14.5px] font-semibold">{plain.customer?.name}</p>
          <div className="mt-1 space-y-0.5 text-[12.5px] text-muted-foreground">
            {plain.customer?.address && <p>{plain.customer.address}</p>}
            {plain.customer?.phone && <p>{plain.customer.phone}</p>}
            {plain.customer?.email && <p>{plain.customer.email}</p>}
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Item
              </th>
              <th className="py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Qty
              </th>
              <th className="py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </th>
              <th className="py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {(plain.items ?? []).map((item, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                <td className="py-3 pr-4">{item.name}</td>
                <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrency(item.price ?? 0, { decimals: false })}</td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {formatCurrency(item.total ?? 0, { decimals: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-[13.5px]">
            <Row label="Subtotal" value={formatCurrency(plain.subtotal ?? 0, { decimals: false })} />
            {(plain.discount ?? 0) > 0 && (
              <Row label="Discount" value={`− ${formatCurrency(plain.discount ?? 0, { decimals: false })}`} />
            )}
            {(plain.deliveryFee ?? 0) > 0 && (
              <Row label="Delivery" value={formatCurrency(plain.deliveryFee ?? 0, { decimals: false })} />
            )}
            <div className="flex items-center justify-between border-t border-border pt-2.5 text-[16px] font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(plain.total ?? 0, { decimals: false })}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-[12px] leading-relaxed text-muted-foreground">
          {plain.notes && <p className="mb-2 whitespace-pre-line">{plain.notes}</p>}
          <p>Thank you for your business.</p>
        </footer>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

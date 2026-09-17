import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff, MapPin, Phone, StickyNote } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Invoice } from "@/models/Invoice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/dashboard/order-status-badge";
import { getLang } from "@/lib/i18n/server";
import { dashboardCopy } from "@/lib/i18n/dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { OrderActions } from "./order-actions";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { business, businessId } = await requireBusiness();
  const { id } = await params;
  await connectDB();

  const order = await Order.findOne({ _id: id, businessId }).lean();
  if (!order) notFound();

  const invoice = await Invoice.findOne({ businessId, orderId: id }).select("_id invoiceNumber").lean();
  const t = dashboardCopy(await getLang());
  const plain = serialize(order);

  const message = buildOrderMessage(
    {
      orderNumber: plain.orderNumber,
      customer: plain.customer,
      items: (plain.items ?? []).map((i) => ({
        name: i.name,
        variantName: i.variantName,
        quantity: i.quantity,
        total: i.total,
      })),
      subtotal: plain.subtotal ?? 0,
      discount: plain.discount ?? 0,
      deliveryFee: plain.deliveryFee ?? 0,
      total: plain.total ?? 0,
    },
    business.name,
  );

  const waHref = plain.customer?.phone ? whatsappLink(plain.customer.phone, message) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/orders" aria-label="Back to orders">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-[22px] font-semibold tracking-[-0.02em]">{plain.orderNumber}</h1>
              <OrderStatusBadge status={plain.status ?? "pending"} />
              <PaymentStatusBadge status={plain.paymentStatus ?? "unpaid"} />
              <Badge variant={plain.source === "website" ? "soft" : "muted"}>
                {t.enums.orderSource[plain.source ?? "manual"]}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Placed {formatDate(plain.createdAt as unknown as string, "time")}
            </p>
          </div>
        </div>

        <OrderActions
          orderId={String(plain._id)}
          status={plain.status ?? "pending"}
          paymentStatus={plain.paymentStatus ?? "unpaid"}
          whatsappHref={waHref}
          message={message}
          invoiceId={invoice ? String(invoice._id) : undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="divide-y divide-border">
                {(plain.items ?? []).map((item, index) => (
                  <li key={index} className="flex items-center gap-3 py-3">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageOff className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium">
                        {item.name}
                        {item.variantName && <span className="text-muted-foreground"> · {item.variantName}</span>}
                      </p>
                      <p className="text-[12.5px] text-muted-foreground">
                        {formatCurrency(item.price, { decimals: false })} × {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-[13.5px] font-semibold tabular-nums">
                      {formatCurrency(item.total, { decimals: false })}
                    </p>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <div className="space-y-2 text-[13.5px]">
                <SummaryRow label="Subtotal" value={formatCurrency(plain.subtotal ?? 0, { decimals: false })} />
                {(plain.discount ?? 0) > 0 && (
                  <SummaryRow label="Discount" value={`− ${formatCurrency(plain.discount ?? 0, { decimals: false })}`} />
                )}
                {(plain.deliveryFee ?? 0) > 0 && (
                  <SummaryRow label="Delivery" value={formatCurrency(plain.deliveryFee ?? 0, { decimals: false })} />
                )}
                <Separator />
                <div className="flex items-center justify-between text-[16px] font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(plain.total ?? 0, { decimals: false })}</span>
                </div>
                {(plain.cost ?? 0) > 0 && (
                  <p className="pt-1 text-[12.5px] text-muted-foreground">
                    Estimated profit on this order:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency((plain.total ?? 0) - (plain.deliveryFee ?? 0) - (plain.cost ?? 0), { decimals: false })}
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {plain.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-muted-foreground">{plain.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-4">
                {(plain.timeline ?? []).map((entry, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 size-2 rounded-full bg-primary" />
                      {index < (plain.timeline?.length ?? 0) - 1 && <span className="my-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-[13.5px] font-medium capitalize">{entry.status}</p>
                      {entry.note && <p className="text-[12.5px] text-muted-foreground">{entry.note}</p>}
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {formatDate(entry.at as unknown as string, "time")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-[13.5px]">
              <p className="font-medium">{plain.customer?.name ?? "Walk-in customer"}</p>
              {plain.customer?.phone && (
                <a
                  href={`tel:${plain.customer.phone}`}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="size-3.5" />
                  {plain.customer.phone}
                </a>
              )}
              {(plain.customer?.address || plain.customer?.city) && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="whitespace-pre-line">
                    {[plain.customer?.address, plain.customer?.city, plain.customer?.district].filter(Boolean).join(", ")}
                  </span>
                </p>
              )}
              {plain.customerId && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/customers/${plain.customerId}`}>View customer</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0 text-[13.5px]">
              <SummaryRow label="Method" value={t.enums.paymentMethod[plain.paymentMethod ?? "cod"]} />
              <SummaryRow label="Status" value={<PaymentStatusBadge status={plain.paymentStatus ?? "unpaid"} />} />
              {plain.trackingNumber && <SummaryRow label="Tracking" value={plain.trackingNumber} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

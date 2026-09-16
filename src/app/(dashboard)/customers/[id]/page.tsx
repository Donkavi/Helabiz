import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, ShoppingCart } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { formatCurrency, formatDate, initials, relativeTime } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  await connectDB();

  const customer = await Customer.findOne({ _id: id, businessId }).lean();
  if (!customer) notFound();

  const orders = serialize(await Order.find({ businessId, customerId: id }).sort({ createdAt: -1 }).limit(50).lean());
  const plain = serialize(customer);
  const averageOrder = plain.totalOrders ? (plain.totalSpent ?? 0) / plain.totalOrders : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/customers" aria-label="Back to customers">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-muted text-[15px] font-semibold text-primary">
              {initials(plain.name)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{plain.name}</h1>
                <Badge variant={plain.type === "vip" ? "default" : "muted"} className="capitalize">
                  {plain.type}
                </Badge>
              </div>
              <p className="text-[13px] text-muted-foreground">
                Customer since {formatDate(plain.createdAt as unknown as string, "long")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={whatsappLink(plain.phone, `Hello ${plain.name},`)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
          <Button asChild>
            <Link href="/orders/new">
              <ShoppingCart className="size-4" />
              New order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={String(plain.totalOrders ?? 0)} />
        <StatCard label="Lifetime value" value={formatCurrency(plain.totalSpent ?? 0, { decimals: false })} tone="primary" />
        <StatCard label="Average order" value={formatCurrency(averageOrder, { decimals: false })} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order history</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {orders.length === 0 ? (
              <EmptyState compact icon={ShoppingCart} title="No orders yet" description="This customer has not ordered yet." />
            ) : (
              <ul className="divide-y divide-border">
                {orders.map((order) => (
                  <li key={String(order._id)}>
                    <Link
                      href={`/orders/${order._id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[13px] font-medium">{order.orderNumber}</p>
                        <p className="text-[12.5px] text-muted-foreground">
                          {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                          {relativeTime(order.createdAt as unknown as string)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status ?? "pending"} />
                      <p className="w-24 shrink-0 text-right text-[13.5px] font-semibold tabular-nums">
                        {formatCurrency(order.total ?? 0, { decimals: false })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-[13.5px]">
              <a href={`tel:${plain.phone}`} className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
                <Phone className="size-3.5" />
                {plain.phone}
              </a>
              {plain.email && (
                <a href={`mailto:${plain.email}`} className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
                  <Mail className="size-3.5" />
                  {plain.email}
                </a>
              )}
              {(plain.address || plain.city) && (
                <p className="flex items-start gap-2.5 text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>{[plain.address, plain.city, plain.district].filter(Boolean).join(", ")}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {plain.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-muted-foreground">{plain.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

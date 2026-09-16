import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { Types } from "mongoose";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { OrdersTable } from "./orders-table";
import { formatCurrency } from "@/lib/utils";
import { REVENUE_STATUSES, monthStart } from "@/services/metrics-service";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string }>;
}) {
  const { businessId } = await requireBusiness();
  const params = await searchParams;
  await connectDB();

  const filter: Record<string, unknown> = { businessId };
  if (params.status && params.status !== "all") filter.status = params.status;
  if (params.source && params.source !== "all") filter.source = params.source;
  if (params.q) {
    filter.$or = [
      { orderNumber: { $regex: params.q, $options: "i" } },
      { "customer.name": { $regex: params.q, $options: "i" } },
      { "customer.phone": { $regex: params.q, $options: "i" } },
    ];
  }

  const [orders, totalCount, monthRevenue, pendingCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).limit(300).lean(),
    Order.countDocuments({ businessId }),
    Order.aggregate<{ total: number }>([
      {
        $match: {
          businessId: new Types.ObjectId(businessId),
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: monthStart() },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments({ businessId, status: "pending" }),
  ]);

  const rows = serialize(orders).map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    customerName: o.customer?.name ?? "Walk-in customer",
    customerPhone: o.customer?.phone ?? "",
    itemCount: o.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    total: o.total ?? 0,
    status: o.status ?? "pending",
    paymentStatus: o.paymentStatus ?? "unpaid",
    source: o.source ?? "manual",
    createdAt: String(o.createdAt),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Website, WhatsApp and walk-in orders — all in one list."
        actions={
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="size-4" />
              New order
            </Link>
          </Button>
        }
      >
        {totalCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{formatCurrency(monthRevenue[0]?.total ?? 0, { decimals: false })}</span>{" "}
              this month
            </span>
            <span>
              <span className="font-semibold text-foreground">{pendingCount}</span> awaiting action
            </span>
            <span>
              <span className="font-semibold text-foreground">{totalCount}</span> orders all time
            </span>
          </div>
        )}
      </PageHeader>

      {totalCount === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Orders placed on your website arrive here automatically. You can also record orders that came in by phone or WhatsApp."
          action={
            <Button asChild>
              <Link href="/orders/new">
                <Plus className="size-4" />
                Record an order
              </Link>
            </Button>
          }
          secondaryAction={
            <Button variant="outline" asChild>
              <Link href="/website">Set up your website</Link>
            </Button>
          }
        />
      ) : (
        <OrdersTable
          orders={rows}
          initialQuery={params.q ?? ""}
          initialStatus={params.status ?? "all"}
          initialSource={params.source ?? "all"}
        />
      )}
    </div>
  );
}

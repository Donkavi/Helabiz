"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/dashboard/order-status-badge";
import { useT } from "@/lib/i18n/provider";
import { formatCurrency, relativeTime } from "@/lib/utils";

export type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  total: number;
  status: string;
  paymentStatus: string;
  source: string;
  createdAt: string;
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersTable({
  orders,
  initialQuery,
  initialStatus,
  initialSource,
}: {
  orders: OrderRow[];
  initialQuery: string;
  initialStatus: string;
  initialSource: string;
}) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [status, setStatus] = React.useState(initialStatus);
  const [source, setSource] = React.useState(initialSource);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status !== "all") params.set("status", status);
      if (source !== "all") params.set("source", source);
      const qs = params.toString();
      router.replace(qs ? `/orders?${qs}` : "/orders", { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, status, source, router]);

  const visible = orders.filter((order) => {
    if (status !== "all" && order.status !== status) return false;
    if (source !== "all" && order.source !== source) return false;
    if (query && !`${order.orderNumber} ${order.customerName} ${order.customerPhone}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              aria-pressed={status === tab.value}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-all ${
                status === tab.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order number, name or phone"
            className="pl-9"
            aria-label="Search orders"
          />
        </div>

        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {Object.entries(t.enums.orderSource).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          compact
          icon={Search}
          title="No orders match those filters"
          description="Try clearing the search or choosing a different status."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setSource("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="block">
                      <span className="block font-mono text-[13px] font-medium">{order.orderNumber}</span>
                      <span className="block text-[12px] text-muted-foreground">{relativeTime(order.createdAt)}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="block">
                      <span className="block text-[13.5px] font-medium">{order.customerName}</span>
                      <span className="block text-[12px] text-muted-foreground">
                        {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                        {order.customerPhone && ` · ${order.customerPhone}`}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.source === "website" ? "soft" : "muted"}>
                      {t.enums.orderSource[order.source] ?? order.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                    {formatCurrency(order.total, { decimals: false })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-[12.5px] text-muted-foreground">
        Showing {visible.length} of {orders.length} orders
      </p>
    </div>
  );
}

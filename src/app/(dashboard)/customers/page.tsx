import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Customer } from "@/models/Customer";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PageTour } from "@/components/dashboard/tour/tour";
import { CustomersTable } from "./customers-table";
import { CustomerDialog } from "./customer-dialog";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { businessId } = await requireBusiness();
  const params = await searchParams;
  await connectDB();

  const customers = serialize(
    await Customer.find({
      businessId,
      ...(params.q
        ? { $or: [{ name: { $regex: params.q, $options: "i" } }, { phone: { $regex: params.q, $options: "i" } }] }
        : {}),
    })
      .sort({ totalSpent: -1, createdAt: -1 })
      .limit(300)
      .lean(),
  );

  const totalSpend = customers.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0);
  const repeatCount = customers.filter((c) => (c.totalOrders ?? 0) > 1).length;

  const rows = customers.map((c) => ({
    id: String(c._id),
    name: c.name,
    phone: c.phone,
    email: c.email ?? "",
    city: c.city ?? "",
    type: c.type ?? "new",
    totalOrders: c.totalOrders ?? 0,
    totalSpent: c.totalSpent ?? 0,
    lastOrderAt: c.lastOrderAt ? String(c.lastOrderAt) : undefined,
  }));

  return (
    <div className="space-y-6">
      <PageTour id="customers" />
      <PageHeader
        title="Customers"
        description="Everyone who has ordered from you — website buyers are added automatically."
        actions={<CustomerDialog />}
      >
        {customers.length > 0 && (
          <div data-tour="customers-summary" className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{customers.length}</span> customers
            </span>
            <span>
              <span className="font-semibold text-foreground">{repeatCount}</span> have ordered more than once
            </span>
            <span>
              <span className="font-semibold text-foreground">{formatCurrency(totalSpend, { decimals: false })}</span>{" "}
              lifetime value
            </span>
          </div>
        )}
      </PageHeader>

      {customers.length === 0 && !params.q ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Anyone who orders from your website is added here with their contact details and order history. You can also add customers by hand."
          action={<CustomerDialog />}
          secondaryAction={
            <Button variant="outline" asChild data-tour="customers-record-order">
              <Link href="/orders/new">Record an order</Link>
            </Button>
          }
        />
      ) : (
        <CustomersTable customers={rows} initialQuery={params.q ?? ""} />
      )}
    </div>
  );
}

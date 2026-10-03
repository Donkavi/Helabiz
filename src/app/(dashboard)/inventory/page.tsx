import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Boxes, Package, TrendingDown } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { InventoryMovement } from "@/models/InventoryMovement";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTour } from "@/components/dashboard/tour/tour";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, relativeTime } from "@/lib/utils";
import { productSummary, variantPricing } from "@/lib/products";
import { InventoryTable } from "./inventory-table";

export const metadata: Metadata = { title: "Inventory" };

const MOVEMENT_LABELS: Record<string, string> = {
  sale: "Sold",
  restock: "Restocked",
  adjustment: "Adjusted",
  return: "Returned",
  damage: "Damaged",
};

export default async function InventoryPage() {
  const { businessId } = await requireBusiness();
  await connectDB();

  const [products, movements] = await Promise.all([
    Product.find({ businessId, status: { $ne: "archived" }, trackInventory: true })
      .sort({ stock: 1 })
      .limit(500)
      .lean(),
    InventoryMovement.find({ businessId }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  const rows = serialize(products).map((p) => {
    const summary = productSummary(p);
    return {
      id: String(p._id),
      name: p.name,
      sku: p.sku ?? "",
      image: p.images?.[0],
      stock: summary.stock,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      stockValue: summary.stockValue,
      retailValue: summary.retailValue,
      variants: (p.variants ?? []).map((v) => {
        const pricing = variantPricing(p, v);
        return {
          id: String(v._id),
          name: v.name,
          sku: v.sku ?? "",
          stock: pricing.stock,
          stockValue: pricing.stock * pricing.costPrice,
        };
      }),
    };
  });

  const stockValue = rows.reduce((sum, p) => sum + p.stockValue, 0);
  const retailValue = rows.reduce((sum, p) => sum + p.retailValue, 0);
  const lowCount = rows.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outCount = rows.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      <PageTour id="inventory" />
      <PageHeader
        title="Inventory"
        description="Stock levels update automatically when orders come in from your website."
        actions={
          <Button variant="outline" asChild>
            <Link href="/products">Manage products</Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing to track yet"
          description="Add products with stock tracking turned on and they will appear here with live stock levels."
          action={
            <Button asChild data-tour="inventory-add">
              <Link href="/products/new">Add a product</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div data-tour="inventory-stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Products tracked" value={String(rows.length)} icon={Package} />
            <StatCard
              label="Stock value at cost"
              value={formatCurrency(stockValue, { decimals: false })}
              icon={Boxes}
              tone="primary"
            />
            <StatCard label="Retail value" value={formatCurrency(retailValue, { decimals: false })} icon={TrendingDown} />
            <StatCard
              label="Needs attention"
              value={String(lowCount + outCount)}
              sublabel={`${outCount} out of stock · ${lowCount} running low`}
              icon={AlertTriangle}
              tone={lowCount + outCount > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <InventoryTable products={rows} />

            <Card data-tour="inventory-movements">
              <CardHeader>
                <CardTitle>Recent movements</CardTitle>
                <p className="text-[12.5px] text-muted-foreground">Every stock change, with its reason.</p>
              </CardHeader>
              <CardContent className="pt-0">
                {movements.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-muted-foreground">No stock movements yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {serialize(movements).map((movement) => (
                      <li key={String(movement._id)} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">
                            {movement.productName}
                            {movement.variantName && (
                              <span className="font-normal text-muted-foreground"> · {movement.variantName}</span>
                            )}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {MOVEMENT_LABELS[movement.type] ?? movement.type}
                            {movement.reference && ` · ${movement.reference}`} ·{" "}
                            {relativeTime(movement.createdAt as unknown as string)}
                          </p>
                        </div>
                        <Badge variant={movement.quantity < 0 ? "destructive" : "success"}>
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </Badge>
                        <span className="w-10 text-right text-[12.5px] tabular-nums text-muted-foreground">
                          {movement.stockAfter}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

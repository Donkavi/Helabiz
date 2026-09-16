import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductsTable } from "./products-table";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const { businessId } = await requireBusiness();
  const params = await searchParams;
  await connectDB();

  const filter: Record<string, unknown> = { businessId };
  if (params.status && params.status !== "all") filter.status = params.status;
  else filter.status = { $ne: "archived" };
  if (params.category && params.category !== "all") filter.categoryId = params.category;
  if (params.q) filter.name = { $regex: params.q, $options: "i" };

  const [products, categories, totalCount] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).limit(300).lean(),
    Category.find({ businessId }).sort({ name: 1 }).lean(),
    Product.countDocuments({ businessId, status: { $ne: "archived" } }),
  ]);

  const rows = serialize(products).map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    costPrice: p.costPrice ?? 0,
    stock: p.stock ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 5,
    trackInventory: p.trackInventory ?? true,
    image: p.images?.[0],
    status: p.status ?? "active",
    featured: Boolean(p.featured),
    categoryId: p.categoryId ? String(p.categoryId) : undefined,
    sold: p.sold ?? 0,
  }));

  const categoryOptions = serialize(categories).map((c) => ({ id: String(c._id), name: c.name, slug: c.slug }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Everything you sell. Products added here appear on your website automatically."
        actions={
          <>
            <CategoryManager categories={categoryOptions} />
            <Button asChild>
              <Link href="/products/new">
                <Plus className="size-4" />
                Add product
              </Link>
            </Button>
          </>
        }
      />

      {totalCount === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product with a name, price and photo. It will be ready to sell on your website straight away."
          action={
            <Button asChild>
              <Link href="/products/new">
                <Plus className="size-4" />
                Add your first product
              </Link>
            </Button>
          }
        />
      ) : (
        <ProductsTable
          products={rows}
          categories={categoryOptions}
          initialQuery={params.q ?? ""}
          initialStatus={params.status ?? "active"}
          initialCategory={params.category ?? "all"}
        />
      )}
    </div>
  );
}

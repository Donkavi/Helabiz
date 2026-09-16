import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { ProductForm, type ProductFormValues } from "../product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  await connectDB();

  const [product, categories] = await Promise.all([
    Product.findOne({ _id: id, businessId }).lean(),
    Category.find({ businessId }).sort({ name: 1 }).lean(),
  ]);
  if (!product) notFound();

  const plain = serialize(product);
  const initial: ProductFormValues = {
    id: String(plain._id),
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? "",
    shortDescription: plain.shortDescription ?? "",
    sku: plain.sku ?? "",
    price: plain.price,
    compareAtPrice: plain.compareAtPrice ?? "",
    costPrice: plain.costPrice ?? "",
    stock: plain.stock ?? 0,
    lowStockThreshold: plain.lowStockThreshold ?? 5,
    trackInventory: plain.trackInventory ?? true,
    images: plain.images ?? [],
    categoryId: plain.categoryId ? String(plain.categoryId) : "",
    tags: plain.tags ?? [],
    status: plain.status ?? "active",
    featured: Boolean(plain.featured),
    variants: (plain.variants ?? []).map((v) => ({
      _id: String(v._id),
      name: v.name,
      sku: v.sku ?? "",
      price: v.price ?? "",
      stock: v.stock ?? 0,
    })),
    seoTitle: plain.seo?.title ?? "",
    seoDescription: plain.seo?.description ?? "",
  };

  return (
    <ProductForm
      initial={initial}
      categories={serialize(categories).map((c) => ({ id: String(c._id), name: c.name }))}
    />
  );
}

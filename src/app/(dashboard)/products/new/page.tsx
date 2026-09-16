import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { EMPTY_PRODUCT, ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { businessId } = await requireBusiness();
  await connectDB();
  const categories = await Category.find({ businessId }).sort({ name: 1 }).lean();

  return (
    <ProductForm
      initial={EMPTY_PRODUCT}
      categories={serialize(categories).map((c) => ({ id: String(c._id), name: c.name }))}
    />
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { InventoryMovement } from "@/models/InventoryMovement";
import { productSchema, categorySchema, stockAdjustmentSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";
import { assertWithinLimit, LimitError } from "@/services/limits-service";
import { uniqueSlug } from "@/services/business-service";

function parseProductForm(formData: FormData) {
  const json = formData.get("payload");
  const raw = json ? (JSON.parse(String(json)) as Record<string, unknown>) : Object.fromEntries(formData);
  return productSchema.safeParse(raw);
}

export async function saveProductAction(_prev: ActionState<{ id: string }>, formData: FormData): Promise<ActionState<{ id: string }>> {
  const { businessId } = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  await connectDB();

  try {
    if (!id) await assertWithinLimit(businessId, "products");
  } catch (error) {
    if (error instanceof LimitError) return { ok: false, error: error.message };
    throw error;
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.slug || data.name, async (candidate) => {
    const hit = await Product.findOne({ businessId, slug: candidate, ...(id ? { _id: { $ne: id } } : {}) })
      .select("_id")
      .lean();
    return Boolean(hit);
  });

  const payload = {
    businessId,
    name: data.name,
    slug,
    description: data.description || undefined,
    shortDescription: data.shortDescription || undefined,
    sku: data.sku || undefined,
    price: data.price,
    compareAtPrice: data.compareAtPrice || undefined,
    costPrice: data.costPrice,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    trackInventory: data.trackInventory,
    images: data.images,
    categoryId: data.categoryId || undefined,
    tags: data.tags,
    status: data.status,
    featured: data.featured,
    variants: data.variants,
    seo: { title: data.seoTitle || undefined, description: data.seoDescription || undefined },
  };

  let productId = id;
  if (id) {
    const before = await Product.findOne({ _id: id, businessId }).select("stock name").lean();
    await Product.updateOne({ _id: id, businessId }, { $set: payload });

    // A manual stock edit is still an inventory movement worth recording.
    if (before && before.stock !== data.stock) {
      await InventoryMovement.create({
        businessId,
        productId: id,
        productName: data.name,
        type: "adjustment",
        quantity: data.stock - (before.stock ?? 0),
        stockBefore: before.stock ?? 0,
        stockAfter: data.stock,
        note: "Edited on the product page",
      });
    }
  } else {
    const created = await Product.create(payload);
    productId = String(created._id);
    if (data.stock > 0) {
      await InventoryMovement.create({
        businessId,
        productId: created._id,
        productName: data.name,
        type: "restock",
        quantity: data.stock,
        stockBefore: 0,
        stockAfter: data.stock,
        note: "Opening stock",
      });
    }
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: productId } };
}

export async function deleteProductAction(id: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  // Archive rather than delete so historic orders keep referring to something real.
  await Product.updateOne({ _id: id, businessId }, { $set: { status: "archived" } });
  revalidatePath("/products");
  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function restoreProductAction(id: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Product.updateOne({ _id: id, businessId }, { $set: { status: "active" } });
  revalidatePath("/products");
  return { ok: true as const };
}

export async function toggleFeaturedAction(id: string, featured: boolean) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Product.updateOne({ _id: id, businessId }, { $set: { featured } });
  revalidatePath("/products");
  return { ok: true as const };
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId } = await requireBusiness();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  await connectDB();
  const slug = await uniqueSlug(parsed.data.name, async (candidate) => {
    const hit = await Category.findOne({ businessId, slug: candidate }).select("_id").lean();
    return Boolean(hit);
  });

  await Category.create({
    businessId,
    name: parsed.data.name,
    slug,
    description: parsed.data.description || undefined,
    image: parsed.data.image || undefined,
  });

  revalidatePath("/products");
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Category.deleteOne({ _id: id, businessId });
  await Product.updateMany({ businessId, categoryId: id }, { $unset: { categoryId: "" } });
  revalidatePath("/products");
  return { ok: true as const };
}

export async function adjustStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId } = await requireBusiness();
  const parsed = stockAdjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  await connectDB();
  const product = await Product.findOne({ _id: parsed.data.productId, businessId });
  if (!product) return { ok: false, error: "Product not found" };

  const before = product.stock ?? 0;
  // Damage always reduces stock; the other types follow the sign the user typed.
  const delta = parsed.data.type === "damage" ? -Math.abs(parsed.data.quantity) : parsed.data.quantity;
  product.stock = Math.max(0, before + delta);
  await product.save();

  await InventoryMovement.create({
    businessId,
    productId: product._id,
    productName: product.name,
    type: parsed.data.type,
    quantity: delta,
    stockBefore: before,
    stockAfter: product.stock,
    note: parsed.data.note || undefined,
  });

  revalidatePath("/inventory");
  revalidatePath("/products");
  return { ok: true };
}

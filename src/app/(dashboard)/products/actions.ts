"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { InventoryMovement } from "@/models/InventoryMovement";
import { productSchema, categorySchema, stockAdjustmentSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";
import { assertWithinLimit, LimitError } from "@/services/limits-service";
import { uniqueSlug } from "@/services/business-service";
import { productSummary } from "@/lib/products";

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

  // New variants get their id here so their opening stock can be logged against it.
  const variants = data.variants.map((v) => ({
    ...v,
    _id: v._id || new Types.ObjectId().toString(),
    compareAtPrice: v.compareAtPrice || undefined,
  }));
  // A product with variants is priced and stocked by them alone; its own
  // fields become the summary lists and reports read.
  const summary = productSummary({ ...data, variants });

  const payload = {
    businessId,
    name: data.name,
    slug,
    description: data.description || undefined,
    shortDescription: data.shortDescription || undefined,
    sku: data.sku || undefined,
    price: summary.price,
    compareAtPrice: summary.compareAtPrice || undefined,
    costPrice: summary.costPrice,
    stock: summary.stock,
    lowStockThreshold: data.lowStockThreshold,
    trackInventory: data.trackInventory,
    images: data.images,
    categoryId: data.categoryId || undefined,
    tags: data.tags,
    status: data.status,
    featured: data.featured,
    variants,
    seo: { title: data.seoTitle || undefined, description: data.seoDescription || undefined },
  };

  let productId = id;
  let before: { stock: number; variants: Map<string, number> } | null = null;
  if (id) {
    const existing = await Product.findOne({ _id: id, businessId }).select("stock variants").lean();
    if (existing) {
      before = {
        stock: existing.stock ?? 0,
        variants: new Map((existing.variants ?? []).map((v) => [String(v._id), v.stock ?? 0])),
      };
    }
    await Product.updateOne({ _id: id, businessId }, { $set: payload });
  } else {
    const created = await Product.create(payload);
    productId = String(created._id);
  }

  // A manual stock edit is still an inventory movement worth recording, one
  // per variant when the product has them.
  const changes = variants.length
    ? variants.map((v) => ({
        variantId: v._id,
        variantName: v.name,
        from: before?.variants.get(v._id) ?? 0,
        to: v.stock,
      }))
    : [{ variantId: undefined, variantName: undefined, from: before?.stock ?? 0, to: data.stock }];

  for (const change of changes) {
    if (change.from === change.to) continue;
    await InventoryMovement.create({
      businessId,
      productId,
      variantId: change.variantId,
      variantName: change.variantName,
      productName: data.name,
      type: before ? "adjustment" : "restock",
      quantity: change.to - change.from,
      stockBefore: change.from,
      stockAfter: change.to,
      note: before ? "Edited on the product page" : "Opening stock",
    });
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

  // A product with variants keeps its stock on them, so it is adjusted one variant at a time.
  const variant = parsed.data.variantId
    ? product.variants.find((v) => String(v._id) === parsed.data.variantId)
    : undefined;
  if (product.variants.length && !variant) return { ok: false, error: "Choose which variant to adjust" };

  const before = (variant ? variant.stock : product.stock) ?? 0;
  // Damage always reduces stock; the other types follow the sign the user typed.
  const delta = parsed.data.type === "damage" ? -Math.abs(parsed.data.quantity) : parsed.data.quantity;
  const after = Math.max(0, before + delta);
  if (variant) {
    variant.stock = after;
    product.stock = productSummary(product).stock;
  } else {
    product.stock = after;
  }
  await product.save();

  await InventoryMovement.create({
    businessId,
    productId: product._id,
    variantId: variant ? String(variant._id) : undefined,
    variantName: variant?.name,
    productName: product.name,
    type: parsed.data.type,
    quantity: after - before,
    stockBefore: before,
    stockAfter: after,
    note: parsed.data.note || undefined,
  });

  revalidatePath("/inventory");
  revalidatePath("/products");
  return { ok: true };
}

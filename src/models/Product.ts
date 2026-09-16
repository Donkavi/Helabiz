import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const VariantSchema = new Schema(
  {
    name: { type: String, required: true },
    sku: String,
    price: Number,
    stock: { type: Number, default: 0 },
    options: { type: Map, of: String },
  },
  { _id: true },
);

const ProductSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: String,
    shortDescription: String,
    sku: String,
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },
    images: [String],
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    tags: [String],
    variants: [VariantSchema],
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    featured: { type: Boolean, default: false },
    weight: Number,
    views: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    seo: { title: String, description: String },
  },
  { timestamps: true },
);
ProductSchema.index({ businessId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ businessId: 1, name: "text", tags: "text" });

export type ProductVariant = InferSchemaType<typeof VariantSchema>;
export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product = (models.Product as Model<ProductDoc>) || model<ProductDoc>("Product", ProductSchema);

import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    variantId: String,
    name: { type: String, required: true },
    variantName: String,
    sku: String,
    image: String,
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },
  },
  { _id: true },
);

const OrderSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customer: {
      name: String,
      phone: String,
      email: String,
      address: String,
      city: String,
      district: String,
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
      index: true,
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "partial", "refunded"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cod", "bank_transfer", "online", "cash", "card"], default: "cod" },
    source: {
      type: String,
      enum: ["website", "manual", "whatsapp", "instagram", "facebook", "walk_in"],
      default: "manual",
      index: true,
    },
    notes: String,
    trackingNumber: String,
    inventoryApplied: { type: Boolean, default: false },
    timeline: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);
OrderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ businessId: 1, createdAt: -1 });

export type OrderItem = InferSchemaType<typeof OrderItemSchema>;
export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order = (models.Order as Model<OrderDoc>) || model<OrderDoc>("Order", OrderSchema);

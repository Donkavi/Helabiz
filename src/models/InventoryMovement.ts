import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const InventoryMovementSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantId: String,
    productName: String,
    type: { type: String, enum: ["sale", "restock", "adjustment", "return", "damage"], required: true },
    quantity: { type: Number, required: true },
    stockBefore: Number,
    stockAfter: Number,
    reference: String,
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    note: String,
  },
  { timestamps: true },
);
InventoryMovementSchema.index({ businessId: 1, createdAt: -1 });

export type InventoryMovementDoc = InferSchemaType<typeof InventoryMovementSchema>;
export const InventoryMovement =
  (models.InventoryMovement as Model<InventoryMovementDoc>) ||
  model<InventoryMovementDoc>("InventoryMovement", InventoryMovementSchema);

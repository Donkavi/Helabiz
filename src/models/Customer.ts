import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CustomerSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: String,
    address: String,
    city: String,
    district: String,
    notes: String,
    type: { type: String, enum: ["new", "regular", "vip", "inactive"], default: "new" },
    source: { type: String, default: "manual" },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: Date,
  },
  { timestamps: true },
);
CustomerSchema.index({ businessId: 1, phone: 1 }, { unique: true });

export type CustomerDoc = InferSchemaType<typeof CustomerSchema>;
export const Customer = (models.Customer as Model<CustomerDoc>) || model<CustomerDoc>("Customer", CustomerSchema);

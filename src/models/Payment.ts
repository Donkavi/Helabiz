import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const PaymentSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    kind: { type: String, enum: ["subscription", "order"], default: "subscription" },
    reference: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },
    provider: { type: String, default: "manual" },
    providerRef: String,
    status: { type: String, enum: ["pending", "succeeded", "failed", "refunded"], default: "pending" },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = (models.Payment as Model<PaymentDoc>) || model<PaymentDoc>("Payment", PaymentSchema);

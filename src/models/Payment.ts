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
    /**
     * `pending` is waiting for a slip, `review` has one and is waiting for an
     * administrator, and `succeeded` has been approved and the plan applied.
     */
    status: {
      type: String,
      enum: ["pending", "review", "succeeded", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    /**
     * What this payment buys. A plan, a set of website add-ons, or both — an
     * established shop adding chat buys add-ons with no plan attached.
     */
    plan: { type: String, enum: ["starter", "business"] },
    addons: {
      type: [{ type: String, enum: ["order_email", "whatsapp_chat", "order_tracking"] }],
      default: [],
    },
    /** The deposit slip proving it was paid. */
    slipUrl: String,
    /** Storage handle for the slip, so it can be deleted from Cloudinary later. */
    slipRef: String,
    slipName: String,
    slipUploadedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = (models.Payment as Model<PaymentDoc>) || model<PaymentDoc>("Payment", PaymentSchema);

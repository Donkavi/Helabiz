import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, unique: true, index: true },
    plan: { type: String, enum: ["free", "starter", "business"], default: "free" },
    status: { type: String, enum: ["active", "trialing", "past_due", "cancelled"], default: "active" },
    interval: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    provider: { type: String, default: "manual" },
    providerRef: String,
  },
  { timestamps: true },
);

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema>;
export const Subscription =
  (models.Subscription as Model<SubscriptionDoc>) || model<SubscriptionDoc>("Subscription", SubscriptionSchema);

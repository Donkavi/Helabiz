import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Lightweight first-party event store for website analytics (spec §29).
 * Events are written from the public site and aggregated on read.
 */
const AnalyticsEventSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", index: true },
    type: {
      type: String,
      enum: ["page_view", "product_view", "add_to_cart", "begin_checkout", "order"],
      required: true,
      index: true,
    },
    path: String,
    referrer: String,
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: String,
    value: { type: Number, default: 0 },
    visitorId: String,
    sessionId: String,
    device: { type: String, default: "desktop" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);
AnalyticsEventSchema.index({ businessId: 1, createdAt: -1 });

export type AnalyticsEventDoc = InferSchemaType<typeof AnalyticsEventSchema>;
export const AnalyticsEvent =
  (models.AnalyticsEvent as Model<AnalyticsEventDoc>) ||
  model<AnalyticsEventDoc>("AnalyticsEvent", AnalyticsEventSchema);

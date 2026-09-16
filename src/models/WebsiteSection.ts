import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Sections normally live inline on a page's JSON tree. This collection stores
 * *saved* sections — reusable blocks a user can drop into any page, plus the
 * section presets shipped with each theme.
 */
const WebsiteSectionSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    node: { type: Schema.Types.Mixed, required: true },
    thumbnail: String,
    scope: { type: String, enum: ["business", "global"], default: "business" },
  },
  { timestamps: true },
);

export type WebsiteSectionDoc = InferSchemaType<typeof WebsiteSectionSchema>;
export const WebsiteSection =
  (models.WebsiteSection as Model<WebsiteSectionDoc>) ||
  model<WebsiteSectionDoc>("WebsiteSection", WebsiteSectionSchema);

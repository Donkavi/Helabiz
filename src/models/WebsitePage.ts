import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * A page owns an ordered tree of sections stored as JSON (spec §43).
 * `sections` is the editable draft; `publishedSections` is the snapshot the
 * public site renders, so editing never affects a live website until Publish.
 */
const WebsitePageSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    isHome: { type: Boolean, default: false },
    kind: { type: String, enum: ["standard", "shop", "product", "cart", "checkout"], default: "standard" },
    sections: { type: Schema.Types.Mixed, default: () => [] },
    publishedSections: { type: Schema.Types.Mixed, default: () => [] },
    seo: {
      title: String,
      description: String,
      ogImage: String,
      keywords: [String],
      noIndex: { type: Boolean, default: false },
    },
    hidden: { type: Boolean, default: false },
    showInNav: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    lastEditedAt: Date,
  },
  { timestamps: true },
);
WebsitePageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });

export type WebsitePageDoc = InferSchemaType<typeof WebsitePageSchema>;
export const WebsitePage =
  (models.WebsitePage as Model<WebsitePageDoc>) || model<WebsitePageDoc>("WebsitePage", WebsitePageSchema);

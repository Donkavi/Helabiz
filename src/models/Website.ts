import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const NavItemSchema = new Schema(
  { id: String, label: String, href: String },
  { _id: false },
);

const WebsiteSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, index: true },
    /** Which template this site was last built from — shown on the overview. */
    templateId: String,
    themeId: { type: String, default: "aurora" },
    /** Draft tokens are edited live; publishedTheme is the frozen copy served publicly. */
    theme: { type: Schema.Types.Mixed, required: true },
    publishedTheme: Schema.Types.Mixed,
    header: { type: Schema.Types.Mixed, default: () => ({}) },
    footer: { type: Schema.Types.Mixed, default: () => ({}) },
    publishedHeader: Schema.Types.Mixed,
    publishedFooter: Schema.Types.Mixed,
    navigation: { type: [NavItemSchema], default: [] },
    publishedNavigation: { type: [NavItemSchema], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: Date,
    lastEditedAt: Date,
    hasUnpublishedChanges: { type: Boolean, default: true },
    favicon: String,
    seo: {
      title: String,
      description: String,
      ogImage: String,
      keywords: [String],
    },
    settings: {
      showCart: { type: Boolean, default: true },
      allowCheckout: { type: Boolean, default: true },
      whatsappOrdering: { type: Boolean, default: true },
      /** Shoppers can register and sign in to see their orders. */
      customerAccounts: { type: Boolean, default: true },
      announcement: String,
      announcementEnabled: { type: Boolean, default: false },
      passwordProtect: { type: Boolean, default: false },
      password: String,
      googleAnalyticsId: String,
      facebookPixelId: String,
    },
  },
  { timestamps: true },
);

export type WebsiteDoc = InferSchemaType<typeof WebsiteSchema>;
export const Website = (models.Website as Model<WebsiteDoc>) || model<WebsiteDoc>("Website", WebsiteSchema);

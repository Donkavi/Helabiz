import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Persisted custom themes. The eight built-in themes (spec §18) live in code at
 * `lib/website/themes.ts` so they can be rendered without a database round-trip;
 * this collection holds user-saved variations of them.
 */
const WebsiteThemeSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", index: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    category: String,
    description: String,
    preview: String,
    tokens: { type: Schema.Types.Mixed, required: true },
    isCustom: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type WebsiteThemeDoc = InferSchemaType<typeof WebsiteThemeSchema>;
export const WebsiteTheme =
  (models.WebsiteTheme as Model<WebsiteThemeDoc>) || model<WebsiteThemeDoc>("WebsiteTheme", WebsiteThemeSchema);

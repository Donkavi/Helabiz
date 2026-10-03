import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * "Build my website for me": a business asking the Helabiz team to make its
 * website, for owners who would rather not drag and drop themselves.
 *
 * One open request per business at a time. The team works it through the
 * statuses below; while it is `building`, the admin holds support access to
 * the business (a flagged `BusinessMember`) and builds in the normal builder.
 */
export const WEBSITE_REQUEST_STATUSES = ["new", "contacted", "building", "done", "cancelled"] as const;
export type WebsiteRequestStatus = (typeof WEBSITE_REQUEST_STATUSES)[number];
export const OPEN_REQUEST_STATUSES: WebsiteRequestStatus[] = ["new", "contacted", "building"];

const WebsiteRequestSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Where the team should call. */
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: Boolean, default: true },
    bestTime: String,
    /** What they sell and who for, in their own words. */
    about: { type: String, required: true, trim: true },
    /** Pages they want: home, shop, about, contact, gallery… */
    pages: { type: [String], default: [] },
    /** Colours, mood, a site they like. */
    style: String,
    /** Their Facebook / Instagram / TikTok page, so the team can borrow photos and tone. */
    links: String,
    notes: String,
    status: { type: String, enum: WEBSITE_REQUEST_STATUSES, default: "new", index: true },
    /** Internal to the Helabiz team; never shown to the business. */
    adminNotes: String,
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: Date,
  },
  { timestamps: true },
);
WebsiteRequestSchema.index({ status: 1, createdAt: -1 });

export type WebsiteRequestDoc = InferSchemaType<typeof WebsiteRequestSchema>;
export const WebsiteRequest =
  (models.WebsiteRequest as Model<WebsiteRequestDoc>) ||
  model<WebsiteRequestDoc>("WebsiteRequest", WebsiteRequestSchema);

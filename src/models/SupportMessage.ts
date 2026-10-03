import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * One message in the chat between a business and the Helabiz team.
 *
 * There is a single conversation per business, so the business id is the
 * thread. `readAt` is when the *other* side opened it: for a business message
 * that is the team, for a Helabiz message the business.
 */
const SupportMessageSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    from: { type: String, enum: ["business", "helabiz"], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    /** Kept on the message so a removed user's words still have a name. */
    authorName: String,
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    /** A system note, e.g. the summary posted when a website request is sent. */
    kind: { type: String, enum: ["text", "request"], default: "text" },
    readAt: Date,
  },
  { timestamps: true },
);
SupportMessageSchema.index({ businessId: 1, createdAt: 1 });
SupportMessageSchema.index({ from: 1, readAt: 1 });

export type SupportMessageDoc = InferSchemaType<typeof SupportMessageSchema>;
export const SupportMessage =
  (models.SupportMessage as Model<SupportMessageDoc>) ||
  model<SupportMessageDoc>("SupportMessage", SupportMessageSchema);

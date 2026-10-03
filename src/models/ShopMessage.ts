import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * One message between a shop and one of its website customers, from the
 * "Chat with customers" add-on.
 *
 * A conversation is a (business, customer) pair: the customer is the shop's
 * own `Customer` record with a website account, so the shop always sees who
 * it is talking to — their details and their orders — and the customer finds
 * the conversation in their account. `readAt` is when the *other* side saw it.
 */
const ShopMessageSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    from: { type: String, enum: ["customer", "shop"], required: true },
    /** The staff member who replied, for the shop's own records. */
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    authorName: String,
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: Date,
  },
  { timestamps: true },
);
ShopMessageSchema.index({ businessId: 1, customerId: 1, createdAt: 1 });
ShopMessageSchema.index({ businessId: 1, from: 1, readAt: 1 });

export type ShopMessageDoc = InferSchemaType<typeof ShopMessageSchema>;
export const ShopMessage =
  (models.ShopMessage as Model<ShopMessageDoc>) || model<ShopMessageDoc>("ShopMessage", ShopMessageSchema);

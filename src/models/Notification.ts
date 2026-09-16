import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const NotificationSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    type: { type: String, default: "info" },
    title: { type: String, required: true },
    body: String,
    href: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type NotificationDoc = InferSchemaType<typeof NotificationSchema>;
export const Notification =
  (models.Notification as Model<NotificationDoc>) || model<NotificationDoc>("Notification", NotificationSchema);

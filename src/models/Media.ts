import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const MediaSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: "image" },
    folder: { type: String, default: "uploads" },
    size: Number,
    width: Number,
    height: Number,
    alt: String,
    tags: [String],
  },
  { timestamps: true },
);

export type MediaDoc = InferSchemaType<typeof MediaSchema>;
export const Media = (models.Media as Model<MediaDoc>) || model<MediaDoc>("Media", MediaSchema);

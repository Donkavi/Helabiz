import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: String,
    image: String,
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
CategorySchema.index({ businessId: 1, slug: 1 }, { unique: true });

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;
export const Category = (models.Category as Model<CategoryDoc>) || model<CategoryDoc>("Category", CategorySchema);

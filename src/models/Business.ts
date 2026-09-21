import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BusinessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, default: "retail" },
    description: String,
    logo: String,
    phone: String,
    whatsapp: String,
    email: String,
    address: String,
    city: String,
    district: String,
    currency: { type: String, default: "LKR" },
    timezone: { type: String, default: "Asia/Colombo" },
    deliveryFee: { type: Number, default: 350 },
    freeDeliveryOver: { type: Number, default: 0 },
    social: {
      facebook: String,
      instagram: String,
      tiktok: String,
      youtube: String,
    },
    plan: { type: String, enum: ["free", "starter", "business"], default: "free" },
    /** Set by a platform admin. A suspended business loses the dashboard and its public site. */
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    suspendedAt: Date,
    suspendedReason: String,
    onboardingStep: { type: String, default: "products" },
  },
  { timestamps: true },
);

export type BusinessDoc = InferSchemaType<typeof BusinessSchema>;
export const Business = (models.Business as Model<BusinessDoc>) || model<BusinessDoc>("Business", BusinessSchema);

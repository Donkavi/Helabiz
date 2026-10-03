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
    /**
     * The one-month free trial. Both are unset until the owner activates it,
     * and a business on a paid plan ignores them entirely.
     */
    trialStartedAt: Date,
    trialEndsAt: { type: Date, index: true },
    /**
     * The end of the paid period, denormalised from the subscription so the
     * authorization gate stays a single query. Unset on the free plan, and
     * unset on a paid plan means "predates billing" rather than "expired".
     */
    planEndsAt: { type: Date, index: true },
    /**
     * Website add-ons, each with its own paid period. One row per add-on ever
     * bought; a past `endsAt` means lapsed rather than never held, which is
     * what lets the billing screen offer to switch it back on.
     */
    addons: {
      type: [
        new Schema(
          {
            id: { type: String, enum: ["order_email", "whatsapp_chat", "order_tracking"], required: true },
            startedAt: Date,
            endsAt: Date,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
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

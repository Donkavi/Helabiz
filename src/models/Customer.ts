import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CustomerSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: String,
    address: String,
    city: String,
    district: String,
    notes: String,
    type: { type: String, enum: ["new", "regular", "vip", "inactive"], default: "new" },
    source: { type: String, default: "manual" },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: Date,
    /**
     * A sign-in on the shop's own website, set when the customer registers.
     *
     * It lives on the customer record rather than beside it so the shop's
     * customer list, its orders and the customer's account are one story. An
     * account belongs to one shop only: the same person at two shops is two
     * customers, exactly as they are in each shop's dashboard.
     *
     * The secrets are `select: false`, because customer documents are handed
     * to dashboard client components whole.
     */
    account: {
      /** Lower-cased. Unique per shop, see the index below. */
      email: { type: String, lowercase: true, trim: true },
      passwordHash: { type: String, select: false },
      createdAt: Date,
      lastSignInAt: Date,
      /** Bumped on a password change or reset, which signs out every device. */
      sessionVersion: Number,
      resetTokenHash: { type: String, select: false },
      resetExpiresAt: { type: Date, select: false },
    },
  },
  { timestamps: true },
);
CustomerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
CustomerSchema.index(
  { businessId: 1, "account.email": 1 },
  { unique: true, partialFilterExpression: { "account.email": { $type: "string" } } },
);

export type CustomerDoc = InferSchemaType<typeof CustomerSchema>;
export const Customer = (models.Customer as Model<CustomerDoc>) || model<CustomerDoc>("Customer", CustomerSchema);

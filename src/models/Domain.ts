import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const DomainSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    hostname: { type: String, required: true, unique: true, lowercase: true },
    type: { type: String, enum: ["subdomain", "custom"], default: "custom" },
    status: { type: String, enum: ["pending", "verifying", "active", "failed"], default: "pending" },
    verificationToken: String,
    isPrimary: { type: Boolean, default: false },
    sslStatus: { type: String, enum: ["none", "pending", "issued"], default: "none" },
    verifiedAt: Date,
  },
  { timestamps: true },
);

export type DomainDoc = InferSchemaType<typeof DomainSchema>;
export const Domain = (models.Domain as Model<DomainDoc>) || model<DomainDoc>("Domain", DomainSchema);

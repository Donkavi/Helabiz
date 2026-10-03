import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BusinessMemberSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["owner", "admin", "staff"], default: "staff" },
    invitedEmail: String,
    status: { type: String, enum: ["active", "invited", "disabled"], default: "active" },
    /**
     * A Helabiz team member let in to build or fix this business's website at
     * its request. Shown to the owner as "Helabiz support", never counted
     * against the plan's team limit, and removed when the job is closed.
     */
    support: { type: Boolean, default: false },
  },
  { timestamps: true },
);
BusinessMemberSchema.index({ businessId: 1, userId: 1 }, { unique: true });

export type BusinessMemberDoc = InferSchemaType<typeof BusinessMemberSchema>;
export const BusinessMember =
  (models.BusinessMember as Model<BusinessMemberDoc>) || model<BusinessMemberDoc>("BusinessMember", BusinessMemberSchema);

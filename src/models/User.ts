import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    image: String,
    phone: String,
    emailVerifiedAt: Date,
    /**
     * Platform-wide role, nothing to do with BusinessMember.role. "admin" can
     * see and manage every business on the platform.
     */
    platformRole: { type: String, enum: ["user", "admin"], default: "user", index: true },
    /** A disabled account cannot sign in, and existing sessions stop working. */
    status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
    disabledAt: Date,
    lastBusinessId: { type: Schema.Types.ObjectId, ref: "Business" },
    onboardedAt: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);

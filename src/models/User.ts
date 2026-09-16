import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    image: String,
    phone: String,
    emailVerifiedAt: Date,
    lastBusinessId: { type: Schema.Types.ObjectId, ref: "Business" },
    onboardedAt: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);

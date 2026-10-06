import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * One phone signed in to the Helabiz mobile app.
 *
 * The row is the session: the app holds a random bearer token and only its
 * SHA-256 hash is stored here, so a database leak hands out no live sessions.
 * Signing out deletes the row, which also stops that phone's push
 * notifications — the Expo push token lives on the same record.
 *
 * Keyed on the user rather than a business: one phone follows every business
 * its user belongs to, and the app picks which one it is looking at.
 */
const MobileDeviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["ios", "android", "web", "unknown"], default: "unknown" },
    deviceName: String,
    /** `ExponentPushToken[…]`, set once the owner allows notifications. */
    pushToken: { type: String, index: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type MobileDeviceDoc = InferSchemaType<typeof MobileDeviceSchema>;
export const MobileDevice =
  (models.MobileDevice as Model<MobileDeviceDoc>) || model<MobileDeviceDoc>("MobileDevice", MobileDeviceSchema);

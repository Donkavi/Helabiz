import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AuditLogSchema = new Schema(
  {
    /** Optional: platform-admin actions are not scoped to one business. */
    businessId: { type: Schema.Types.ObjectId, ref: "Business", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: String,
    entityId: String,
    meta: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true },
);

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema>;
export const AuditLog = (models.AuditLog as Model<AuditLogDoc>) || model<AuditLogDoc>("AuditLog", AuditLogSchema);

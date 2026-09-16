import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ExpenseSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["rent", "salary", "marketing", "packaging", "delivery", "inventory", "utilities", "transport", "other"],
      default: "other",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    notes: String,
    paymentMethod: { type: String, default: "cash" },
    recurring: { type: Boolean, default: false },
    receipt: String,
  },
  { timestamps: true },
);

export type ExpenseDoc = InferSchemaType<typeof ExpenseSchema>;
export const Expense = (models.Expense as Model<ExpenseDoc>) || model<ExpenseDoc>("Expense", ExpenseSchema);

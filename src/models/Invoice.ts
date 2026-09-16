import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const InvoiceSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    invoiceNumber: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customer: { name: String, phone: String, email: String, address: String },
    items: [
      {
        name: String,
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "sent", "paid", "overdue", "void"], default: "draft" },
    issueDate: { type: Date, default: Date.now },
    dueDate: Date,
    notes: String,
  },
  { timestamps: true },
);
InvoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema>;
export const Invoice = (models.Invoice as Model<InvoiceDoc>) || model<InvoiceDoc>("Invoice", InvoiceSchema);

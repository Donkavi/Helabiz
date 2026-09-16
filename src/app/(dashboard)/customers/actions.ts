"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { customerSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";

export async function saveCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId } = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  await connectDB();
  const data = parsed.data;

  const duplicate = await Customer.findOne({
    businessId,
    phone: data.phone.trim(),
    ...(id ? { _id: { $ne: id } } : {}),
  })
    .select("_id")
    .lean();
  if (duplicate) return { ok: false, fieldErrors: { phone: "A customer with this phone number already exists" } };

  const payload = {
    businessId,
    name: data.name,
    phone: data.phone.trim(),
    email: data.email || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    district: data.district || undefined,
    notes: data.notes || undefined,
    type: data.type,
  };

  if (id) await Customer.updateOne({ _id: id, businessId }, { $set: payload });
  else await Customer.create(payload);

  revalidatePath("/customers");
  return { ok: true };
}

export async function deleteCustomerAction(id: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Customer.deleteOne({ _id: id, businessId });
  // Orders keep their embedded customer snapshot, so history is not lost.
  await Order.updateMany({ businessId, customerId: id }, { $unset: { customerId: "" } });
  revalidatePath("/customers");
  return { ok: true as const };
}

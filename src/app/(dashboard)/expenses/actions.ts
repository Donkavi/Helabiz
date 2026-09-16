"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Expense } from "@/models/Expense";
import { expenseSchema } from "@/lib/validations/business";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";

export async function saveExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId } = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  await connectDB();
  const payload = { businessId, ...parsed.data, notes: parsed.data.notes || undefined };

  if (id) await Expense.updateOne({ _id: id, businessId }, { $set: payload });
  else await Expense.create(payload);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { ok: true };
}

export async function deleteExpenseAction(id: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Expense.deleteOne({ _id: id, businessId });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { AccountForm } from "./account-form";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountSettingsPage() {
  const user = await requireUser();
  return <AccountForm initial={{ name: user.name, email: user.email }} />;
}

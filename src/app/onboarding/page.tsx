import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { requireUser, listUserBusinesses } from "@/lib/permissions";
import { CreateBusinessForm } from "./create-business-form";

export const metadata: Metadata = { title: "Create your business" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ another?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;

  // Someone who already has a business only lands here to add another one.
  const businesses = await listUserBusinesses(user.id);
  if (businesses.length > 0 && !params.another) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-10">
        <Logo />

        <div className="flex flex-1 flex-col justify-center py-12">
          <div className="animate-fade-up">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">
              {businesses.length ? "Add a business" : "Step 1 of 1"}
            </p>
            <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em]">
              {businesses.length ? "Create another business" : `Welcome, ${user.name.split(" ")[0]}`}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Tell us about your business. You can change any of this later — and you can run more than one business
              from the same account.
            </p>

            <CreateBusinessForm />
          </div>
        </div>
      </div>
    </div>
  );
}

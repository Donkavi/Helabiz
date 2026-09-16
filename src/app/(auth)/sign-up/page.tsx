import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;

  return (
    <div className="animate-fade-up">
      <h1 className="text-[26px] font-semibold tracking-[-0.025em]">Create your account</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Free forever plan. No card required. You can publish a real website today.
      </p>

      <SignUpForm template={params.template} />

      <p className="mt-5 text-center text-[12px] leading-relaxed text-muted-foreground">
        By creating an account you agree to keep your business data accurate and to use Helabiz lawfully.
      </p>

      <p className="mt-6 text-center text-[13.5px] text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

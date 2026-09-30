import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { googleEnabled } from "@/lib/auth";
import { GoogleButton } from "../google-button";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div className="animate-fade-up">
      <h1 className="text-[26px] font-semibold tracking-[-0.025em]">Welcome back</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">Sign in to manage your business and website.</p>

      {googleEnabled && <GoogleButton label="Continue with Google" redirectTo={params.redirectTo} />}

      <SignInForm redirectTo={params.redirectTo} initialError={params.error ? "Sign in failed. Please try again." : undefined} />

      <p className="mt-7 text-center text-[13.5px] text-muted-foreground">
        New to Helabiz?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

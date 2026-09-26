import type { Metadata } from "next";
import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account disabled", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Where `requireBusiness` sends someone whose account was disabled while they
 * were signed in. Kept vague on purpose — the reason for disabling an account
 * is between the platform and the person, not something to print on a page.
 */
export default function DisabledPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <UserX className="size-6" />
        </span>

        <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em]">This account is disabled</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          You cannot sign in with it at the moment. Nothing has been deleted.
        </p>
        <p className="mt-5 text-[13.5px] text-muted-foreground">
          If you think this is a mistake, reply to any Helabiz email and we will look into it.
        </p>

        <Button variant="outline" className="mt-8" asChild>
          <Link href="/">Helabiz home</Link>
        </Button>
      </div>
    </main>
  );
}

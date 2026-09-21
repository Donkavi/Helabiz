import type { Metadata } from "next";
import Link from "next/link";
import { Ban } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { BusinessMember } from "@/models/BusinessMember";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account suspended", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Where `requireBusiness` sends the owner of a suspended business.
 *
 * It shows the reason an administrator gave, because "it stopped working" with
 * no explanation is the worst version of this. Deliberately not inside the
 * dashboard layout — that layout calls the gate that redirected here.
 */
export default async function SuspendedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <Shell reason={undefined} />;
  }

  await connectDB();
  const membership = await BusinessMember.findOne({ userId: session.user.id, status: "active" })
    .sort({ createdAt: 1 })
    .lean();
  const business = membership
    ? await Business.findById(membership.businessId).select("name status suspendedReason").lean()
    : null;

  // Nothing to be suspended about — send them back to the app.
  if (!business || business.status !== "suspended") {
    return <Shell reason={undefined} resolved />;
  }

  return <Shell name={business.name} reason={business.suspendedReason ?? undefined} />;
}

function Shell({ name, reason, resolved }: { name?: string; reason?: string; resolved?: boolean }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Ban className="size-6" />
        </span>

        {resolved ? (
          <>
            <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em]">You are all set</h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              This account is active. Head back to your dashboard.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em]">
              {name ? `${name} is suspended` : "This account is suspended"}
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              Your dashboard and your website are closed for now. Nothing has been deleted — your products, orders and
              customers are all still here.
            </p>
            {reason && (
              <p className="mt-5 rounded-xl border border-border bg-card px-4 py-3 text-left text-[13.5px]">
                <span className="font-semibold">Reason: </span>
                {reason}
              </p>
            )}
            <p className="mt-5 text-[13.5px] text-muted-foreground">
              Think this is a mistake? Reply to any Helabiz email and we will look into it.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">Back to the dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">Helabiz home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

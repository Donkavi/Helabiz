import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <Link href="/" className="mb-10">
        <Logo />
      </Link>

      <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
        <Compass className="size-5" />
      </span>

      <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.025em]">This page does not exist</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground text-pretty">
        The link may be out of date, or the page may have been moved.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

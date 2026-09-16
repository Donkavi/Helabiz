import Link from "next/link";
import { Globe } from "lucide-react";

export default function SiteNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
        <Globe className="size-5" />
      </span>
      <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.025em]">This page is not available</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        The page you are looking for may have been moved, or this shop has not published its website yet.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-[14px] font-medium text-primary-foreground"
      >
        Go to Helabiz
      </Link>
    </div>
  );
}

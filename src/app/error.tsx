"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  const missingDatabase = error.message.includes("MONGODB_URI");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>

      <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.025em]">
        {missingDatabase ? "The database is not connected" : "Something went wrong"}
      </h1>

      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty">
        {missingDatabase
          ? "Set MONGODB_URI in your environment, or leave it blank in development to use the built-in database."
          : "We hit an unexpected problem. Nothing has been lost — try again, and if it keeps happening let us know."}
      </p>

      {error.digest && <p className="mt-3 font-mono text-[12px] text-muted-foreground">Reference: {error.digest}</p>}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

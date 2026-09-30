"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/access";
import { activateTrialAction } from "./actions";

export function ActivateTrialForm({ canActivate }: { canActivate: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const activate = () => {
    startTransition(async () => {
      const result = await activateTrialAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="mt-8">
      <Button size="lg" className="w-full" onClick={activate} loading={pending} disabled={!canActivate}>
        {pending ? "Starting your trial…" : `Start my ${TRIAL_DAYS}-day free trial`}
        {!pending && <ArrowRight className="size-4" />}
      </Button>

      <p className="mt-3.5 text-center text-[12.5px] text-muted-foreground">
        {canActivate
          ? `No card required. Your ${TRIAL_DAYS} days start the moment you press this.`
          : "Only the business owner can start the trial."}
      </p>
    </div>
  );
}

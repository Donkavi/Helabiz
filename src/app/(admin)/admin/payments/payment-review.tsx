"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approvePaymentAction, rejectPaymentAction } from "../actions";

/**
 * Approve or reject one deposit.
 *
 * Approving is one click because the slip is right there to look at; rejecting
 * asks for a reason first, since the owner reads it verbatim and "declined"
 * on its own tells them nothing they can act on.
 */
export function PaymentReview({
  paymentId,
  reference,
  businessName,
  slipUrl,
}: {
  paymentId: string;
  reference: string;
  businessName: string;
  slipUrl?: string;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const run = (work: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(result.error ?? "That did not work");
        return;
      }
      toast.success(result.message ?? "Done");
      setRejecting(false);
      setNote("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {slipUrl && (
        <Button size="sm" variant="outline" asChild>
          <a href={slipUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" />
            Slip
          </a>
        </Button>
      )}

      <Button size="sm" loading={pending} onClick={() => run(() => approvePaymentAction(paymentId))}>
        <Check className="size-3.5" />
        Approve
      </Button>

      <Button size="sm" variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
        <X className="size-3.5" />
        Reject
      </Button>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {reference}?</DialogTitle>
            <DialogDescription>
              {businessName} will see this reason on their billing screen and as a notification. Tell them what to fix.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="reject-note">Reason</Label>
            <Input
              id="reject-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="The slip shows Rs. 500, but the Starter plan is Rs. 999."
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() => run(() => rejectPaymentAction(paymentId, note))}
            >
              Reject payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLAN_LIST } from "@/lib/plans";
import { changePlanAction, restoreBusinessAction, suspendBusinessAction } from "../../actions";
import type { AdminResult } from "../../actions";

/**
 * The controls that change another business's account.
 *
 * Suspension asks for a written reason rather than being a single click — the
 * owner is shown it, and the audit log keeps it.
 */
export function BusinessControls({
  businessId,
  name,
  plan,
  status,
}: {
  businessId: string;
  name: string;
  plan: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [suspendOpen, setSuspendOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const run = (action: () => Promise<AdminResult>, onDone?: () => void) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        onDone?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="plan" className="text-[13px] font-medium">
          Plan
        </label>
        <Select
          value={plan}
          disabled={pending}
          onValueChange={(next) => next !== plan && run(() => changePlanAction(businessId, next))}
        >
          <SelectTrigger id="plan" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_LIST.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Takes effect immediately — limits and premium templates follow the plan.
        </p>
      </div>

      <div className="border-t border-border pt-4">
        {status === "suspended" ? (
          <>
            <p className="text-[13px] font-medium">Suspended</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              The owner cannot open the dashboard and the public site returns nothing.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={pending}
              onClick={() => run(() => restoreBusinessAction(businessId))}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Restore access
            </Button>
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium">Suspend this business</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Closes the dashboard and takes the published site offline. Nothing is deleted.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setSuspendOpen(true)}>
              <Ban className="size-3.5" />
              Suspend
            </Button>
          </>
        )}
      </div>

      <Dialog open={suspendOpen} onOpenChange={(next) => !pending && setSuspendOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {name}?</DialogTitle>
            <DialogDescription>
              The owner loses the dashboard and {name}&apos;s website stops serving. Their data is untouched and you can
              restore it at any time.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label htmlFor="reason" className="text-[13px] font-medium">
              Reason
            </label>
            <Textarea
              id="reason"
              rows={3}
              className="mt-1.5"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Shown to the owner, and kept in the audit log."
            />
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-[12.5px] text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            If they have a published shop, their customers will see nothing from the moment you confirm.
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || reason.trim().length < 3}
              onClick={() =>
                run(() => suspendBusinessAction(businessId, reason), () => {
                  setSuspendOpen(false);
                  setReason("");
                })
              }
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

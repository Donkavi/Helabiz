"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Info, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REQUEST_STATUS_ADMIN_LABELS, type RequestStatus } from "@/lib/website-request";
import { updateWebsiteRequestAction, type SupportResult } from "../../support/actions";
import { SupportAccess } from "../../support/support-access";

const STATUSES = Object.keys(REQUEST_STATUS_ADMIN_LABELS) as RequestStatus[];

/**
 * Working a website request: moving its status, the team's private notes, and
 * getting into the business to build the site.
 *
 * Status has its own Save rather than saving on change: moving it on posts a
 * message to the business, and closing it ends support access.
 */
export function RequestControls({
  requestId,
  businessId,
  status,
  adminNotes,
  supportAccess,
}: {
  requestId: string;
  businessId: string;
  status: RequestStatus;
  adminNotes: string;
  supportAccess: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [nextStatus, setNextStatus] = React.useState(status);
  const [notes, setNotes] = React.useState(adminNotes);
  const closed = status === "done" || status === "cancelled";

  const run = (action: () => Promise<SupportResult>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="request-status" className="text-[13px] font-medium">
          Status
        </label>
        <div className="mt-1.5 flex gap-2">
          <Select
            value={nextStatus}
            disabled={pending}
            onValueChange={(value) => setNextStatus(value as RequestStatus)}
          >
            <SelectTrigger id="request-status" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {REQUEST_STATUS_ADMIN_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={pending || nextStatus === status}
            onClick={() => run(() => updateWebsiteRequestAction(requestId, { status: nextStatus }))}
          >
            <Save className="size-3.5" />
            Save
          </Button>
        </div>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Building, Done and Cancelled post a message to the business&apos;s chat. Done or Cancelled also ends the
          team&apos;s support access.
        </p>
      </div>

      <div className="border-t border-border pt-4">
        <label htmlFor="admin-notes" className="text-[13px] font-medium">
          Team notes
        </label>
        <Textarea
          id="admin-notes"
          rows={4}
          className="mt-1.5"
          value={notes}
          maxLength={4000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Called on Monday, sending photos on WhatsApp…"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">Private to the Helabiz team.</p>
          <Button
            size="sm"
            variant="outline"
            disabled={pending || notes === adminNotes}
            onClick={() => run(() => updateWebsiteRequestAction(requestId, { adminNotes: notes }))}
          >
            Save notes
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-[13px] font-medium">
          {supportAccess ? "You have support access" : closed ? "Support access" : "Build this website"}
        </p>
        <p className="mt-1 flex items-start gap-2 text-[12.5px] text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {supportAccess
            ? "Open their dashboard to keep working in the normal builder. Marking the request Done removes your access."
            : closed
              ? "This request is closed. Opening their dashboard adds you to the business as “Helabiz support” again — the owner can see this."
              : "You will be added to the business as “Helabiz support” — the owner can see this in their team — and taken to their website builder. Marking the request Done removes the access."}
        </p>
        <div className="mt-3">
          <SupportAccess
            businessId={businessId}
            hasAccess={supportAccess}
            openLabel={supportAccess || closed ? "Open their dashboard" : "Build this website"}
          />
        </div>
      </div>
    </div>
  );
}

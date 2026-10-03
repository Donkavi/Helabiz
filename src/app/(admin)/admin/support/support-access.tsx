"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LayoutDashboard, LogOut, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  grantSupportAccessAction,
  openBusinessAsSupportAction,
  revokeSupportAccessAction,
  type SupportResult,
} from "./actions";

/**
 * Getting into a business as "Helabiz support", and getting out again.
 *
 * "Open their dashboard" grants access when needed and switches the admin's
 * active business, so from there the normal builder is the tool. It redirects
 * on success; only a failure comes back here.
 */
export function SupportAccess({
  businessId,
  hasAccess,
  othersHaveAccess = false,
  allowGrant = false,
  openLabel = "Open their dashboard",
  size = "sm",
}: {
  businessId: string;
  /** Whether the signed-in admin can open the business right now. */
  hasAccess: boolean;
  /** Other team members hold support access too — offers ending it for all. */
  othersHaveAccess?: boolean;
  /** Offers granting access without leaving the admin panel. */
  allowGrant?: boolean;
  openLabel?: string;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [opening, setOpening] = React.useState(false);

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

  const open = () => {
    setOpening(true);
    startTransition(async () => {
      const result = await openBusinessAsSupportAction(businessId);
      // Success redirects to the dashboard; anything that returns is a failure.
      if (result && !result.ok) {
        toast.error(result.error);
        setOpening(false);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size={size} loading={opening} disabled={pending} onClick={open}>
        {!opening && <LayoutDashboard className="size-3.5" />}
        {openLabel}
      </Button>

      {!hasAccess && allowGrant && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run(() => grantSupportAccessAction(businessId))}
        >
          <KeyRound className="size-3.5" />
          Grant access only
        </Button>
      )}

      {hasAccess && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run(() => revokeSupportAccessAction(businessId))}
        >
          <LogOut className="size-3.5" />
          End my support access
        </Button>
      )}

      {othersHaveAccess && (
        <Button
          size={size}
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => revokeSupportAccessAction(businessId, true))}
        >
          <UserX className="size-3.5" />
          End for the whole team
        </Button>
      )}
    </div>
  );
}

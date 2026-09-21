"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setPlatformRoleAction } from "../actions";

/**
 * Grants or removes platform administrator access.
 *
 * Promoting asks for confirmation because it hands someone every business on
 * the platform — the dialog says so in those words rather than "are you sure".
 */
export function RoleToggle({
  userId,
  name,
  role,
  isSelf,
}: {
  userId: string;
  name: string;
  role: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  const isAdmin = role === "admin";
  const next = isAdmin ? "user" : "admin";

  const apply = () => {
    startTransition(async () => {
      const result = await setPlatformRoleAction(userId, next);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Your own access is deliberately not removable from here; the action refuses
  // it too, so the button being absent is a courtesy rather than the guard.
  if (isSelf) return <Badge variant="default">Administrator</Badge>;

  return (
    <>
      <Button variant={isAdmin ? "outline" : "ghost"} size="sm" onClick={() => setOpen(true)}>
        {isAdmin ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
        {isAdmin ? "Remove admin" : "Make admin"}
      </Button>

      <Dialog open={open} onOpenChange={(value) => !pending && setOpen(value)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{isAdmin ? `Remove ${name}'s access?` : `Make ${name} an administrator?`}</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "They will lose the admin panel. Their own business account is not affected."
                : "They will be able to see every business on the platform, change plans and suspend accounts."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant={isAdmin ? "destructive" : "default"} onClick={apply} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isAdmin ? "Remove access" : "Grant access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

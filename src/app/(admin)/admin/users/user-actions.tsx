"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteUserAction,
  setPlatformRoleAction,
  setUserStatusAction,
  updateUserAction,
} from "../actions";
import type { AdminResult } from "../actions";

/**
 * Everything an admin can do to one account, behind one menu.
 *
 * The menu hides what is not allowed, but each rule is enforced in the action
 * as well — you cannot disable or delete yourself, demote the last admin, or
 * delete someone who still owns a business.
 */
export function UserActions({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; phone?: string; platformRole: string; status: string };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [values, setValues] = React.useState({ name: user.name, email: user.email, phone: user.phone ?? "" });
  const [confirmation, setConfirmation] = React.useState("");

  const isAdmin = user.platformRole === "admin";
  const isDisabled = user.status === "disabled";

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Manage ${user.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() => {
              setValues({ name: user.name, email: user.email, phone: user.phone ?? "" });
              setEditOpen(true);
            }}
          >
            <Pencil /> Edit details
          </DropdownMenuItem>

          {!isSelf && (
            <DropdownMenuItem
              onSelect={() => run(() => setPlatformRoleAction(user.id, isAdmin ? "user" : "admin"))}
            >
              {isAdmin ? <ShieldOff /> : <ShieldCheck />}
              {isAdmin ? "Remove admin" : "Make admin"}
            </DropdownMenuItem>
          )}

          {!isSelf && (
            <DropdownMenuItem
              onSelect={() => run(() => setUserStatusAction(user.id, isDisabled ? "active" : "disabled"))}
            >
              {isDisabled ? <UserCheck /> : <UserX />}
              {isDisabled ? "Enable sign-in" : "Disable sign-in"}
            </DropdownMenuItem>
          )}

          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setConfirmation("");
                  setDeleteOpen(true);
                }}
              >
                <Trash2 /> Delete account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => !pending && setEditOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {user.name}</DialogTitle>
            <DialogDescription>The email is how they sign in — changing it changes their login.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                className="mt-1.5"
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                className="mt-1.5"
                value={values.email}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone"
                className="mt-1.5"
                value={values.phone}
                onChange={(event) => setValues({ ...values, phone: event.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => run(() => updateUserAction(user.id, values), () => setEditOpen(false))} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !pending && setDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {user.name}?</DialogTitle>
            <DialogDescription>
              Their account and every business membership go. This cannot be undone. If they own a business, delete that
              first — otherwise it would be left with no owner.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="user-confirm">
              Type <span className="font-semibold">{user.email}</span> to confirm
            </Label>
            <Input
              id="user-confirm"
              className="mt-1.5"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirmation.trim().toLowerCase() !== user.email.toLowerCase()}
              onClick={() => run(() => deleteUserAction(user.id, confirmation), () => setDeleteOpen(false))}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionState } from "@/lib/validations/errors";
import { saveAccountAction } from "../actions";

export function AccountForm({ initial }: { initial: { name: string; email: string } }) {
  const router = useRouter();
  const { update } = useSession();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAccountAction, null);
  const [name, setName] = React.useState(initial.name);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Account updated");
      // Refresh the JWT so the new name shows in the top bar immediately.
      void update({ name });
      router.refresh();
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
    // `name` is intentionally read fresh rather than tracked, to avoid re-firing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-[12.5px] text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-email">Email</Label>
              <Input id="account-email" value={initial.email} disabled />
              <p className="text-[12.5px] text-muted-foreground">
                Your email is how you sign in and cannot be changed here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">Leave blank to keep your current password.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
              />
              {errors.currentPassword && (
                <p className="text-[12.5px] text-destructive">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
              />
              {errors.newPassword && <p className="text-[12.5px] text-destructive">{errors.newPassword}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            Save changes
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
          <p className="text-[13.5px] text-muted-foreground">Sign out of Helabiz on this device.</p>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

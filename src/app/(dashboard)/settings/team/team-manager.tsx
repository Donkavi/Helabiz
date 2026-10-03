"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Copy, HeartHandshake, KeyRound, MoreHorizontal, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, relativeTime } from "@/lib/utils";
import { addStaffAction, changeRoleAction, removeMemberAction, setStatusAction, type AddStaffState } from "./actions";
import type { TeamMember } from "@/services/team-service";
import { useLang } from "@/lib/i18n/provider";
import { SUPPORT_UI } from "@/components/dashboard/support/copy";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
};

const ROLE_HELP: Record<string, string> = {
  owner: "Everything, including billing.",
  admin: "Everything except billing.",
  staff: "Day-to-day work: orders, products, customers.",
};

/** The credentials panel, shown once after a new account is made. */
function HandoverPanel({ name, email, password, onDone }: { name: string; email: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Helabiz sign-in\nEmail: ${email}\nPassword: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy — write it down instead.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-[13px] text-warning">
        <KeyRound className="mt-px size-4 shrink-0" />
        <span>
          This password is shown once. Give it to {name} now — they can change it from their own account screen.
        </span>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
          <span className="text-[12.5px] text-muted-foreground">Email</span>
          <span className="text-[13.5px] font-medium">{email}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-[12.5px] text-muted-foreground">Temporary password</span>
          <span className="font-mono text-[14px] font-semibold tracking-wide">{password}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy sign-in details"}
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

function AddStaffDialog({ canGrantAdmin, full }: { canGrantAdmin: boolean; full: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<AddStaffState, FormData>(addStaffAction, null);

  const handover = state?.ok && !state.result.linkedExisting ? state.result : null;
  // An existing Helabiz account keeps its own password, so there is nothing to
  // hand over — just confirmation that they are in.
  const linked = state?.ok && state.result.linkedExisting ? state.result : null;

  const close = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={full}>
        <UserPlus className="size-4" />
        Add staff account
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {handover ? "Account created" : linked ? "They are in" : "Add a staff account"}
            </DialogTitle>
            <DialogDescription>
              {handover
                ? "Pass these details on so they can sign in."
                : linked
                  ? `${linked.name} already had a Helabiz account, so they keep their own password.`
                  : "They get their own sign-in. If the email already has a Helabiz account, we attach that instead."}
            </DialogDescription>
          </DialogHeader>

          {handover ? (
            <HandoverPanel name={handover.name} email={handover.email} password={handover.password} onDone={close} />
          ) : linked ? (
            <div className="space-y-4">
              <p className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-[13px] text-success">
                <Check className="mt-px size-4 shrink-0" />
                {linked.name} can now sign in and see this business.
              </p>
              <DialogFooter>
                <Button onClick={close}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form action={action} className="space-y-4" noValidate>
              {state && !state.ok && state.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-[13px] text-destructive"
                >
                  <AlertCircle className="mt-px size-4 shrink-0" />
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">Their name</Label>
                <Input id="name" name="name" placeholder="Nimali Perera" required autoFocus />
                {state && !state.ok && state.fieldErrors?.name && (
                  <p className="text-[12.5px] text-destructive">{state.fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Their email</Label>
                <Input id="email" name="email" type="email" placeholder="nimali@example.com" required />
                {state && !state.ok && state.fieldErrors?.email && (
                  <p className="text-[12.5px] text-destructive">{state.fieldErrors.email}</p>
                )}
              </div>

              <fieldset className="space-y-2">
                <legend className="text-[13.5px] font-medium">What can they do?</legend>
                {(canGrantAdmin ? ["staff", "admin"] : ["staff"]).map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent/40 has-[:checked]:border-primary/55 has-[:checked]:bg-primary-muted/30"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      defaultChecked={value === "staff"}
                      className="mt-0.5 size-4 accent-[var(--primary)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium">{ROLE_LABEL[value]}</span>
                      <span className="block text-[12.5px] text-muted-foreground">{ROLE_HELP[value]}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={close} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  {pending ? "Creating…" : "Create account"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TeamManager({
  members,
  canManage,
  isOwner,
  used,
  limit,
}: {
  members: TeamMember[];
  canManage: boolean;
  isOwner: boolean;
  used: number;
  limit: number;
}) {
  const router = useRouter();
  const support = SUPPORT_UI[useLang()];
  const [pending, startTransition] = React.useTransition();
  const [confirmRemove, setConfirmRemove] = React.useState<TeamMember | null>(null);

  const full = Number.isFinite(limit) && used >= limit;

  const run = (work: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(result.error ?? "That did not work");
        return;
      }
      toast.success(result.message ?? "Done");
      setConfirmRemove(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-muted-foreground">
          {used} of {Number.isFinite(limit) ? limit : "unlimited"} staff accounts used.
          {full && " Upgrade your plan to add more."}
        </p>
        {canManage && <AddStaffDialog canGrantAdmin={isOwner} full={full} />}
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar className="size-9 shrink-0">
              {member.image && <AvatarImage src={member.image} alt="" />}
              <AvatarFallback>{(member.name || member.email).slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[14px] font-medium">
                <span className="truncate">{member.name}</span>
                {member.isSelf && (
                  <Badge variant="muted" className="shrink-0">
                    You
                  </Badge>
                )}
              </p>
              <p className="truncate text-[12.5px] text-muted-foreground">
                {member.support ? support.supportNote : member.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {member.status === "disabled" && <Badge variant="destructive">Turned off</Badge>}
              {member.support ? (
                <Badge variant="soft">
                  <HeartHandshake className="size-3" />
                  {support.supportBadge}
                </Badge>
              ) : (
                <Badge variant={member.role === "owner" ? "soft" : member.role === "admin" ? "info" : "muted"}>
                  {member.role === "owner" && <ShieldCheck className="size-3" />}
                  {ROLE_LABEL[member.role]}
                </Badge>
              )}
              <span className="hidden w-28 shrink-0 text-right text-[12px] text-muted-foreground sm:block">
                {relativeTime(member.joinedAt)}
              </span>

              {canManage && member.role !== "owner" && !member.isSelf ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Manage ${member.name}`}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Helabiz support comes and goes with the job: removing is the only choice. */}
                    {member.support ? (
                      <DropdownMenuItem variant="destructive" onClick={() => setConfirmRemove(member)}>
                        Remove from business
                      </DropdownMenuItem>
                    ) : (
                      <>
                        {member.role === "staff" && isOwner && (
                          <DropdownMenuItem onClick={() => run(() => changeRoleAction(member.id, "admin"))}>
                            Make an admin
                          </DropdownMenuItem>
                        )}
                        {member.role === "admin" && isOwner && (
                          <DropdownMenuItem onClick={() => run(() => changeRoleAction(member.id, "staff"))}>
                            Change to staff
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            run(() => setStatusAction(member.id, member.status === "disabled" ? "active" : "disabled"))
                          }
                        >
                          {member.status === "disabled" ? "Turn account back on" : "Turn account off"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setConfirmRemove(member)}>
                          Remove from business
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className={cn("size-8", !canManage && "hidden")} aria-hidden />
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(confirmRemove)} onOpenChange={(next) => !next && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {confirmRemove?.name}?</DialogTitle>
            <DialogDescription>
              {confirmRemove?.support
                ? support.removeSupportBody
                : "They lose access to this business straight away. Their Helabiz account stays, along with anything they have already recorded here."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRemove(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() => confirmRemove && run(() => removeMemberAction(confirmRemove.id))}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

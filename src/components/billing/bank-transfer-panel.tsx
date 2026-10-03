"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Check, Copy, FileUp, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { ADDON_LIST, addonsTotal, type AddonId } from "@/lib/addons";
import { formatCurrency, cn } from "@/lib/utils";
import { startPaymentAction, uploadSlipAction } from "@/lib/billing/actions";
import type { BankDetails } from "@/lib/bank";

export type OpenPayment = {
  id: string;
  reference: string;
  amount: number;
  plan: string;
  addons: string[];
  status: string;
  slipName?: string;
};

type Props = {
  bank: BankDetails | null;
  /** A payment already opened, and possibly already awaiting review. */
  open: OpenPayment | null;
  /** Why the last attempt was turned down, if it was. */
  rejected?: { reference: string; note: string } | null;
  canManage: boolean;
  /** Preselect a plan — a renewal screen knows which one lapsed. */
  initialPlan?: string;
  /** Add-ons already paid for, which need buying again only once they lapse. */
  activeAddons?: string[];
  /** The add-ons on sale; defaults to all of them. */
  offeredAddons?: string[];
  /** Add-ons the owner arrived asking for, e.g. straight from building a site. */
  requestedAddons?: string[];
  /** On a paid plan the plan step is optional: add-ons can be bought alone. */
  planOptional?: boolean;
  /**
   * A plan the owner just asked for, from the plan cards below. It wins over
   * an open payment for a different plan, because clicking "Choose Business"
   * and being shown a Starter reference would be a trap.
   */
  requestedPlan?: string;
};

/** One line of the account. Nobody wants to retype an account number by hand. */
function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy — select the text instead.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[13.5px] font-medium tabular-nums">{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            aria-label={"Copy " + label}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </span>
    </div>
  );
}

/**
 * Pay by bank deposit, in three steps: pick a plan, deposit the money against
 * a reference, send the slip. The plan only starts once an administrator has
 * matched the slip to the deposit, so nothing here grants access by itself.
 */
export function BankTransferPanel({
  bank,
  open,
  rejected,
  canManage,
  initialPlan,
  requestedPlan,
  activeAddons = [],
  offeredAddons,
  requestedAddons = [],
  planOptional,
}: Props) {
  const router = useRouter();
  const paidPlans = [PLANS.starter, PLANS.business];

  // On a paid plan, "" means "not buying a plan this time, only add-ons".
  //
  // Someone who came here to buy an add-on must not be quietly charged for a
  // plan renewal as well, so an add-on request leaves the plan unticked while
  // the current one is still running.
  const [plan, setPlan] = React.useState(() => {
    if (requestedPlan) return requestedPlan;
    if (open?.plan) return open.plan;
    if (requestedAddons.length > 0 && planOptional) return "";
    return initialPlan ?? (planOptional ? "" : "starter");
  });
  const [addons, setAddons] = React.useState<string[]>(
    () => open?.addons ?? requestedAddons.filter((id) => !activeAddons.includes(id)),
  );
  // An open payment only survives if it is for the basket being shown.
  const [payment, setPayment] = React.useState<OpenPayment | null>(
    (requestedPlan && open && open.plan !== requestedPlan) || (requestedAddons.length > 0 && open) ? null : open,
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [pending, startTransition] = React.useTransition();

  const awaitingReview = payment?.status === "review";
  const chosen = PLANS[plan as "starter" | "business"] ?? null;
  const total = (chosen?.price ?? 0) + addonsTotal(addons);
  const nothingChosen = !plan && addons.length === 0;

  // Changing the basket drops the open payment, so the reference and the
  // amount on screen always describe the same thing the owner is depositing.
  const reset = () => {
    setPayment(null);
    setFile(null);
  };

  const choose = (next: string) => {
    if (awaitingReview) return;
    // Where the plan is optional, clicking the chosen one again unticks it.
    setPlan(planOptional && next === plan ? "" : next);
    reset();
  };

  const toggleAddon = (id: AddonId) => {
    if (awaitingReview) return;
    setAddons((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
    reset();
  };

  const openPayment = () => {
    startTransition(async () => {
      const result = await startPaymentAction({ plan: plan || null, addons });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPayment(result.payment);
    });
  };

  const send = () => {
    if (!payment || !file) return;
    startTransition(async () => {
      const body = new FormData();
      body.append("paymentId", payment.id);
      body.append("slip", file);

      const result = await uploadSlipAction(body);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Slip received. We will confirm it shortly.");
      setPayment({ ...payment, status: "review", slipName: file.name });
      setFile(null);
      router.refresh();
    });
  };

  if (!bank) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-[13px] text-muted-foreground">
        Bank transfer is not set up on this installation yet. Ask the Helabiz team how to pay.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rejected && !awaitingReview && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-[13px] text-destructive"
        >
          <AlertCircle className="mt-px size-4 shrink-0" />
          <span>
            <span className="font-semibold">Payment {rejected.reference} was not confirmed. </span>
            {rejected.note}
          </span>
        </div>
      )}

      <section>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          1. Choose your plan{planOptional ? " (optional)" : ""}
        </p>
        <div role="radiogroup" aria-label="Choose a plan" className="mt-3 grid gap-3 sm:grid-cols-2">
          {paidPlans.map((option) => {
            const selected = option.id === plan;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!canManage || awaitingReview}
                onClick={() => choose(option.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all duration-150 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  "disabled:pointer-events-none disabled:opacity-60",
                  selected
                    ? "border-primary/55 bg-primary-muted/40"
                    : "border-border bg-background hover:border-border/70 hover:bg-accent/40",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[14.5px] font-semibold">{option.name}</span>
                  <span
                    className={cn(
                      "flex size-4.5 items-center justify-center rounded-full border transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="size-3" />}
                  </span>
                </span>
                <span className="mt-2 block text-[21px] font-semibold tracking-[-0.03em]">
                  {formatCurrency(option.price, { decimals: false })}
                  <span className="text-[12.5px] font-normal text-muted-foreground"> /month</span>
                </span>
                <span className="mt-1.5 block text-[12.5px] text-muted-foreground">{option.tagline}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          2. Website add-ons (optional)
        </p>

        <div className="mt-3 space-y-2">
          {ADDON_LIST.filter((addon) => !offeredAddons || offeredAddons.includes(addon.id)).map((addon) => {
            const already = activeAddons.includes(addon.id);
            const ticked = addons.includes(addon.id);
            return (
              <label
                key={addon.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 transition-colors",
                  already
                    ? "border-border bg-muted/40"
                    : ticked
                      ? "cursor-pointer border-primary/55 bg-primary-muted/30"
                      : "cursor-pointer border-border bg-background hover:bg-accent/40",
                  (!canManage || awaitingReview) && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  checked={already || ticked}
                  disabled={already || !canManage || awaitingReview}
                  onChange={() => toggleAddon(addon.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium">{addon.name}</span>
                    {already ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">
                        {formatCurrency(addon.price, { decimals: false })}/month
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                    {addon.tagline}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          3. Deposit {formatCurrency(total, { decimals: false })}
        </p>

        <div className="mt-3 rounded-2xl border border-border bg-background p-4">
          <p className="flex flex-wrap items-center gap-x-2 text-[13.5px] font-semibold">
            <Building2 className="size-4 text-primary" />
            {bank.bank}
            {bank.branch && <span className="font-normal text-muted-foreground">· {bank.branch}</span>}
          </p>

          <div className="mt-2">
            <DetailRow label="Account name" value={bank.accountName} />
            <DetailRow label="Account number" value={bank.accountNumber} copyable />
            <DetailRow label="Amount" value={formatCurrency(total, { decimals: false })} />
            {payment && <DetailRow label="Reference" value={payment.reference} copyable />}
          </div>

          {payment ? (
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              Write <span className="font-semibold text-foreground">{payment.reference}</span> on the deposit slip so we
              can match it to your shop.
            </p>
          ) : (
            <Button
              className="mt-4 w-full"
              onClick={openPayment}
              loading={pending}
              disabled={!canManage || nothingChosen}
            >
              {pending
                ? "Getting your reference…"
                : nothingChosen
                  ? "Choose something first"
                  : "Get my payment reference"}
            </Button>
          )}
        </div>
      </section>

      <section className={cn(!payment && "pointer-events-none opacity-50")}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">4. Send the slip</p>

        {awaitingReview ? (
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-info/25 bg-info/8 p-4">
            <Hourglass className="mt-0.5 size-4 shrink-0 text-info" />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-info">Slip received — we are checking it</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                {payment?.slipName ? payment.slipName + " is with our team. " : ""}
                Your plan starts as soon as it is confirmed, usually within a working day, and you will get a
                notification here the moment it does.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-background p-4">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/50",
                !canManage && "pointer-events-none",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <FileUp className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">
                  {file ? file.name : "Choose your deposit slip"}
                </span>
                <span className="block text-[12px] text-muted-foreground">JPG, PNG or PDF, up to 6MB</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <Button className="mt-3 w-full" onClick={send} disabled={!file || !payment || !canManage} loading={pending}>
              {pending ? "Sending…" : "Send slip for confirmation"}
            </Button>
          </div>
        )}
      </section>

      {!canManage && <p className="text-center text-[12.5px] text-muted-foreground">Only the business owner can pay.</p>}
    </div>
  );
}

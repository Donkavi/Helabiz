"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAN_LIST, UNLIMITED, limitLabel, type Plan } from "@/lib/plans";
import { formatCurrency, cn } from "@/lib/utils";

/** What a plan limit is called, and which field on a plan governs it. */
const LIMITS = {
  pages: { noun: "pages", field: "pages" },
  products: { noun: "products", field: "products" },
  orders: { noun: "orders this month", field: "ordersPerMonth" },
  websites: { noun: "websites", field: "websites" },
  team: { noun: "staff accounts", field: "teamMembers" },
} as const satisfies Record<string, { noun: string; field: keyof Plan["limits"] }>;

export type LimitBlockInfo = {
  key: keyof typeof LIMITS;
  used: number;
  max: number;
  planId: string;
  planName: string;
  message: string;
};

function allowanceOf(plan: Plan, key: keyof typeof LIMITS) {
  return plan.limits[LIMITS[key].field] as number;
}

/**
 * Shown when an action is refused by the plan (spec §41). It names the limit,
 * then offers the cheapest plan that actually lifts it — so the way forward is
 * a decision, not a dead end.
 */
export function PlanLimitDialog({
  block,
  onOpenChange,
  action = "add another",
}: {
  block: LimitBlockInfo | null;
  onOpenChange: (open: boolean) => void;
  /** Completes "…to <action>", e.g. "add another page". */
  action?: string;
}) {
  if (!block) return null;

  const noun = LIMITS[block.key].noun;
  const current = allowanceOf(
    PLAN_LIST.find((p) => p.id === block.planId) ?? PLAN_LIST[0],
    block.key,
  );

  // The cheapest plan that raises this particular allowance.
  const upgrades = PLAN_LIST.filter((plan) => plan.id !== block.planId && allowanceOf(plan, block.key) > current);
  const recommended = upgrades[0];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-warning/12 text-warning">
            <Lock className="size-4.5" />
          </span>
          <DialogTitle>You have used all your {noun}</DialogTitle>
          <DialogDescription className="text-pretty">
            {block.message} Upgrade to {action}, or free one up by deleting an existing one.
          </DialogDescription>
        </DialogHeader>

        {/* Where they stand today */}
        <div className="rounded-xl border border-border bg-muted/40 p-3.5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-muted-foreground">
              {block.planName} plan · {noun}
            </span>
            <span className="font-semibold tabular-nums">
              {block.used} / {limitLabel(block.max)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-warning" />
          </div>
        </div>

        {upgrades.length > 0 && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {upgrades.map((plan) => {
              const allowance = allowanceOf(plan, block.key);
              const best = plan.id === recommended?.id;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-xl border p-4",
                    best ? "border-primary/45 bg-primary-muted/25" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold">{plan.name}</p>
                    {best && <Badge variant="soft">Recommended</Badge>}
                  </div>

                  <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">
                    {formatCurrency(plan.price, { decimals: false })}
                    <span className="text-[12.5px] font-normal text-muted-foreground">/month</span>
                  </p>

                  <p className="mt-3 flex items-start gap-2 text-[13px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>
                      <span className="font-semibold">
                        {allowance === UNLIMITED ? "Unlimited" : allowance.toLocaleString("en-LK")}
                      </span>{" "}
                      {noun}
                    </span>
                  </p>
                  <p className="mt-1.5 flex items-start gap-2 text-[13px] text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {plan.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link href="/settings/billing">
              <Sparkles className="size-4" />
              {recommended ? `Upgrade to ${recommended.name}` : "See plans"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, HeartHandshake, MessageCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n/provider";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/website-request";
import { cn } from "@/lib/utils";
import { SUPPORT_UI } from "./copy";
import { WebsiteRequestDialog } from "./website-request-dialog";

/**
 * "We'll build your website for you", offered wherever someone is about to
 * face the builder alone: the dashboard home, the website overview and the
 * "no website yet" screen.
 *
 * Once they have asked, the same spot shows how their request is going and
 * leads to the chat instead. A cancelled request offers help again.
 *
 * - `card`: the full offer, with its reasons.
 * - `slim`: one line, for a screen that already has plenty to read.
 */
export function WebsiteHelpBanner({
  status,
  defaultPhone,
  variant = "card",
  className,
}: {
  /** The latest request's status, if they have made one. */
  status?: RequestStatus | null;
  defaultPhone?: string;
  variant?: "card" | "slim";
  className?: string;
}) {
  const lang = useLang();
  const copy = SUPPORT_UI[lang];
  const [open, setOpen] = React.useState(false);
  const requested = Boolean(status && status !== "cancelled");

  return (
    <>
      {requested && status ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-muted/30 px-4 py-3.5 sm:px-5",
            className,
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {status === "done" ? <Check className="size-4" /> : <HeartHandshake className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              {copy.requestTitle}
            </p>
            <p className="mt-0.5 text-[14px] font-semibold">{REQUEST_STATUS_LABELS[status][lang]}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/support">
              <MessageCircle className="size-3.5" />
              {copy.chatWithTeam}
            </Link>
          </Button>
        </div>
      ) : variant === "slim" ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-gradient-to-r from-primary-muted/60 to-card px-4 py-3.5 sm:px-5",
            className,
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartHandshake className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-snug">{copy.offerTitle}</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{copy.benefits.join(" · ")}</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Wand2 className="size-3.5" />
            {copy.offerCta}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary-muted/70 via-card to-card p-5 sm:p-6",
            className,
          )}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <HeartHandshake className="size-5" />
            </span>
            <div className="min-w-0 flex-1 basis-72">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">{copy.offerEyebrow}</p>
              <h2 className="mt-1 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{copy.offerTitle}</h2>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {copy.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={() => setOpen(true)} className="shrink-0">
              {copy.offerCta}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Outside the branches above: sending the request turns the offer into
          its status, and the thank-you must survive that. */}
      <WebsiteRequestDialog open={open} onOpenChange={setOpen} defaultPhone={defaultPhone} />
    </>
  );
}

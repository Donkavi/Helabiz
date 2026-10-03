"use client";

import * as React from "react";
import { Mascot } from "page-mascot";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTour } from "@/components/dashboard/tour/tour";
import { useLang } from "@/lib/i18n/provider";
import { SUPPORT_UI } from "./copy";
import { WebsiteRequestDialog } from "./website-request-dialog";
import { WEBSITE_HELP_DISMISSED } from "./website-help-nudge";

/** After the guided tour, or the page settling if there is none. */
const OPEN_DELAY = 1500;
const SNOOZE_KEY = "helabiz:website-help-snoozed-until";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function snoozed() {
  try {
    const until = Number(window.localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // Without storage it simply asks again next visit.
  }
}

/**
 * The dashboard's once-a-week nudge: "Not into drag and drop? We'll build
 * your website for you."
 *
 * Shown to a business that has never asked — published website or not, since
 * a live site the owner struggles to edit needs the team just as much — and never on top of the guided tour — it waits until no tour is
 * running, so on a first visit it follows the tour rather than fighting it.
 * Dismissing it in any way snoozes it for a week on this browser.
 *
 * Mount it unconditionally and pass `eligible`: sending the request flips
 * eligibility on the server, and the thank-you must not vanish with it.
 */
export function WebsiteHelpPopup({ eligible, defaultPhone }: { eligible: boolean; defaultPhone?: string }) {
  const lang = useLang();
  const copy = SUPPORT_UI[lang];
  const { active } = useTour();
  const [open, setOpen] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (!eligible || active || shown.current) return;
    // A tour starting before this fires clears it; one finishing starts it again.
    const timer = window.setTimeout(() => {
      if (snoozed()) return;
      shown.current = true;
      setOpen(true);
    }, OPEN_DELAY);
    return () => window.clearTimeout(timer);
  }, [eligible, active]);

  const dismiss = () => {
    snooze();
    setOpen(false);
    // The corner card has just asked the same thing; it shrinks rather than ask again.
    window.dispatchEvent(new Event(WEBSITE_HELP_DISMISSED));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
        <DialogContent
          size="md"
          // The close cross sits on the coloured header.
          className="gap-0 overflow-hidden p-0 [&>button:last-child]:text-primary-foreground [&>button:last-child]:hover:bg-white/15"
          lang={lang}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/75 px-6 pb-6 pt-7 text-primary-foreground">
            <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 left-10 size-32 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4">
              <div className="shrink-0 overflow-hidden rounded-2xl bg-white/95 shadow-md">
                <Mascot
                  directions="/mascots/helabiz-directions.webp"
                  reactions="/mascots/helabiz-reactions.webp"
                  size={72}
                  label="Helabiz"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-primary-foreground/80">
                  {copy.offerEyebrow}
                </p>
                <DialogTitle className="mt-1 text-[19px] leading-snug tracking-[-0.01em]">{copy.offerTitle}</DialogTitle>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <DialogDescription className="text-[14px] leading-relaxed">{copy.offerBody}</DialogDescription>
            <ul className="space-y-2.5">
              {copy.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-[13.5px]">
                  <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary">
                    <Check className="size-3 stroke-[3]" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={dismiss}>
                {copy.maybeLater}
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  dismiss();
                  setRequesting(true);
                }}
              >
                {copy.offerCta}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WebsiteRequestDialog open={requesting} onOpenChange={setRequesting} defaultPhone={defaultPhone} />
    </>
  );
}

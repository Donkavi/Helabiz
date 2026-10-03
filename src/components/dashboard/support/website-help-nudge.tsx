"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Mascot } from "page-mascot";
import { ArrowRight, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/dashboard/tour/tour";
import { useLang } from "@/lib/i18n/provider";
import { SUPPORT_UI } from "./copy";
import { WebsiteRequestDialog } from "./website-request-dialog";

/** Waits for the page — and any guided tour — to settle before appearing. */
const APPEAR_DELAY = 2500;
const COMPACT_KEY = "helabiz:website-help-nudge";

/** Fired by the dashboard popup when it is dismissed, so this card does not repeat it. */
export const WEBSITE_HELP_DISMISSED = "helabiz:website-help-dismissed";

function readCompact() {
  try {
    return window.localStorage.getItem(COMPACT_KEY) === "compact";
  } catch {
    return false;
  }
}

function rememberCompact() {
  try {
    window.localStorage.setItem(COMPACT_KEY, "compact");
  } catch {
    // Without storage it opens full size again next visit, which is harmless.
  }
}

/**
 * "Want us to build your website?" — its own card in the corner of every
 * dashboard screen, above "Need help?", for businesses that have not asked
 * yet. The offer used to live only inside the help menu, where owners who
 * needed it most never found it.
 *
 * Closing the card shrinks it to a small button rather than removing it, so
 * the way in never disappears; it goes for good once a request is sent.
 *
 * Kept off the Support page, where the offer is already on screen and the
 * corner belongs to the chat's send button, and off the template chooser,
 * which carries its own banner and sticky bar.
 */
export function WebsiteHelpNudge({
  show,
  hasWebsite,
  defaultPhone,
}: {
  /** No request yet, or only a cancelled one. */
  show: boolean;
  hasWebsite: boolean;
  defaultPhone?: string;
}) {
  const lang = useLang();
  const copy = SUPPORT_UI[lang];
  const pathname = usePathname();
  const { active } = useTour();
  const [ready, setReady] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);

  React.useEffect(() => {
    if (!show || active || ready) return;
    const timer = window.setTimeout(() => {
      setCompact(readCompact());
      setReady(true);
    }, APPEAR_DELAY);
    return () => window.clearTimeout(timer);
  }, [show, active, ready]);

  const hidden =
    !show ||
    !ready ||
    Boolean(active) ||
    pathname.startsWith("/support") ||
    (pathname === "/website" && !hasWebsite);

  React.useEffect(() => {
    const shrink = () => {
      rememberCompact();
      setCompact(true);
    };
    window.addEventListener(WEBSITE_HELP_DISMISSED, shrink);
    return () => window.removeEventListener(WEBSITE_HELP_DISMISSED, shrink);
  }, []);

  const request = () => setRequesting(true);

  return (
    <>
      {!hidden &&
        (compact ? (
          <button
            type="button"
            onClick={request}
            className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.25rem)] right-4 z-40 flex items-center gap-2 rounded-full bg-primary py-2 pl-3 pr-4 text-[13px] font-semibold text-primary-foreground shadow-lg ring-4 ring-primary/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-ring motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-reduce:hover:translate-y-0"
          >
            <Wand2 className="size-4" />
            {copy.nudgeCompact}
          </button>
        ) : (
          <aside
            aria-label={copy.nudgeTitle}
            lang={lang}
            className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.25rem)] right-4 z-40 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500"
          >
            <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
            <button
              type="button"
              onClick={() => {
                rememberCompact();
                setCompact(true);
              }}
              aria-label={copy.nudgeHide}
              title={copy.nudgeHide}
              className="absolute right-2 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="flex gap-3 p-4 pr-9">
              <div className="shrink-0 overflow-hidden rounded-xl bg-primary-muted">
                <Mascot
                  directions="/mascots/helabiz-directions.webp"
                  reactions="/mascots/helabiz-reactions.webp"
                  size={48}
                  label="Helabiz"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold leading-snug">{copy.nudgeTitle}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{copy.nudgeBody}</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <Button className="w-full" onClick={request}>
                {copy.nudgeCta}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </aside>
        ))}

      {/* Outside the show/hide switch: sending the request hides the nudge
          on the server's next render, and the thank-you must not go with it. */}
      <WebsiteRequestDialog open={requesting} onOpenChange={setRequesting} defaultPhone={defaultPhone} />
    </>
  );
}

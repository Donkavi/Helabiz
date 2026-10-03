"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Mascot } from "page-mascot";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Compass, MessageCircle, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORT_UI } from "@/components/dashboard/support/copy";
import { LANGS } from "@/lib/i18n";
import { setLangAction } from "@/lib/i18n/actions";
import { useLang } from "@/lib/i18n/provider";
import { fill } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";
import { markTourSeenAction } from "./actions";
import { TOURS, TOUR_UI, type TourId, type TourStep } from "./tours";

/**
 * Guided tours for first-time visitors to a dashboard screen.
 *
 * A page opts in by rendering `<PageTour id="…" />`. The first time a person
 * lands there the tour starts by itself; finishing or skipping it is saved
 * against their account, and the "Need help?" button in the corner replays it.
 *
 * The provider sits in the dashboard layout rather than the page, so the tour
 * survives the server re-render that a language switch causes — someone who
 * picks Sinhala on the first step carries on in Sinhala, not from the start.
 */

type TourContext = {
  /** The tour this screen offers, if any. */
  available: TourId | null;
  /** The tour running right now, so nothing else pops up over it. */
  active: TourId | null;
  start: () => void;
  register: (id: TourId) => () => void;
};

const Ctx = React.createContext<TourContext>({
  available: null,
  active: null,
  start: () => {},
  register: () => () => {},
});

export function useTour() {
  return React.useContext(Ctx);
}

/** Starts the screen's tour by itself the first time. */
const AUTO_START_DELAY = 700;

export function TourProvider({
  seen,
  floatingHelp = true,
  children,
}: {
  seen: string[];
  /**
   * The corner "Need help?" pill. Off in the builder, where it would sit on
   * the settings panel; the builder's toolbar carries `NeedHelpButton` instead.
   */
  floatingHelp?: boolean;
  children: React.ReactNode;
}) {
  const [available, setAvailable] = React.useState<TourId | null>(null);
  const [active, setActive] = React.useState<TourId | null>(null);
  const seenRef = React.useRef(new Set(seen));

  const register = React.useCallback((id: TourId) => {
    setAvailable(id);
    return () => {
      setAvailable((current) => (current === id ? null : current));
      setActive((current) => (current === id ? null : current));
    };
  }, []);

  React.useEffect(() => {
    if (!available || seenRef.current.has(available)) return;
    const timer = window.setTimeout(() => setActive(available), AUTO_START_DELAY);
    return () => window.clearTimeout(timer);
  }, [available]);

  const finish = React.useCallback((id: TourId) => {
    setActive(null);
    if (seenRef.current.has(id)) return;
    seenRef.current.add(id);
    // Not awaited: the tour closes at once, the record catches up.
    void markTourSeenAction(id).catch(() => {});
  }, []);

  const value = React.useMemo<TourContext>(
    () => ({ available, active, start: () => available && setActive(available), register }),
    [available, active, register],
  );

  const pathname = usePathname();
  // The Support page is where every item of the menu leads, and the pill
  // would sit on the chat's send button on a phone.
  const showHelp = floatingHelp && !pathname.startsWith("/support");

  return (
    <Ctx.Provider value={value}>
      {children}
      {showHelp && <HelpButton />}
      {active && <TourOverlay key={active} id={active} onClose={() => finish(active)} />}
    </Ctx.Provider>
  );
}

/**
 * What "Need help?" offers: this screen's tour when it has one, a chat with
 * the Helabiz team, and having the team build the website. The last goes by
 * the Support page, which opens the request form unless one is already open.
 */
function HelpMenuContent({ side }: { side: "top" | "bottom" }) {
  const lang = useLang();
  const copy = SUPPORT_UI[lang];
  const { available, start } = useTour();
  // The tour's card takes focus itself; the closing menu must not take it back.
  const touring = React.useRef(false);
  return (
    <DropdownMenuContent
      align="end"
      side={side}
      className="w-64"
      lang={lang}
      onCloseAutoFocus={(event) => {
        if (touring.current) event.preventDefault();
        touring.current = false;
      }}
    >
      {available && (
        <>
          <DropdownMenuItem
            onSelect={() => {
              touring.current = true;
              start();
            }}
          >
            <Compass /> {copy.showMeAround}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem asChild>
        <Link href="/support">
          <MessageCircle /> {copy.chatMenu}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/support?request=1">
          <Wand2 /> {copy.offerCta}
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

/**
 * "Need help?", in the corner of every dashboard screen, so help is always
 * one tap away without hunting for it.
 */
function HelpButton() {
  const lang = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-tour="help"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-card py-1.5 pl-1.5 pr-4 text-[13px] font-semibold text-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CircleHelp className="size-4" />
          </span>
          {TOUR_UI[lang].needHelp}
        </button>
      </DropdownMenuTrigger>
      <HelpMenuContent side="top" />
    </DropdownMenu>
  );
}

/** Offers this screen's tour. Renders nothing itself. */
export function PageTour({ id }: { id: TourId }) {
  const { register } = useTour();
  React.useEffect(() => register(id), [id, register]);
  return null;
}

/** "Need help?" for a toolbar, where a screen has no room for the corner pill. */
export function NeedHelpButton({ className }: { className?: string }) {
  const lang = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-tour="help"
          aria-label={TOUR_UI[lang].needHelp}
          className={className}
        >
          <CircleHelp className="size-4" />
          <span className="hidden xl:inline">{TOUR_UI[lang].needHelp}</span>
        </Button>
      </DropdownMenuTrigger>
      <HelpMenuContent side="bottom" />
    </DropdownMenu>
  );
}

/* ── The overlay ────────────────────────────────────────────────────────── */

const PAD = 6;
const GAP = 14;
const EDGE = 16;
const CARD_WIDTH = 360;

/** The first rendered, visible element for a step — the sidebar exists twice on a phone. */
function findTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null;
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`);
  for (const element of all) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

/** A targeted step whose element is not on this screen is left out. */
function visibleSteps(id: TourId) {
  return TOURS[id].filter((step) => !step.target || findTarget(step));
}

type Box = { top: number; left: number; width: number; height: number };

function placeCard(target: Box | null, card: { width: number; height: number }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Phones: always along the bottom, where a thumb is.
  if (vw < 640) return { left: 12, top: vh - card.height - 12, width: vw - 24 };
  if (!target) return { left: (vw - card.width) / 2, top: Math.max(EDGE, (vh - card.height) / 2), width: card.width };

  const clampX = (x: number) => Math.min(Math.max(x, EDGE), vw - card.width - EDGE);
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), vh - card.height - EDGE);
  const centredX = clampX(target.left + target.width / 2 - card.width / 2);
  const centredY = clampY(target.top + target.height / 2 - card.height / 2);

  const below = target.top + target.height + GAP;
  const above = target.top - GAP - card.height;
  const right = target.left + target.width + GAP;
  const left = target.left - GAP - card.width;

  // Tall targets like the sidebar read best with the card beside them.
  const tall = target.height > vh * 0.4;
  const options = [
    { fits: right + card.width <= vw - EDGE, at: { left: right, top: centredY } },
    { fits: left >= EDGE, at: { left, top: centredY } },
  ];
  const vertical = [
    { fits: below + card.height <= vh - EDGE, at: { left: centredX, top: below } },
    { fits: above >= EDGE, at: { left: centredX, top: above } },
  ];

  for (const option of tall ? [...options, ...vertical] : [...vertical, ...options]) {
    if (option.fits) return { ...option.at, width: card.width };
  }
  return { left: centredX, top: vh - card.height - EDGE, width: card.width };
}

function TourOverlay({ id, onClose }: { id: TourId; onClose: () => void }) {
  const lang = useLang();
  const ui = TOUR_UI[lang];
  // Only ever mounted in the browser, after the page has painted, so the
  // steps this screen can show are known from the first render.
  const [steps] = React.useState<TourStep[]>(() => visibleSteps(id));
  const [index, setIndex] = React.useState(0);
  // The box belongs to the step it was measured for; a stale one is ignored.
  const [tracked, setTracked] = React.useState<{ step: TourStep; box: Box } | null>(null);
  const [cardSize, setCardSize] = React.useState({ width: CARD_WIDTH, height: 220 });
  const [switching, startSwitch] = React.useTransition();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const bodyId = React.useId();

  const step = steps[index];
  const last = index === steps.length - 1;
  const target = tracked && tracked.step === step ? tracked.box : null;
  const reducedMotion = React.useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  // Follow the target: bring it into view, then track it through scrolling,
  // resizing and the page re-rendering in another language.
  React.useEffect(() => {
    if (!step) return;
    const element = findTarget(step);
    if (!element) return;

    element.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = findTarget(step) ?? element;
        const rect = current.getBoundingClientRect();
        setTracked({ step, box: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } });
      });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [step, reducedMotion, lang]);

  // The card's own size decides where it fits.
  React.useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const update = () => setCardSize({ width: Math.min(CARD_WIDTH, window.innerWidth - 24), height: card.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Each step takes focus once it is shown, so keyboard and screen reader
  // users follow along. A hidden card cannot hold focus, hence `measured`.
  const measured = !step?.target || Boolean(target);
  React.useEffect(() => {
    if (measured) cardRef.current?.focus({ preventScroll: true });
  }, [index, measured]);

  const next = React.useCallback(() => (last ? onClose() : setIndex((i) => i + 1)), [last, onClose]);
  const back = React.useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  if (!step) return null;

  const text = step.text[lang];
  const hasTarget = Boolean(step.target && target);
  const spot = hasTarget && target
    ? {
        top: target.top - PAD,
        left: target.left - PAD,
        width: target.width + PAD * 2,
        height: target.height + PAD * 2,
      }
    : null;
  const position = placeCard(spot, cardSize);
  const motion = reducedMotion ? "" : "transition-all duration-300 ease-out";
  // A targeted step waits one frame for its measurement rather than flashing mid-screen.
  const waiting = !measured;

  return createPortal(
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {/* Blocks the page while the tour runs; the spotlight is drawn as a
          giant shadow around the target, so the target itself stays lit. */}
      <div className={cn("absolute inset-0", !spot && "bg-black/55")} />
      {spot && (
        <div
          aria-hidden
          className={cn("pointer-events-none absolute rounded-xl ring-2 ring-primary", motion)}
          style={{ ...spot, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        lang={lang}
        className={cn(
          "absolute rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl outline-none",
          motion,
          waiting && "invisible",
        )}
        style={{ top: position.top, left: position.left, width: position.width }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={ui.skip}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="shrink-0 overflow-hidden rounded-xl bg-primary-muted">
            <Mascot
              directions="/mascots/helabiz-directions.webp"
              reactions="/mascots/helabiz-reactions.webp"
              size={56}
              label="Helabiz"
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-[15px] font-semibold leading-snug">
              {text.title}
            </h2>
            <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
              {fill(ui.progress, { step: index + 1, total: steps.length })}
            </p>
          </div>
        </div>

        <p id={bodyId} className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
          {text.body}
        </p>

        {/* The language choice comes first, before there is much to read. */}
        {index === 0 && (
          <div className="mt-4">
            <p className="text-[12px] font-medium text-muted-foreground">{ui.chooseLanguage}</p>
            <div
              role="group"
              aria-label={ui.chooseLanguage}
              className={cn("mt-1.5 grid grid-cols-2 gap-1.5", switching && "opacity-60")}
            >
              {LANGS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  lang={option.id}
                  aria-pressed={option.id === lang}
                  disabled={switching}
                  onClick={() => option.id !== lang && startSwitch(() => setLangAction(option.id))}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                    option.id === lang
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1" aria-hidden>
          {steps.map((_, dot) => (
            <span
              key={dot}
              className={cn(
                "h-1.5 rounded-full transition-all",
                dot === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/25",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {index === 0 ? (
            <button
              type="button"
              onClick={onClose}
              className="text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {ui.skip}
            </button>
          ) : (
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="size-3.5" />
              {ui.back}
            </Button>
          )}
          <Button size="sm" className="ml-auto" onClick={next}>
            {index === 0 ? ui.start : last ? ui.done : ui.next}
            {last ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Whether a business may use Helabiz at all.
 *
 * One idea covers both halves of the lifecycle: a business holds access until
 * a date, and when that date passes the dashboard and the published website
 * both close. For a new business the date comes from the one-month trial; for
 * a paying one it comes from the period they last paid for. Nothing is ever
 * deleted — this is a gate, not a purge.
 *
 * This module deliberately imports nothing. No `server-only`, no database, no
 * date library, so the gates on the server and the countdown in the dashboard
 * chrome share one piece of arithmetic instead of two that drift apart.
 */
export const TRIAL_DAYS = 30;

/** How long one paid period lasts. Monthly, matching the advertised price. */
export const PLAN_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type AccessState =
  /** Free plan, trial never started: the owner has one waiting for them. */
  | "trial_available"
  /** Free plan, trial running. */
  | "trial_active"
  /** Free plan, trial run out. */
  | "trial_expired"
  /** Paid plan, inside the period that was paid for. */
  | "plan_active"
  /** Paid plan, the period ran out. */
  | "plan_expired";

export type AccessInfo = {
  state: AccessState;
  /** Whole days remaining, rounded up so the last part-day still reads "1 day left". */
  daysLeft: number;
  endsAt?: Date;
  /** Whether the dashboard and the public website must be closed. */
  locked: boolean;
  isTrial: boolean;
  /** Close enough to the end that the countdown should look urgent. */
  isEnding: boolean;
};

/** The fields this needs from a business — anything shaped like one will do. */
export type AccessSource = {
  plan?: string | null;
  trialEndsAt?: Date | string | null;
  planEndsAt?: Date | string | null;
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function daysBetween(from: number, to: number) {
  return Math.ceil((to - from) / DAY_MS);
}

export function accessInfo(business: AccessSource, now: Date = new Date()): AccessInfo {
  const isTrial = (business.plan ?? "free") === "free";
  const nowMs = now.getTime();

  if (isTrial) {
    const endsAt = asDate(business.trialEndsAt);
    if (!endsAt) {
      // Not started. Locked, because a trial nobody has to start is just a
      // free plan with extra steps.
      return { state: "trial_available", daysLeft: TRIAL_DAYS, locked: true, isTrial, isEnding: false };
    }
    if (endsAt.getTime() <= nowMs) {
      return { state: "trial_expired", daysLeft: 0, endsAt, locked: true, isTrial, isEnding: true };
    }
    const daysLeft = daysBetween(nowMs, endsAt.getTime());
    // A month gives room, so like a paid plan the warning starts five days out.
    return { state: "trial_active", daysLeft, endsAt, locked: false, isTrial, isEnding: daysLeft <= 5 };
  }

  const endsAt = asDate(business.planEndsAt);
  // A paid plan with no period recorded predates billing — never lock it out
  // on the strength of a missing field.
  if (!endsAt) {
    return { state: "plan_active", daysLeft: 0, locked: false, isTrial, isEnding: false };
  }
  if (endsAt.getTime() <= nowMs) {
    return { state: "plan_expired", daysLeft: 0, endsAt, locked: true, isTrial, isEnding: true };
  }

  const daysLeft = daysBetween(nowMs, endsAt.getTime());
  // A month gives more room, so the warning starts five days out — enough
  // time to make a bank transfer and have it checked.
  return { state: "plan_active", daysLeft, endsAt, locked: false, isTrial, isEnding: daysLeft <= 5 };
}

/** When a trial started now would run out. */
export function trialEndFrom(start: Date = new Date()) {
  return new Date(start.getTime() + TRIAL_DAYS * DAY_MS);
}

/**
 * When a paid period starting now would run out.
 *
 * Renewing early extends from whatever is left rather than from today, so
 * paying before the end never costs the remaining days.
 */
export function planEndFrom(current: Date | string | null | undefined, now: Date = new Date()) {
  const existing = asDate(current);
  const base = existing && existing.getTime() > now.getTime() ? existing : now;
  return new Date(base.getTime() + PLAN_DAYS * DAY_MS);
}

/** Where a locked business belongs. */
export function accessRedirect(info: AccessInfo) {
  return info.state === "trial_available" ? "/trial" : "/renew";
}

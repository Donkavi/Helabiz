"use client";

import * as React from "react";
import { DEFAULT_LANG, type Lang } from ".";
import { dashboardCopy, type DashboardCopy } from "./dashboard";

/**
 * Language for the signed-in app.
 *
 * The dashboard is mostly client components, which cannot read the cookie
 * themselves. The layout reads it once on the server and puts it here, so a
 * screen renders in the right language on the server and stays there — no
 * flash, no second render.
 *
 * Both dictionaries are already in the bundle, so `useT()` is a plain object
 * lookup rather than a fetch.
 */
const LangContext = React.createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return React.useContext(LangContext);
}

/** The dashboard dictionary for the current language. */
export function useT(): DashboardCopy {
  return dashboardCopy(useLang());
}

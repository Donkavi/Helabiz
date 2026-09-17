/**
 * Language for the public marketing pages.
 *
 * Sinhala is the default because that is who Helabiz is for; English is a
 * click away and the choice is remembered in a cookie. The cookie is read on
 * the server, so a page arrives already in the right language — no flash, and
 * the title and description are translated too.
 *
 * The signed-in app is deliberately not covered yet. When it is, this is the
 * place the rest hangs off.
 *
 * Nothing here may touch `next/headers`: client components import LANGS. The
 * cookie read lives in `./server`.
 */
export type Lang = "si" | "en";

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "si", label: "සිංහල", short: "සිං" },
  { id: "en", label: "English", short: "EN" },
];

export const DEFAULT_LANG: Lang = "si";
export const LANG_COOKIE = "helabiz_lang";
export const LANG_MAX_AGE = 60 * 60 * 24 * 365;

export function isLang(value: unknown): value is Lang {
  return value === "si" || value === "en";
}

/** `lang` and `dir` for the document, so browsers and screen readers get it right. */
export function htmlLangOf(lang: Lang) {
  return lang === "si" ? "si-LK" : "en-LK";
}

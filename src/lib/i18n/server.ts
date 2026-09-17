import { cookies } from "next/headers";
import { DEFAULT_LANG, isLang, LANG_COOKIE, type Lang } from ".";

/**
 * The visitor's language, from the cookie.
 *
 * Server-only: reading a cookie opts the page into dynamic rendering, which is
 * the trade for having pages arrive already translated rather than flipping
 * language once JavaScript loads.
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

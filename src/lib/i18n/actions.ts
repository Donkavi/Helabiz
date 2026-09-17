"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLang, LANG_COOKIE, LANG_MAX_AGE } from ".";

/**
 * Remembers the visitor's language.
 *
 * A server action rather than `document.cookie` so the pages re-render on the
 * server in the new language, which keeps the translated `<title>` in step
 * with the body.
 */
export async function setLangAction(value: string) {
  if (!isLang(value)) return;

  const store = await cookies();
  store.set(LANG_COOKIE, value, {
    path: "/",
    maxAge: LANG_MAX_AGE,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}

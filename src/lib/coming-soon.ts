/**
 * The launch gate.
 *
 * With `COMING_SOON=true` every public request is served the teaser instead of
 * the product. `COMING_SOON_BYPASS` is the way back in: visiting any page with
 * `?preview=<that value>` sets a cookie that exempts the browser, so the team
 * and anyone they share the link with can use the real site while it is shut.
 *
 * Read from `process.env` on each call rather than captured at module load, so
 * a deployment that flips the variable takes effect on restart without a
 * rebuild.
 */
export const BYPASS_COOKIE = "helabiz_preview";
export const BYPASS_PARAM = "preview";

/** How long a bypass lasts before the secret has to be presented again. */
export const BYPASS_MAX_AGE = 60 * 60 * 24 * 30;

export function comingSoonEnabled() {
  return process.env.COMING_SOON === "true";
}

export function bypassSecret() {
  return process.env.COMING_SOON_BYPASS?.trim() || null;
}

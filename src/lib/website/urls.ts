/**
 * Website URL helpers.
 *
 * Published sites are served from `/site/<business-slug>` and, when the app is
 * deployed behind a wildcard DNS record, also from `<subdomain>.<SITE_DOMAIN>`
 * via the rewrite in `middleware.ts`. Both forms resolve to the same route, so
 * custom domains can be added later by extending the middleware lookup only.
 */
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "helabiz.lk";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** The path this app serves a business website from. */
export function sitePath(slug: string, path = "") {
  const suffix = path && path !== "/" ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `/site/${slug}${suffix}`;
}

/** The address shown to the user — a real subdomain in production, a path locally. */
export function siteUrlFor(slug: string, path = "") {
  const isLocal = APP_URL.includes("localhost") || APP_URL.includes("127.0.0.1");
  if (isLocal) return `${APP_URL}${sitePath(slug, path)}`;
  const suffix = path && path !== "/" ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `https://${slug}.${SITE_DOMAIN}${suffix}`;
}

/** The display label for a website address, without the scheme. */
export function siteDisplayUrl(subdomain: string) {
  return `${subdomain}.${SITE_DOMAIN}`;
}

/**
 * Website URL helpers.
 *
 * Published sites are served from `/site/<business-slug>` and, when the app is
 * deployed behind a wildcard DNS record, also from `<subdomain>.<SITE_DOMAIN>`
 * via the rewrite in `middleware.ts`. Both forms resolve to the same route, so
 * custom domains can be added later by extending the middleware lookup only.
 */
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "helabiz.lk";

/**
 * Labels under SITE_DOMAIN that can never be a shop's address: the product's
 * own hosts, and the subdomain shop email is sent from. A shop called "mail"
 * would otherwise be handed `mail.helabiz.lk`, whose DNS belongs to email.
 */
const mailLabel = (() => {
  const domain = process.env.MAIL_SHOP_DOMAIN?.trim().toLowerCase() ?? "";
  return domain.endsWith(`.${SITE_DOMAIN}`) ? domain.slice(0, -(SITE_DOMAIN.length + 1)).split(".").pop() : undefined;
})();

export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set(
  ["www", "app", "admin", "api", "sites", "mail", "email", "webmail", "smtp", "mx", "shops", mailLabel].filter(
    (label): label is string => Boolean(label),
  ),
);

export function isReservedSubdomain(label: string) {
  return RESERVED_SUBDOMAINS.has(label.toLowerCase());
}

/**
 * Local vs production is decided by the build, not by `NEXT_PUBLIC_APP_URL`.
 * That value is inlined at build time, so a `.env` with `localhost` in it that
 * reaches the production build would otherwise point every shop link there.
 */
const isDev = process.env.NODE_ENV !== "production";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || (isDev ? "http://localhost:3000" : `https://${SITE_DOMAIN}`);

/** The path this app serves a business website from. */
export function sitePath(slug: string, path = "") {
  const suffix = path && path !== "/" ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `/site/${slug}${suffix}`;
}

/** The address shown to the user — a real subdomain in production, a path locally. */
export function siteUrlFor(slug: string, path = "") {
  if (isDev) return `${APP_URL}${sitePath(slug, path)}`;
  const suffix = path && path !== "/" ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `https://${slug}.${SITE_DOMAIN}${suffix}`;
}

/** The display label for a website address, without the scheme. */
export function siteDisplayUrl(subdomain: string) {
  return `${subdomain}.${SITE_DOMAIN}`;
}

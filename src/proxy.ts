import { NextResponse, type NextRequest } from "next/server";
import {
  BYPASS_COOKIE,
  BYPASS_MAX_AGE,
  BYPASS_PARAM,
  bypassSecret,
  comingSoonEnabled,
} from "@/lib/coming-soon";

/**
 * Subdomain routing for published websites.
 *
 * `shop.helabiz.lk/about` is rewritten to `/site/shop/about`, so one set of
 * routes serves both the path form used in development and the subdomain form
 * used in production. Custom domains plug in at the same place: look the
 * hostname up and rewrite to its business slug.
 *
 * Renamed from `middleware` per Next.js 16, which also fixes this to the
 * Node.js runtime.
 */
const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "helabiz.lk";

/** Hosts that serve the Helabiz product itself rather than a customer website. */
const APP_HOSTS = new Set(["www", "app", "admin", "api", "sites"]);

function subdomainOf(hostname: string) {
  const host = hostname.split(":")[0].toLowerCase();

  if (host === "localhost" || host === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;

  // Local subdomain testing: shop.localhost:3000
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, -".localhost".length);
    return label && !APP_HOSTS.has(label) ? label : null;
  }

  if (!host.endsWith(`.${SITE_DOMAIN}`)) return null;

  const label = host.slice(0, -(SITE_DOMAIN.length + 1));
  if (!label || label.includes(".") || APP_HOSTS.has(label)) return null;
  return label;
}

/**
 * The launch gate, applied before anything else.
 *
 * Returns a response when the request should not reach the product, or null to
 * let it through. Everything is rewritten rather than redirected, so a visitor
 * keeps the URL they arrived on and there is no loop to fall into.
 */
function launchGate(request: NextRequest) {
  if (!comingSoonEnabled()) return null;

  const secret = bypassSecret();
  const { pathname, searchParams } = request.nextUrl;

  // Presenting the secret grants the bypass, then leaves the URL clean.
  if (secret && searchParams.get(BYPASS_PARAM) === secret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(BYPASS_PARAM);
    const response = NextResponse.redirect(url);
    response.cookies.set(BYPASS_COOKIE, secret, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: BYPASS_MAX_AGE,
      secure: request.nextUrl.protocol === "https:",
    });
    return response;
  }

  if (secret && request.cookies.get(BYPASS_COOKIE)?.value === secret) return null;
  if (pathname === "/coming-soon") return null;

  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  url.search = "";
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const gated = launchGate(request);
  if (gated) return gated;

  const hostname = request.headers.get("host") ?? "";
  const subdomain = subdomainOf(hostname);
  if (!subdomain) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (url.pathname.startsWith("/site/")) return NextResponse.next();

  url.pathname = `/site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and static assets so a rewrite never breaks CSS or images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|placeholders|mascots|api/).*)"],
};

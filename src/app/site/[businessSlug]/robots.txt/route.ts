import { loadPublishedSite } from "@/lib/website/load-site";
import { siteUrlFor } from "@/lib/website/urls";

/**
 * Multi-tenant and database-backed: every response depends on which business is
 * being served and on its live catalogue, so nothing here can be prerendered.
 */
export const dynamic = "force-dynamic";

/** Per-tenant robots.txt (spec §30). */
export async function GET(_request: Request, { params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);

  // An unpublished site should not be crawled at all.
  if (!site) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /order/",
    "",
    `Sitemap: ${siteUrlFor(businessSlug, "/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}

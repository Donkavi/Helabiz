import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { loadPublishedSite } from "@/lib/website/load-site";
import { siteUrlFor } from "@/lib/website/urls";

/**
 * Multi-tenant and database-backed: every response depends on which business is
 * being served and on its live catalogue, so nothing here can be prerendered.
 */
export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] ?? char,
  );
}

/**
 * Per-tenant sitemap (spec §30). Written as a Route Handler rather than the
 * `sitemap.ts` convention because the content depends on the dynamic
 * `[businessSlug]` segment and must never be cached across tenants.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) return new Response("Not found", { status: 404 });

  await connectDB();
  const products = await Product.find({ businessId: site.businessId, status: "active" })
    .select("slug updatedAt")
    .lean();

  const entries: { loc: string; lastmod?: string; priority: number }[] = [];

  for (const page of site.pages) {
    if (page.seo.noIndex) continue;
    entries.push({
      loc: siteUrlFor(businessSlug, page.isHome ? "" : `/${page.slug}`),
      lastmod: page.updatedAt,
      priority: page.isHome ? 1 : 0.8,
    });
  }

  for (const product of products) {
    entries.push({
      loc: siteUrlFor(businessSlug, `/products/${product.slug}`),
      lastmod: product.updatedAt ? String(product.updatedAt) : undefined,
      priority: 0.6,
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${
        entry.lastmod ? `\n    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>` : ""
      }\n    <priority>${entry.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPage, loadPublishedSite } from "@/lib/website/load-site";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { siteUrlFor } from "@/lib/website/urls";

/**
 * Slugs owned by dedicated routes. "shop" is deliberately not here: the Shop
 * page is ordinary JSON, so what the builder shows is exactly what ships.
 */
const RESERVED = new Set(["cart", "checkout", "products", "order"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string; pageSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug, pageSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  const page = site ? findPage(site, pageSlug) : null;
  if (!site || !page) return { title: "Page not found" };

  return {
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? site.seo.description,
    alternates: { canonical: siteUrlFor(businessSlug, `/${page.slug}`) },
    robots: page.seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page.seo.title ?? page.title,
      description: page.seo.description ?? site.seo.description,
      images: page.seo.ogImage ? [page.seo.ogImage] : undefined,
    },
  };
}

export default async function SiteContentPage({
  params,
}: {
  params: Promise<{ businessSlug: string; pageSlug: string }>;
}) {
  const { businessSlug, pageSlug } = await params;
  if (RESERVED.has(pageSlug)) notFound();

  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  const page = findPage(site, pageSlug);
  if (!page || page.isHome) notFound();

  return (
    <WebsiteRenderer sections={page.sections} header={site.header} footer={site.footer} ctx={site.ctx} mode="public" />
  );
}

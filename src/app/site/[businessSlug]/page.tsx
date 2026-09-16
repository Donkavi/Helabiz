import { notFound } from "next/navigation";
import { findPage, loadPublishedSite } from "@/lib/website/load-site";
import { WebsiteRenderer } from "@/components/website/website-renderer";

export default async function SiteHomePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  const page = findPage(site);
  if (!page) notFound();

  return (
    <WebsiteRenderer sections={page.sections} header={site.header} footer={site.footer} ctx={site.ctx} mode="public" />
  );
}

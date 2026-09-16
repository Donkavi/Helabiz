import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/website/load-site";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { CartPage } from "@/components/website/cart-page";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default async function Cart({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  return (
    <WebsiteRenderer sections={[]} header={site.header} footer={site.footer} ctx={site.ctx} mode="public">
      <CartPage ctx={site.ctx} />
    </WebsiteRenderer>
  );
}

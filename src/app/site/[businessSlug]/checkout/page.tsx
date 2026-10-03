import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/website/load-site";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { CheckoutForm } from "@/components/website/checkout-form";
import { currentShopper } from "@/services/shopper-service";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  const accounts = site.ctx.settings.customerAccounts;
  const shopper = accounts ? await currentShopper(site.businessId) : null;

  return (
    <WebsiteRenderer sections={[]} header={site.header} footer={site.footer} ctx={site.ctx} mode="public">
      <CheckoutForm ctx={site.ctx} businessSlug={businessSlug} accounts={accounts} shopper={shopper ?? undefined} />
    </WebsiteRenderer>
  );
}

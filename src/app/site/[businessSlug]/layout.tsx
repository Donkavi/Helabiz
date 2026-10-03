import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/website/load-site";
import { googleFontsHref } from "@/lib/website/themes";
import { siteUrlFor } from "@/lib/website/urls";
import { CartProvider } from "@/components/website/cart-provider";
import { CartDrawer } from "@/components/website/cart-drawer";
import { AnalyticsBeacon } from "@/components/website/analytics-beacon";
import { WhatsAppBubble } from "@/components/website/whatsapp-bubble";
import { ShopChatWidget } from "@/components/website/shop-chat";
import { siteChatEnabled } from "@/components/website/account/account-shell";

/**
 * Multi-tenant and database-backed: every response depends on which business is
 * being served and on its live catalogue, so nothing here can be prerendered.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) return { title: "Website not found" };

  const title = site.seo.title ?? site.ctx.business.name;
  const description = site.seo.description;
  const url = siteUrlFor(businessSlug);

  return {
    title: { default: title, template: `%s · ${site.ctx.business.name}` },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.ctx.business.name,
      title,
      description,
      url,
      images: site.seo.ogImage ? [site.seo.ogImage] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  const fontHref = googleFontsHref([site.ctx.theme.headingFont, site.ctx.theme.bodyFont]);

  // With customer accounts the add-on chats on the site itself, WhatsApp kept
  // as an option. Without them it is the WhatsApp button alone, which needs a
  // number to chat to: no number, nothing to show, however much has been paid.
  const chatOnSite = siteChatEnabled(site);
  const chatNumber = site.addons.includes("whatsapp_chat")
    ? site.ctx.business.whatsapp || site.ctx.business.phone || ""
    : "";

  return (
    <>
      {fontHref && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fontHref} />
        </>
      )}
      <CartProvider businessId={site.businessId} disabled={!site.ctx.settings.showCart}>
        {children}
        <CartDrawer ctx={site.ctx} />
      </CartProvider>
      <AnalyticsBeacon businessId={site.businessId} websiteId={site.websiteId} />
      {chatOnSite ? (
        <ShopChatWidget
          businessSlug={businessSlug}
          shopName={site.ctx.business.name}
          logo={site.ctx.business.logo}
          basePath={site.ctx.basePath}
          whatsapp={chatNumber}
          theme={site.ctx.theme}
        />
      ) : (
        chatNumber && (
          <WhatsAppBubble
            phone={chatNumber}
            businessName={site.ctx.business.name}
            basePath={site.ctx.basePath}
          />
        )
      )}
    </>
  );
}

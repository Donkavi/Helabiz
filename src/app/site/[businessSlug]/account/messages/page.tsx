import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AccountPage, requireShopper, siteChatEnabled } from "@/components/website/account/account-shell";
import { ShopChatConversation } from "@/components/website/shop-chat";
import { SiteLink } from "@/components/website/primitives";
import { loadPublishedSite } from "@/lib/website/load-site";
import { markReadByCustomer, shopChatMessages } from "@/services/shop-chat-service";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

/**
 * The customer's conversation with the shop, full size. The same chat as the
 * floating widget, which hides itself on this page.
 *
 * `?about=<order number>` starts a message about that order, from the button
 * on the order page.
 */
export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ about?: string | string[] }>;
}) {
  const { businessSlug } = await params;
  // Before the sign-in redirect, so a shop without chat is a plain 404.
  const published = await loadPublishedSite(businessSlug);
  if (!published || !siteChatEnabled(published)) notFound();

  const { site, shopper } = await requireShopper(businessSlug, "/account/messages");

  const messages = await shopChatMessages(site.businessId, shopper.id);
  if (messages.some((message) => message.from === "shop" && !message.readAt)) {
    await markReadByCustomer(site.businessId, shopper.id);
  }

  const about = (await searchParams).about;
  const orderNumber = typeof about === "string" && /^[\w-]{1,40}$/.test(about) ? about : "";

  return (
    <AccountPage site={site} width={760}>
      <SiteLink ctx={site.ctx} href="/account">
        <span className="w-muted" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5 }}>
          <ChevronLeft size={14} />
          My account
        </span>
      </SiteLink>
      <h1 style={{ marginTop: 16, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
        Messages
      </h1>
      <p className="w-muted" style={{ marginTop: 6, fontSize: 14.5 }}>
        Your chat with {site.ctx.business.name}. We reply here, so you can come back to it any time.
      </p>

      <section
        style={{
          marginTop: 24,
          borderRadius: "var(--w-radius)",
          background: "var(--w-surface)",
          overflow: "hidden",
        }}
      >
        <ShopChatConversation
          businessSlug={businessSlug}
          basePath={site.ctx.basePath}
          shopName={site.ctx.business.name}
          initialMessages={messages}
          initialDraft={orderNumber ? `About order ${orderNumber}: ` : ""}
          live
          autoFocus={Boolean(orderNumber)}
          style={{ height: "min(68vh, 640px)", minHeight: 360 }}
        />
      </section>
    </AccountPage>
  );
}

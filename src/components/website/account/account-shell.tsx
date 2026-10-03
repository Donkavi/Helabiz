import "server-only";
import { notFound, redirect } from "next/navigation";
import { loadPublishedSite, type LoadedSite } from "@/lib/website/load-site";
import { currentShopper, type ShopperProfile } from "@/services/shopper-service";
import { WebsiteRenderer } from "@/components/website/website-renderer";

/**
 * The published site plus whoever is signed in to it, for the account pages.
 * A shop that has customer accounts switched off has no account pages at all.
 */
export async function loadAccountSite(slug: string): Promise<{ site: LoadedSite; shopper: ShopperProfile | null }> {
  const site = await loadPublishedSite(slug);
  if (!site || !site.ctx.settings.customerAccounts) notFound();
  return { site, shopper: await currentShopper(site.businessId) };
}

/**
 * Whether signed-in customers can chat with the shop on its website: the
 * "Chat with customers" add-on with customer accounts on. `shopChatEnabled`,
 * from the loaded site.
 */
export function siteChatEnabled(site: LoadedSite) {
  return site.addons.includes("whatsapp_chat") && site.ctx.settings.customerAccounts;
}

/** As `loadAccountSite`, but sends a signed-out visitor to sign in first. */
export async function requireShopper(slug: string, next: string) {
  const { site, shopper } = await loadAccountSite(slug);
  if (!shopper) redirect(`${site.ctx.basePath}/account/sign-in?next=${encodeURIComponent(next)}`);
  return { site, shopper };
}

/** The site's own header and footer around an account page. */
export function AccountPage({
  site,
  width = 1040,
  children,
}: {
  site: LoadedSite;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <WebsiteRenderer sections={[]} header={site.header} footer={site.footer} ctx={site.ctx} mode="public">
      <div className="w-in" style={{ paddingBlock: 56, maxWidth: width }}>
        {children}
      </div>
    </WebsiteRenderer>
  );
}

/** A centred card for the sign-in, register and password pages. */
export function AuthCard({
  site,
  title,
  description,
  children,
}: {
  site: LoadedSite;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccountPage site={site} width={480}>
      <div
        style={{
          padding: "32px 28px",
          borderRadius: "var(--w-radius)",
          background: "var(--w-surface)",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h1>
        {description && (
          <p className="w-muted" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
    </AccountPage>
  );
}

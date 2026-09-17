import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { getLang } from "@/lib/i18n/server";
import { marketingCopy } from "@/lib/i18n/marketing";

/**
 * The language is read once here, from the cookie, and passed down. Reading it
 * on the server is what keeps a page from arriving in one language and
 * switching to the other once JavaScript loads.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = marketingCopy(lang);

  return (
    <div className="flex min-h-dvh flex-col bg-background" lang={lang}>
      <MarketingNav lang={lang} t={t.nav} />
      <main className="flex-1">{children}</main>
      <MarketingFooter t={t.footer} />
    </div>
  );
}

import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { AccountPage, requireShopper } from "@/components/website/account/account-shell";
import { PasswordForm, ProfileForm } from "@/components/website/account/account-forms";
import { SiteLink } from "@/components/website/primitives";

export const metadata: Metadata = { title: "Your details", robots: { index: false, follow: false } };

export default async function ProfilePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const { site, shopper } = await requireShopper(businessSlug, "/account/profile");

  return (
    <AccountPage site={site} width={640}>
      <SiteLink ctx={site.ctx} href="/account">
        <span className="w-muted" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5 }}>
          <ChevronLeft size={14} />
          My account
        </span>
      </SiteLink>
      <h1 style={{ marginTop: 16, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
        Your details
      </h1>

      <section style={{ marginTop: 28, padding: 24, borderRadius: "var(--w-radius)", background: "var(--w-surface)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Profile and delivery address</h2>
        <ProfileForm businessSlug={businessSlug} initial={shopper} />
      </section>

      <section style={{ marginTop: 20, padding: 24, borderRadius: "var(--w-radius)", background: "var(--w-surface)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Password</h2>
        <PasswordForm businessSlug={businessSlug} />
      </section>
    </AccountPage>
  );
}

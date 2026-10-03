import type { Metadata } from "next";
import { AuthCard, loadAccountSite } from "@/components/website/account/account-shell";
import { ResetForm } from "@/components/website/account/account-forms";
import { SiteLink } from "@/components/website/primitives";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { businessSlug } = await params;
  const { token } = await searchParams;
  const { site } = await loadAccountSite(businessSlug);

  if (!token) {
    return (
      <AuthCard site={site} title="This link is incomplete" description="Open the link from your email again, or ask for a new one.">
        <SiteLink ctx={site.ctx} href="/account/forgot" className="w-btn w-btn--solid">
          Send a new link
        </SiteLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard site={site} title="Choose a new password" description="You will be signed in once it is saved.">
      <ResetForm ctx={site.ctx} businessSlug={businessSlug} token={token} />
    </AuthCard>
  );
}

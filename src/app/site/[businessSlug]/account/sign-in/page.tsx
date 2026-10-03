import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, loadAccountSite } from "@/components/website/account/account-shell";
import { SignInForm } from "@/components/website/account/account-forms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { businessSlug } = await params;
  const { next } = await searchParams;
  const { site, shopper } = await loadAccountSite(businessSlug);
  if (shopper) redirect(`${site.ctx.basePath}/account`);

  return (
    <AuthCard
      site={site}
      title="Sign in"
      description={`Welcome back to ${site.ctx.business.name}. Sign in to see your orders and check out faster.`}
    >
      <SignInForm ctx={site.ctx} businessSlug={businessSlug} next={next} />
    </AuthCard>
  );
}

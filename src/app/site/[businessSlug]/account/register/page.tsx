import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, loadAccountSite } from "@/components/website/account/account-shell";
import { RegisterForm } from "@/components/website/account/account-forms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default async function RegisterPage({
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
      title="Create your account"
      description="See every order you place, follow your deliveries, and check out without typing your details again."
    >
      <RegisterForm ctx={site.ctx} businessSlug={businessSlug} next={next} />
    </AuthCard>
  );
}

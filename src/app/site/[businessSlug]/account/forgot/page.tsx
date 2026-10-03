import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import { AuthCard, loadAccountSite } from "@/components/website/account/account-shell";
import { ForgotForm } from "@/components/website/account/account-forms";
import { SiteLink } from "@/components/website/primitives";
import { emailReady } from "@/lib/mailer";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Forgot your password", robots: { index: false, follow: false } };

/**
 * With outgoing email, a reset link is emailed. Without it, the shop sends
 * one by WhatsApp: the owner makes it from the customer's page in the
 * dashboard, so the customer is pointed at the shop instead of a form whose
 * email would never arrive.
 */
export default async function ForgotPasswordPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const { site } = await loadAccountSite(businessSlug);

  if (emailReady()) {
    return (
      <AuthCard
        site={site}
        title="Forgot your password?"
        description="Enter the email on your account and we will send you a link to choose a new one."
      >
        <ForgotForm ctx={site.ctx} businessSlug={businessSlug} />
      </AuthCard>
    );
  }

  const { business } = site.ctx;
  const chatNumber = business.whatsapp || business.phone;

  return (
    <AuthCard
      site={site}
      title="Forgot your password?"
      description={`Message ${business.name} and we will send you a link to choose a new password.`}
    >
      <div style={{ display: "grid", gap: 10 }}>
        {chatNumber && (
          <a
            href={whatsappLink(chatNumber, `Hello ${business.name}, I forgot the password for my account on your website.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-btn w-btn--solid"
            style={{ width: "100%" }}
          >
            <MessageCircle size={15} />
            Message us on WhatsApp
          </a>
        )}
        {business.phone && (
          <a href={`tel:${business.phone}`} className="w-btn w-btn--outline" style={{ width: "100%" }}>
            <Phone size={15} />
            Call {business.phone}
          </a>
        )}
        <p className="w-muted" style={{ marginTop: 6, fontSize: 13.5, textAlign: "center" }}>
          Remembered it?{" "}
          <SiteLink ctx={site.ctx} href="/account/sign-in">
            <span style={{ color: "var(--w-primary)", fontWeight: 600 }}>Sign in</span>
          </SiteLink>
        </p>
      </div>
    </AuthCard>
  );
}

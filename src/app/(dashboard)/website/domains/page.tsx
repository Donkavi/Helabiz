import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Globe, Info } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { Domain } from "@/models/Domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { UpgradeNotice } from "@/components/dashboard/upgrade-notice";
import { getPlan } from "@/lib/plans";
import { SITE_DOMAIN, siteUrlFor } from "@/lib/website/urls";
import { DomainManager } from "./domain-manager";

export const metadata: Metadata = { title: "Domains" };

export default async function DomainsPage() {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).lean();
  if (!website) redirect("/website");

  const domains = await Domain.find({ businessId }).sort({ createdAt: -1 }).lean();
  const plan = getPlan(business.plan);
  const plainSite = serialize(website);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domains"
        description="Your free Helabiz address, plus your own domain name when you are ready."
      />

      {/* Free subdomain — always available */}
      <Card>
        <CardHeader>
          <CardTitle>Your Helabiz address</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4 pt-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <Globe className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[14px] font-medium">
              {plainSite.subdomain}.{SITE_DOMAIN}
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Free with every plan and always available, even if you add your own domain.
            </p>
          </div>
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="size-3" />
            Active
          </Badge>
        </CardContent>
      </Card>

      {!plan.limits.customDomain && (
        <UpgradeNotice
          title="Custom domains are a Business feature"
          description="Point a domain you own — like kavifashion.lk — at your Helabiz website."
        />
      )}

      <DomainManager
        canAdd={plan.limits.customDomain}
        domains={serialize(domains).map((domain) => ({
          id: String(domain._id),
          hostname: domain.hostname,
          status: domain.status ?? "pending",
          verificationToken: domain.verificationToken ?? "",
          createdAt: String(domain.createdAt),
        }))}
        target={siteUrlFor(business.slug)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            How custom domains work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-[13.5px] leading-relaxed text-muted-foreground">
          <p>
            You buy the domain from a registrar, then point it at Helabiz by adding two records with them. We check the
            records, issue an HTTPS certificate, and start serving your website from your own address.
          </p>
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>Add the domain below — we generate a verification record for you.</li>
            <li>Copy the CNAME and TXT records into your registrar&apos;s DNS settings.</li>
            <li>Come back and press Verify. DNS changes can take a few hours to spread.</li>
          </ol>
          <p className="text-[12.5px]">
            Verification and certificate issuing run through a provider integration that is not connected on this
            installation yet, so domains stay in a pending state until it is. Everything else — storage, routing and the
            request handling that serves a site by hostname — is already in place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

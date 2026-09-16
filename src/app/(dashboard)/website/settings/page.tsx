import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { PageHeader } from "@/components/ui/page-header";
import { WebsiteSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Website settings" };

export default async function WebsiteSettingsPage() {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).lean();
  if (!website) redirect("/website");

  const plain = serialize(website);

  return (
    <div className="space-y-6">
      <PageHeader title="Website settings" description="Your web address, search listing, and how your shop behaves." />
      <WebsiteSettingsForm
        initial={{
          name: plain.name,
          subdomain: plain.subdomain,
          seoTitle: plain.seo?.title ?? "",
          seoDescription: plain.seo?.description ?? "",
          showCart: plain.settings?.showCart ?? true,
          allowCheckout: plain.settings?.allowCheckout ?? true,
          whatsappOrdering: plain.settings?.whatsappOrdering ?? true,
          announcementEnabled: plain.settings?.announcementEnabled ?? false,
          announcement: plain.settings?.announcement ?? "",
          logo: business.logo ?? "",
        }}
        businessName={business.name}
      />
    </div>
  );
}

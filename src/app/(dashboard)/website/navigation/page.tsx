import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { PageHeader } from "@/components/ui/page-header";
import { asNavigation } from "@/services/website-service";
import { NavigationEditor } from "./navigation-editor";

export const metadata: Metadata = { title: "Website navigation" };

export default async function WebsiteNavigationPage() {
  const { businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).lean();
  if (!website) redirect("/website");

  const pages = await WebsitePage.find({ websiteId: website._id, businessId }).sort({ sortOrder: 1 }).lean();
  const plain = serialize(website);

  const existing = asNavigation(plain.navigation);
  const fallback = serialize(pages)
    .filter((page) => !page.isHome && !page.hidden && (page.showInNav ?? true))
    .map((page) => ({ id: page.slug, label: page.title, href: `/${page.slug}` }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation"
        description="The menu at the top of your website. Add links to pages, products or anywhere else."
      />
      <NavigationEditor
        initialItems={existing.length ? existing : fallback}
        pages={serialize(pages).map((page) => ({
          title: page.title,
          href: page.isHome ? "/" : `/${page.slug}`,
        }))}
      />
    </div>
  );
}

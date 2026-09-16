import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { PageHeader } from "@/components/ui/page-header";
import { usageFor } from "@/services/limits-service";
import { PagesManager } from "./pages-manager";

export const metadata: Metadata = { title: "Website pages" };

export default async function WebsitePagesPage() {
  const { businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).select("_id").lean();
  if (!website) redirect("/website");

  const [pages, usage] = await Promise.all([
    WebsitePage.find({ websiteId: website._id, businessId }).sort({ sortOrder: 1 }).lean(),
    usageFor(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description="Every page on your website. Drag to change the order they appear in your menu."
      />
      <PagesManager
        allowance={{
          used: usage.pages.used,
          max: usage.pages.limit,
          planId: usage.plan.id,
          planName: usage.plan.name,
        }}
        pages={serialize(pages).map((page) => ({
          id: String(page._id),
          title: page.title,
          slug: page.slug,
          isHome: Boolean(page.isHome),
          hidden: Boolean(page.hidden),
          showInNav: page.showInNav ?? true,
          sectionCount: Array.isArray(page.sections) ? page.sections.length : 0,
          lastEditedAt: page.lastEditedAt ? String(page.lastEditedAt) : undefined,
          seoTitle: page.seo?.title ?? "",
          seoDescription: page.seo?.description ?? "",
          noIndex: Boolean(page.seo?.noIndex),
        }))}
      />
    </div>
  );
}

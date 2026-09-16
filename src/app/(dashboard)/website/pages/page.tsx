import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { PageHeader } from "@/components/ui/page-header";
import { PagesManager } from "./pages-manager";

export const metadata: Metadata = { title: "Website pages" };

export default async function WebsitePagesPage() {
  const { businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).select("_id").lean();
  if (!website) redirect("/website");

  const pages = await WebsitePage.find({ websiteId: website._id, businessId }).sort({ sortOrder: 1 }).lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description="Every page on your website. Drag to change the order they appear in your menu."
      />
      <PagesManager
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

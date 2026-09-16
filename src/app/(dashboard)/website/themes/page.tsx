import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { PageHeader } from "@/components/ui/page-header";
import { ThemeGallery } from "./theme-gallery";

export const metadata: Metadata = { title: "Website themes" };

export default async function WebsiteThemesPage() {
  const { businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).lean();
  if (!website) redirect("/website");

  const home = await WebsitePage.findOne({ websiteId: website._id, isHome: true }).select("_id").lean();
  const plain = serialize(website);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Themes"
        description="A theme sets your colours, fonts and shapes. Swapping one keeps all your content exactly as it is."
      />
      <ThemeGallery
        currentThemeId={plain.themeId ?? "aurora"}
        builderHref={home ? `/website/builder/${home._id}` : "/website"}
      />
    </div>
  );
}

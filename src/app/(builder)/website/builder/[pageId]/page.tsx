import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { BuilderShell } from "@/components/website-builder/builder-shell";
import {
  asNavigation,
  asSection,
  asSections,
  asTheme,
  loadCatalogue,
  toSiteBusiness,
  toSiteSettings,
} from "@/services/website-service";
import { createSection } from "@/lib/website/section-registry";
import { siteUrlFor } from "@/lib/website/urls";
import { saveDraftAction, publishWebsiteAction } from "./actions";

export const metadata: Metadata = { title: "Website builder" };

export default async function BuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { business, businessId } = await requireBusiness();
  const { pageId } = await params;
  await connectDB();

  const page = await WebsitePage.findOne({ _id: pageId, businessId }).lean();
  if (!page) notFound();

  const website = await Website.findOne({ _id: page.websiteId, businessId }).lean();
  if (!website) redirect("/website");

  const [pages, catalogue] = await Promise.all([
    WebsitePage.find({ websiteId: website._id, businessId }).sort({ sortOrder: 1 }).select("title slug").lean(),
    loadCatalogue(businessId),
  ]);

  const plainPage = serialize(page);
  const plainSite = serialize(website);

  return (
    <BuilderShell
      pageId={String(plainPage._id)}
      pages={serialize(pages).map((p) => ({ id: String(p._id), title: p.title, slug: p.slug }))}
      initialDoc={{
        sections: asSections(plainPage.sections),
        header: asSection(plainSite.header) ?? createSection("header"),
        footer: asSection(plainSite.footer) ?? createSection("footer"),
        theme: asTheme(plainSite.theme),
      }}
      siteBase={{
        business: toSiteBusiness({ ...business, _id: businessId }),
        products: catalogue.products,
        categories: catalogue.categories,
        pages: serialize(pages).map((p) => ({ title: p.title, slug: p.slug })),
        navigation: asNavigation(plainSite.navigation),
        settings: toSiteSettings(plainSite.settings),
        basePath: `/site/${business.slug}`,
        editor: true,
        websiteId: String(plainSite._id),
        businessId,
      }}
      fieldCtx={{
        products: catalogue.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.images?.[0],
        })),
        categories: catalogue.categories.map((c) => ({ id: c.id, name: c.name })),
        pages: serialize(pages).map((p) => ({ title: p.title, slug: p.slug })),
      }}
      websiteStatus={plainSite.status ?? "draft"}
      hasUnpublishedChanges={Boolean(plainSite.hasUnpublishedChanges)}
      previewUrl={siteUrlFor(business.slug, plainPage.isHome ? "" : `/${plainPage.slug}`)}
      saveAction={saveDraftAction}
      publishAction={async () => {
        "use server";
        return publishWebsiteAction(String(website._id));
      }}
    />
  );
}

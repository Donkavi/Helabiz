import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import {
  asNavigation,
  asSection,
  asSections,
  asTheme,
  loadCatalogue,
  toSiteBusiness,
  toSiteSettings,
} from "@/services/website-service";
import type { SiteContext } from "./render-types";
import type { SectionNode } from "@/types";

export type LoadedSite = {
  businessId: string;
  websiteId: string;
  slug: string;
  status: string;
  header: SectionNode | null;
  footer: SectionNode | null;
  seo: { title?: string; description?: string; ogImage?: string };
  pages: {
    id: string;
    title: string;
    slug: string;
    isHome: boolean;
    kind: string;
    hidden: boolean;
    sections: SectionNode[];
    seo: { title?: string; description?: string; ogImage?: string; noIndex?: boolean };
    updatedAt?: string;
  }[];
  ctx: SiteContext;
};

/**
 * Loads a published website by business slug.
 *
 * Only `publishedSections` are read, so edits in the builder never leak to the
 * public site (spec §47). `cache` dedupes the work between `generateMetadata`
 * and the page render within one request.
 */
export const loadPublishedSite = cache(async (slug: string): Promise<LoadedSite | null> => {
  await connectDB();

  const business = await Business.findOne({ slug }).lean();
  if (!business) return null;

  const website = await Website.findOne({ businessId: business._id }).lean();
  if (!website || website.status !== "published") return null;

  const [pages, catalogue] = await Promise.all([
    WebsitePage.find({ websiteId: website._id }).sort({ sortOrder: 1 }).lean(),
    loadCatalogue(String(business._id)),
  ]);

  const visiblePages = pages.filter((page) => !page.hidden);

  const theme = asTheme(website.publishedTheme ?? website.theme);
  const navigation = asNavigation(
    (website.publishedNavigation?.length ? website.publishedNavigation : website.navigation) ?? [],
  );

  const ctx: SiteContext = {
    theme,
    business: toSiteBusiness(business),
    products: catalogue.products,
    categories: catalogue.categories,
    pages: visiblePages
      .filter((page) => page.showInNav ?? true)
      .map((page) => ({ title: page.title, slug: page.slug, isHome: Boolean(page.isHome) })),
    navigation,
    settings: toSiteSettings(website.settings),
    basePath: `/site/${slug}`,
    editor: false,
    viewport: "desktop",
    websiteId: String(website._id),
    businessId: String(business._id),
  };

  return {
    businessId: String(business._id),
    websiteId: String(website._id),
    slug,
    status: website.status,
    header: asSection(website.publishedHeader ?? website.header),
    footer: asSection(website.publishedFooter ?? website.footer),
    seo: {
      title: website.seo?.title ?? business.name,
      description: website.seo?.description ?? business.description ?? undefined,
      ogImage: website.seo?.ogImage ?? undefined,
    },
    pages: visiblePages.map((page) => ({
      id: String(page._id),
      title: page.title,
      slug: page.slug,
      isHome: Boolean(page.isHome),
      kind: page.kind ?? "standard",
      hidden: Boolean(page.hidden),
      sections: asSections(page.publishedSections),
      seo: {
        title: page.seo?.title ?? undefined,
        description: page.seo?.description ?? undefined,
        ogImage: page.seo?.ogImage ?? undefined,
        noIndex: Boolean(page.seo?.noIndex),
      },
      updatedAt: page.updatedAt ? String(page.updatedAt) : undefined,
    })),
    ctx,
  };
});

export function findPage(site: LoadedSite, slug?: string) {
  if (!slug || slug === "") return site.pages.find((page) => page.isHome) ?? site.pages[0] ?? null;
  return site.pages.find((page) => page.slug === slug) ?? null;
}

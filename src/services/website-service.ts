import { connectDB } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { Business } from "@/models/Business";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { cloneSection, createSection } from "@/lib/website/section-registry";
import { getTemplate } from "@/lib/website/templates";
import { normalizeTheme } from "@/lib/website/themes";
import { uniqueSlug } from "./business-service";
import { usageFor } from "./limits-service";
import { UNLIMITED } from "@/lib/plans";
import type { NavItem, SectionNode, ThemeTokens } from "@/types";
import type { PublicCategory, PublicProduct, SiteBusiness, SiteSettings } from "@/lib/website/render-types";

/** Creates a website for a business from a template (spec §20). */
export async function createWebsiteFromTemplate(businessId: string, templateId: string) {
  await connectDB();

  const business = await Business.findById(businessId).lean();
  if (!business) throw new Error("Business not found");

  const template = getTemplate(templateId);

  const subdomain = await uniqueSlug(business.slug || business.name, async (candidate) => {
    const hit = await Website.findOne({ subdomain: candidate }).select("_id").lean();
    return Boolean(hit);
  });

  const header = cloneSection(template.header);
  const footer = cloneSection(template.footer);

  const website = await Website.create({
    businessId,
    name: business.name,
    subdomain,
    templateId: template.id,
    themeId: template.themeId,
    theme: template.theme,
    header,
    footer,
    navigation: template.pages
      .filter((page) => !page.isHome)
      .map((page) => ({ id: page.slug, label: page.title, href: `/${page.slug}` })),
    status: "draft",
    hasUnpublishedChanges: true,
    lastEditedAt: new Date(),
    seo: {
      title: business.name,
      description: business.description || `Shop online with ${business.name}.`,
    },
  });

  await WebsitePage.insertMany(
    template.pages.map((page, index) => ({
      businessId,
      websiteId: website._id,
      title: page.title,
      slug: page.slug,
      isHome: Boolean(page.isHome),
      kind: page.kind ?? "standard",
      sections: page.sections.map(cloneSection),
      publishedSections: [],
      seo: {
        title: page.seo?.title ?? page.title,
        description: page.seo?.description ?? business.description ?? undefined,
      },
      sortOrder: index,
      lastEditedAt: new Date(),
    })),
  );

  return website;
}

/**
 * Rebuilds an existing website from a different template.
 *
 * Deliberately not a delete-and-recreate. Pages keep their ids, slugs, titles
 * and SEO, so inbound links and anything pointing at a page id survive; only
 * the sections inside them are replaced. Pages the template does not cover —
 * ones the business added itself — are left alone entirely, and so is the
 * published snapshot, which means the live site carries on serving the old
 * design until someone republishes.
 */
export async function applyTemplateToWebsite(
  businessId: string,
  websiteId: string,
  templateId: string,
  { applyTheme = true }: { applyTheme?: boolean } = {},
) {
  await connectDB();

  const website = await Website.findOne({ _id: websiteId, businessId });
  if (!website) throw new Error("Website not found");

  const template = getTemplate(templateId);
  const business = await Business.findById(businessId).lean();
  const existing = await WebsitePage.find({ websiteId, businessId }).sort({ sortOrder: 1 });

  // Home is matched by its flag rather than its slug: a business may have
  // renamed it, and there must never be two.
  const home = existing.find((page) => page.isHome);
  const bySlug = new Map(existing.map((page) => [page.slug, page]));

  const { pages: pageLimit } = await usageFor(businessId);
  let room = pageLimit.limit === UNLIMITED ? Infinity : pageLimit.limit - existing.length;

  const used = new Set<string>();
  const added: { id: string; title: string; slug: string }[] = [];
  const skipped: string[] = [];
  let order = 0;

  for (const page of template.pages) {
    const target = page.isHome ? home : bySlug.get(page.slug);

    if (target && !used.has(String(target._id))) {
      target.sections = page.sections.map(cloneSection);
      target.kind = page.kind ?? "standard";
      target.sortOrder = order++;
      target.lastEditedAt = new Date();
      await target.save();
      used.add(String(target._id));
      continue;
    }
    if (target) continue; // already claimed by an earlier template page

    if (room < 1) {
      skipped.push(page.title);
      continue;
    }

    const created = await WebsitePage.create({
      businessId,
      websiteId,
      title: page.title,
      slug: page.slug,
      isHome: false,
      kind: page.kind ?? "standard",
      sections: page.sections.map(cloneSection),
      publishedSections: [],
      seo: {
        title: page.seo?.title ?? page.title,
        description: page.seo?.description ?? business?.description ?? undefined,
      },
      sortOrder: order++,
      lastEditedAt: new Date(),
    });
    room -= 1;
    added.push({ id: String(created._id), title: created.title, slug: created.slug });
  }

  // Anything the template did not touch keeps its content and follows on.
  for (const page of existing) {
    if (used.has(String(page._id))) continue;
    page.sortOrder = order++;
    await page.save();
  }

  // Existing navigation is kept — it may hold custom links and renamed
  // labels — and only gains an entry for each page this added.
  const hrefs = new Set(website.navigation.map((item) => item.href));
  for (const page of added) {
    if (hrefs.has(`/${page.slug}`)) continue;
    website.navigation.push({ id: page.slug, label: page.title, href: `/${page.slug}` });
  }

  website.templateId = template.id;
  website.header = cloneSection(template.header);
  website.footer = cloneSection(template.footer);
  if (applyTheme) {
    website.themeId = template.themeId;
    website.theme = template.theme;
  }
  website.hasUnpublishedChanges = true;
  website.lastEditedAt = new Date();
  await website.save();

  return { added: added.length, skipped };
}

/** Copies every page's draft into its published snapshot (spec §47). */
export async function publishWebsite(businessId: string, websiteId: string) {
  await connectDB();

  const website = await Website.findOne({ _id: websiteId, businessId });
  if (!website) throw new Error("Website not found");

  const pages = await WebsitePage.find({ websiteId, businessId });
  for (const page of pages) {
    page.publishedSections = page.sections;
    await page.save();
  }

  website.publishedTheme = website.theme;
  website.publishedHeader = website.header;
  website.publishedFooter = website.footer;
  website.publishedNavigation = website.navigation;
  website.status = "published";
  website.publishedAt = new Date();
  website.hasUnpublishedChanges = false;
  await website.save();

  return website;
}

export async function unpublishWebsite(businessId: string, websiteId: string) {
  await connectDB();
  await Website.updateOne({ _id: websiteId, businessId }, { $set: { status: "draft" } });
}

/** Marks the site as having edits that are not live yet. */
export async function touchWebsite(businessId: string, websiteId: string) {
  await Website.updateOne(
    { _id: websiteId, businessId },
    { $set: { hasUnpublishedChanges: true, lastEditedAt: new Date() } },
  );
}

export function toPublicProduct(product: {
  _id: unknown;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: string[] | null;
  stock?: number | null;
  trackInventory?: boolean | null;
  categoryId?: unknown;
  featured?: boolean | null;
  sold?: number | null;
  createdAt?: unknown;
  shortDescription?: string | null;
  description?: string | null;
  variants?: { _id: unknown; name: string; price?: number | null; stock?: number | null }[] | null;
}): PublicProduct {
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    images: product.images ?? [],
    stock: product.stock ?? 0,
    trackInventory: product.trackInventory ?? true,
    categoryId: product.categoryId ? String(product.categoryId) : undefined,
    featured: Boolean(product.featured),
    sold: product.sold ?? 0,
    createdAt: product.createdAt ? String(product.createdAt) : undefined,
    shortDescription: product.shortDescription ?? undefined,
    description: product.description ?? undefined,
    variants: (product.variants ?? []).map((v) => ({
      id: String(v._id),
      name: v.name,
      price: v.price ?? undefined,
      stock: v.stock ?? 0,
    })),
  };
}

/** Loads the catalogue data every website render needs. */
export async function loadCatalogue(businessId: string) {
  const [products, categories] = await Promise.all([
    Product.find({ businessId, status: "active" }).sort({ createdAt: -1 }).limit(300).lean(),
    Category.find({ businessId }).sort({ sortOrder: 1, name: 1 }).lean(),
  ]);

  return {
    products: products.map(toPublicProduct),
    categories: categories.map<PublicCategory>((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      image: c.image ?? undefined,
    })),
  };
}

export function toSiteBusiness(business: {
  _id: unknown;
  name: string;
  logo?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  description?: string | null;
  deliveryFee?: number | null;
  freeDeliveryOver?: number | null;
  social?: { facebook?: string | null; instagram?: string | null; tiktok?: string | null; youtube?: string | null } | null;
}): SiteBusiness {
  return {
    id: String(business._id),
    name: business.name,
    logo: business.logo ?? undefined,
    phone: business.phone ?? undefined,
    whatsapp: business.whatsapp ?? undefined,
    email: business.email ?? undefined,
    address: business.address ?? undefined,
    city: business.city ?? undefined,
    district: business.district ?? undefined,
    description: business.description ?? undefined,
    deliveryFee: business.deliveryFee ?? 0,
    freeDeliveryOver: business.freeDeliveryOver ?? 0,
    social: {
      facebook: business.social?.facebook ?? undefined,
      instagram: business.social?.instagram ?? undefined,
      tiktok: business.social?.tiktok ?? undefined,
      youtube: business.social?.youtube ?? undefined,
    },
  };
}

export function toSiteSettings(settings?: {
  showCart?: boolean | null;
  allowCheckout?: boolean | null;
  whatsappOrdering?: boolean | null;
  announcement?: string | null;
  announcementEnabled?: boolean | null;
} | null): SiteSettings {
  return {
    showCart: settings?.showCart ?? true,
    allowCheckout: settings?.allowCheckout ?? true,
    whatsappOrdering: settings?.whatsappOrdering ?? true,
    announcement: settings?.announcement ?? undefined,
    announcementEnabled: settings?.announcementEnabled ?? false,
  };
}

export function asSections(value: unknown): SectionNode[] {
  return Array.isArray(value) ? (value as SectionNode[]) : [];
}

export function asSection(value: unknown): SectionNode | null {
  if (value && typeof value === "object" && "type" in (value as object)) return value as SectionNode;
  return null;
}

export function asNavigation(value: unknown): NavItem[] {
  return Array.isArray(value) ? (value as NavItem[]) : [];
}

export function asTheme(value: unknown): ThemeTokens {
  return normalizeTheme((value ?? {}) as Partial<ThemeTokens>);
}

/** A brand-new blank page, used by "Add page" in the builder. */
export function blankPageSections(title: string): SectionNode[] {
  return [
    {
      ...createSection("heading"),
      props: { eyebrow: "", text: title, level: "h1", subtext: "" },
      styles: { paddingY: 72, align: "center", maxWidth: "md" },
    },
    createSection("paragraph"),
  ];
}

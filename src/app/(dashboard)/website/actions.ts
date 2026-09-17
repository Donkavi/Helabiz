"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { Domain } from "@/models/Domain";
import { fieldErrorsFrom, type ActionState } from "@/lib/validations/errors";
import { assertWithinLimit, checkLimit, LimitError, hasFeature, type LimitBlock } from "@/services/limits-service";
import {
  applyTemplateToWebsite,
  blankPageSections,
  createWebsiteFromTemplate,
  publishWebsite,
  touchWebsite,
  unpublishWebsite,
} from "@/services/website-service";
import { uniqueSlug } from "@/services/business-service";
import { cloneSection } from "@/lib/website/section-registry";
import { getTheme } from "@/lib/website/themes";
import { slugify } from "@/lib/utils";
import type { SectionNode } from "@/types";

/** Shared lookup: the business's (single) website. */
async function websiteFor(businessId: string) {
  await connectDB();
  return Website.findOne({ businessId });
}

export async function createWebsiteAction(templateId: string) {
  const { businessId } = await requireBusiness();

  try {
    await assertWithinLimit(businessId, "websites");
  } catch (error) {
    if (error instanceof LimitError) return { ok: false as const, error: error.message };
    throw error;
  }

  const existing = await websiteFor(businessId);
  if (existing) return { ok: false as const, error: "You already have a website." };

  const website = await createWebsiteFromTemplate(businessId, templateId);
  const home = await WebsitePage.findOne({ websiteId: website._id, isHome: true }).select("_id").lean();

  revalidatePath("/website");
  revalidatePath("/dashboard");
  redirect(home ? `/website/builder/${home._id}` : "/website");
}

export type ChangeTemplateResult =
  | { ok: true; added: number; skipped: string[] }
  | { ok: false; error: string };

/**
 * Rebuilds the existing site from a different template.
 *
 * Destructive for the pages the template covers, so the confirmation lives in
 * the dialog that calls this. The live site is untouched until a republish.
 */
export async function changeTemplateAction(
  templateId: string,
  options?: { applyTheme?: boolean },
): Promise<ChangeTemplateResult> {
  const { businessId } = await requireBusiness();
  const website = await websiteFor(businessId);
  if (!website) return { ok: false, error: "You do not have a website yet." };

  const result = await applyTemplateToWebsite(businessId, String(website._id), templateId, {
    applyTheme: options?.applyTheme ?? true,
  });

  revalidatePath("/website", "layout");
  return { ok: true, added: result.added, skipped: result.skipped };
}

export async function publishAction() {
  const { businessId } = await requireBusiness();
  const website = await websiteFor(businessId);
  if (!website) return { ok: false as const, error: "No website yet" };

  await publishWebsite(businessId, String(website._id));
  revalidatePath("/website");
  revalidatePath("/site", "layout");
  return { ok: true as const };
}

export async function unpublishAction() {
  const { businessId } = await requireBusiness();
  const website = await websiteFor(businessId);
  if (!website) return { ok: false as const, error: "No website yet" };

  await unpublishWebsite(businessId, String(website._id));
  revalidatePath("/website");
  revalidatePath("/site", "layout");
  return { ok: true as const };
}

/* ── Pages (spec §14) ──────────────────────────────────────────────────── */

const pageSchema = z.object({
  title: z.string().min(1, "Give the page a name").max(60),
  slug: z.string().max(60).optional(),
});

export type CreatePageResult =
  | { ok: true; pageId: string }
  | { ok: false; error: string; blocked?: LimitBlock };

/**
 * Adds a page. Returns the new page's id so the builder can jump straight to it,
 * and a structured `blocked` payload when the plan is the reason it failed — the
 * UI turns that into an upgrade prompt instead of a bare error.
 */
export async function addPageAction(title: string): Promise<CreatePageResult> {
  const { businessId } = await requireBusiness();

  const parsed = pageSchema.safeParse({ title });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Give the page a name" };
  }

  const website = await websiteFor(businessId);
  if (!website) return { ok: false, error: "Create your website first" };

  const blocked = await checkLimit(businessId, "pages");
  if (blocked) return { ok: false, error: blocked.message, blocked };

  const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, async (candidate) => {
    const hit = await WebsitePage.findOne({ websiteId: website._id, slug: candidate }).select("_id").lean();
    return Boolean(hit);
  });

  const last = await WebsitePage.findOne({ websiteId: website._id }).sort({ sortOrder: -1 }).select("sortOrder").lean();

  const page = await WebsitePage.create({
    businessId,
    websiteId: website._id,
    title: parsed.data.title,
    slug,
    sections: blankPageSections(parsed.data.title),
    sortOrder: (last?.sortOrder ?? 0) + 1,
    seo: { title: parsed.data.title },
    lastEditedAt: new Date(),
  });

  await touchWebsite(businessId, String(website._id));
  revalidatePath("/website/pages");
  revalidatePath("/website");
  return { ok: true, pageId: String(page._id) };
}

/** Reports whether another page can be added, for disabling the button up front. */
export async function pageLimitAction(): Promise<LimitBlock | null> {
  const { businessId } = await requireBusiness();
  return checkLimit(businessId, "pages");
}

export async function updatePageAction(
  pageId: string,
  updates: { title?: string; slug?: string; hidden?: boolean; showInNav?: boolean; seo?: Record<string, unknown> },
) {
  const { businessId } = await requireBusiness();
  await connectDB();

  const page = await WebsitePage.findOne({ _id: pageId, businessId });
  if (!page) return { ok: false as const, error: "Page not found" };

  if (updates.title) page.title = updates.title.slice(0, 60);
  if (updates.slug && !page.isHome) {
    const desired = slugify(updates.slug);
    const clash = await WebsitePage.findOne({
      websiteId: page.websiteId,
      slug: desired,
      _id: { $ne: page._id },
    })
      .select("_id")
      .lean();
    if (clash) return { ok: false as const, error: "Another page already uses that address" };
    page.slug = desired;
  }
  if (updates.hidden !== undefined) page.hidden = updates.hidden;
  if (updates.showInNav !== undefined) page.showInNav = updates.showInNav;
  if (updates.seo) {
    page.set("seo", {
      title: (updates.seo.title as string) ?? page.seo?.title,
      description: (updates.seo.description as string) ?? page.seo?.description,
      ogImage: (updates.seo.ogImage as string) ?? page.seo?.ogImage,
      keywords: (updates.seo.keywords as string[]) ?? page.seo?.keywords ?? [],
      noIndex: (updates.seo.noIndex as boolean) ?? page.seo?.noIndex ?? false,
    });
  }

  await page.save();
  await touchWebsite(businessId, String(page.websiteId));
  revalidatePath("/website/pages");
  return { ok: true as const };
}

export async function duplicatePageAction(pageId: string) {
  const { businessId } = await requireBusiness();
  await connectDB();

  const page = await WebsitePage.findOne({ _id: pageId, businessId }).lean();
  if (!page) return { ok: false as const, error: "Page not found" };

  const blocked = await checkLimit(businessId, "pages");
  if (blocked) return { ok: false as const, error: blocked.message, blocked };

  const slug = await uniqueSlug(`${page.slug}-copy`, async (candidate) => {
    const hit = await WebsitePage.findOne({ websiteId: page.websiteId, slug: candidate }).select("_id").lean();
    return Boolean(hit);
  });

  const sections = Array.isArray(page.sections) ? (page.sections as SectionNode[]) : [];

  await WebsitePage.create({
    businessId,
    websiteId: page.websiteId,
    title: `${page.title} copy`,
    slug,
    isHome: false,
    kind: page.kind,
    sections: sections.map(cloneSection),
    sortOrder: (page.sortOrder ?? 0) + 1,
    seo: page.seo,
    lastEditedAt: new Date(),
  });

  await touchWebsite(businessId, String(page.websiteId));
  revalidatePath("/website/pages");
  return { ok: true as const };
}

export async function deletePageAction(pageId: string) {
  const { businessId } = await requireBusiness();
  await connectDB();

  const page = await WebsitePage.findOne({ _id: pageId, businessId });
  if (!page) return { ok: false as const, error: "Page not found" };
  if (page.isHome) return { ok: false as const, error: "Your home page cannot be deleted" };

  await page.deleteOne();
  await touchWebsite(businessId, String(page.websiteId));
  revalidatePath("/website/pages");
  return { ok: true as const };
}

export async function reorderPagesAction(orderedIds: string[]) {
  const { businessId } = await requireBusiness();
  await connectDB();

  await Promise.all(
    orderedIds.map((id, index) => WebsitePage.updateOne({ _id: id, businessId }, { $set: { sortOrder: index } })),
  );

  revalidatePath("/website/pages");
  return { ok: true as const };
}

/* ── Theme, navigation, settings ───────────────────────────────────────── */

export async function applyThemeAction(themeId: string) {
  const { businessId } = await requireBusiness();
  const website = await websiteFor(businessId);
  if (!website) return { ok: false as const, error: "No website yet" };

  const preset = getTheme(themeId);
  website.themeId = preset.id;
  website.theme = preset.tokens;
  website.hasUnpublishedChanges = true;
  website.lastEditedAt = new Date();
  await website.save();

  revalidatePath("/website/themes");
  revalidatePath("/website");
  return { ok: true as const };
}

const navSchema = z.array(
  z.object({
    id: z.string().max(80),
    label: z.string().min(1).max(40),
    href: z.string().min(1).max(200),
  }),
);

export async function saveNavigationAction(items: { id: string; label: string; href: string }[]) {
  const { businessId } = await requireBusiness();
  const parsed = navSchema.safeParse(items);
  if (!parsed.success) return { ok: false as const, error: "Those menu items could not be saved" };

  const website = await websiteFor(businessId);
  if (!website) return { ok: false as const, error: "No website yet" };

  await Website.updateOne(
    { _id: website._id, businessId },
    { $set: { navigation: parsed.data, hasUnpublishedChanges: true } },
  );

  revalidatePath("/website/navigation");
  return { ok: true as const };
}

const settingsSchema = z.object({
  name: z.string().min(1).max(80),
  subdomain: z
    .string()
    .min(3, "Use at least 3 characters")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and dashes"),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(180).optional().or(z.literal("")),
  showCart: z.coerce.boolean().default(true),
  allowCheckout: z.coerce.boolean().default(true),
  whatsappOrdering: z.coerce.boolean().default(true),
  announcementEnabled: z.coerce.boolean().default(false),
  announcement: z.string().max(160).optional().or(z.literal("")),
});

export async function saveWebsiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId } = await requireBusiness();

  const raw = Object.fromEntries(formData);
  const parsed = settingsSchema.safeParse({
    ...raw,
    showCart: raw.showCart === "on" || raw.showCart === "true",
    allowCheckout: raw.allowCheckout === "on" || raw.allowCheckout === "true",
    whatsappOrdering: raw.whatsappOrdering === "on" || raw.whatsappOrdering === "true",
    announcementEnabled: raw.announcementEnabled === "on" || raw.announcementEnabled === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const website = await websiteFor(businessId);
  if (!website) return { ok: false, error: "No website yet" };

  if (parsed.data.subdomain !== website.subdomain) {
    const taken = await Website.findOne({ subdomain: parsed.data.subdomain, _id: { $ne: website._id } })
      .select("_id")
      .lean();
    if (taken) return { ok: false, fieldErrors: { subdomain: "That address is already taken" } };
  }

  await Website.updateOne(
    { _id: website._id, businessId },
    {
      $set: {
        name: parsed.data.name,
        subdomain: parsed.data.subdomain,
        "seo.title": parsed.data.seoTitle || undefined,
        "seo.description": parsed.data.seoDescription || undefined,
        "settings.showCart": parsed.data.showCart,
        "settings.allowCheckout": parsed.data.allowCheckout,
        "settings.whatsappOrdering": parsed.data.whatsappOrdering,
        "settings.announcementEnabled": parsed.data.announcementEnabled,
        "settings.announcement": parsed.data.announcement || undefined,
        hasUnpublishedChanges: true,
      },
    },
  );

  revalidatePath("/website/settings");
  revalidatePath("/website");
  return { ok: true };
}

/* ── Domains (spec §23 — architecture for later) ───────────────────────── */

export async function addDomainAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { businessId } = await requireBusiness();

  if (!(await hasFeature(businessId, "customDomain"))) {
    return { ok: false, error: "Custom domains are available on the Business plan." };
  }

  const hostname = String(formData.get("hostname") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) {
    return { ok: false, fieldErrors: { hostname: "Enter a domain like shop.example.lk" } };
  }

  const website = await websiteFor(businessId);
  if (!website) return { ok: false, error: "Create your website first" };

  const taken = await Domain.findOne({ hostname }).select("_id").lean();
  if (taken) return { ok: false, fieldErrors: { hostname: "That domain is already connected" } };

  await Domain.create({
    businessId,
    websiteId: website._id,
    hostname,
    type: "custom",
    status: "pending",
    verificationToken: `helabiz-verify-${Math.random().toString(36).slice(2, 12)}`,
  });

  revalidatePath("/website/domains");
  return { ok: true };
}

export async function removeDomainAction(domainId: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Domain.deleteOne({ _id: domainId, businessId });
  revalidatePath("/website/domains");
  return { ok: true as const };
}

export async function saveBusinessBrandingAction(logo: string) {
  const { businessId } = await requireBusiness();
  await connectDB();
  await Business.updateOne({ _id: businessId }, { $set: { logo: logo || undefined } });
  revalidatePath("/website/settings");
  return { ok: true as const };
}

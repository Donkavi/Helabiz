"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { fieldErrorsFrom } from "@/lib/validations/errors";
import { rateLimit } from "@/lib/rate-limit";
import { assertWithinLimit, LimitError } from "@/services/limits-service";
import { generateWebsitePlan, type AiWebsitePlan } from "@/services/ai-website-service";
import { uniqueSlug } from "@/services/business-service";
import { createSection } from "@/lib/website/section-registry";

const briefSchema = z.object({
  description: z.string().min(20, "Tell us a bit more — at least a sentence or two").max(1000),
  tone: z.enum(["warm", "premium", "playful", "professional"]).default("professional"),
});

export type AiState =
  | { ok: true; plan: AiWebsitePlan }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | null;

export async function generateWebsiteAction(_prev: AiState, formData: FormData): Promise<AiState> {
  const { business, businessId, user } = await requireBusiness();

  const limited = await rateLimit(`ai:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) return { ok: false, error: "Give it a moment before generating again." };

  const parsed = briefSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const plan = await generateWebsitePlan({
    businessName: business.name,
    description: parsed.data.description,
    industry: business.type ?? undefined,
    city: business.city ?? undefined,
    tone: parsed.data.tone,
  });

  // Keep the brief so the description is not lost if they regenerate.
  await connectDB();
  if (!business.description) {
    await Business.updateOne({ _id: businessId }, { $set: { description: parsed.data.description.slice(0, 400) } });
  }

  return { ok: true, plan };
}

/** Turns an accepted plan into a real website. */
export async function acceptAiPlanAction(plan: AiWebsitePlan) {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  try {
    await assertWithinLimit(businessId, "websites");
  } catch (error) {
    if (error instanceof LimitError) return { ok: false as const, error: error.message };
    throw error;
  }

  const existing = await Website.findOne({ businessId }).select("_id").lean();
  if (existing) return { ok: false as const, error: "You already have a website." };

  const subdomain = await uniqueSlug(business.slug || business.name, async (candidate) => {
    const hit = await Website.findOne({ subdomain: candidate }).select("_id").lean();
    return Boolean(hit);
  });

  const website = await Website.create({
    businessId,
    name: business.name,
    subdomain,
    themeId: plan.themeId,
    theme: plan.theme,
    header: createSection("header"),
    footer: createSection("footer"),
    navigation: plan.pages
      .filter((page) => !page.isHome)
      .map((page) => ({ id: page.slug, label: page.title, href: `/${page.slug}` })),
    status: "draft",
    hasUnpublishedChanges: true,
    lastEditedAt: new Date(),
    seo: { title: business.name, description: plan.heroDescription },
  });

  await WebsitePage.insertMany(
    plan.pages.map((page, index) => ({
      businessId,
      websiteId: website._id,
      title: page.title,
      slug: page.slug,
      isHome: Boolean(page.isHome),
      kind: page.slug === "shop" ? "shop" : "standard",
      sections: page.sections,
      publishedSections: [],
      seo: { title: page.title, description: plan.heroDescription },
      sortOrder: index,
      lastEditedAt: new Date(),
    })),
  );

  const home = await WebsitePage.findOne({ websiteId: website._id, isHome: true }).select("_id").lean();

  revalidatePath("/website");
  revalidatePath("/dashboard");
  return { ok: true as const, pageId: home ? String(home._id) : null };
}

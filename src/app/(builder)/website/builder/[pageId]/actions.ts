"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { countNodes } from "@/lib/website/tree";
import { publishWebsite } from "@/services/website-service";
import type { SectionNode, ThemeTokens } from "@/types";

/**
 * Sections are free-form JSON, so the payload is validated structurally rather
 * than field-by-field: shape, id/type presence, and hard size caps that stop a
 * runaway client from writing an unbounded document.
 */
const MAX_SECTIONS = 300;
const MAX_PAYLOAD_BYTES = 2_000_000;

const nodeShape: z.ZodType<SectionNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(64),
    type: z.string().min(1).max(60),
    props: z.record(z.string(), z.unknown()),
    styles: z.record(z.string(), z.unknown()),
    responsiveStyles: z.record(z.string(), z.unknown()).optional(),
    children: z.array(nodeShape).optional(),
  }),
) as z.ZodType<SectionNode>;

const savePayloadSchema = z.object({
  sections: z.array(nodeShape).max(MAX_SECTIONS),
  header: nodeShape.nullable(),
  footer: nodeShape.nullable(),
  theme: z.record(z.string(), z.unknown()),
});

export type SaveResult = { ok: boolean; error?: string };

export async function saveDraftAction(
  pageId: string,
  payload: {
    sections: SectionNode[];
    header: SectionNode | null;
    footer: SectionNode | null;
    theme: ThemeTokens;
  },
): Promise<SaveResult> {
  const { businessId } = await requireBusiness();

  if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: "This page has grown too large to save. Try splitting it into two pages." };
  }

  const parsed = savePayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "That change could not be saved." };

  await connectDB();

  // Scoping by businessId is what stops one tenant writing another's page.
  const page = await WebsitePage.findOne({ _id: pageId, businessId });
  if (!page) return { ok: false, error: "Page not found" };

  if (countNodes(parsed.data.sections) > MAX_SECTIONS) {
    return { ok: false, error: "This page has too many sections." };
  }

  page.sections = parsed.data.sections;
  page.lastEditedAt = new Date();
  await page.save();

  await Website.updateOne(
    { _id: page.websiteId, businessId },
    {
      $set: {
        header: parsed.data.header ?? undefined,
        footer: parsed.data.footer ?? undefined,
        theme: parsed.data.theme,
        hasUnpublishedChanges: true,
        lastEditedAt: new Date(),
      },
    },
  );

  return { ok: true };
}

export async function publishWebsiteAction(websiteId: string): Promise<SaveResult> {
  const { businessId } = await requireBusiness();

  try {
    await publishWebsite(businessId, websiteId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not publish" };
  }

  revalidatePath("/website");
  revalidatePath("/website/pages");
  revalidatePath("/dashboard");
  revalidatePath("/site", "layout");
  return { ok: true };
}

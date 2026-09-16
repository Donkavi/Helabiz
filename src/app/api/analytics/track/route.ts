import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Website } from "@/models/Website";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Public endpoint — it is called by visitors who are not signed in, so it
 * validates strictly, rate-limits per visitor, and only ever writes analytics
 * rows for a business that actually has a published website.
 */
const schema = z.object({
  businessId: z.string().regex(/^[a-f\d]{24}$/i),
  websiteId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  type: z.enum(["page_view", "product_view", "add_to_cart", "begin_checkout", "order"]),
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  productId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  productName: z.string().max(200).optional(),
  value: z.number().min(0).max(100_000_000).optional(),
  visitorId: z.string().max(80).optional(),
  device: z.enum(["mobile", "tablet", "desktop"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const data = parsed.data;

  const limited = await rateLimit(`track:${data.visitorId ?? data.businessId}`, { limit: 120, windowMs: 60_000 });
  if (!limited.ok) return NextResponse.json({ ok: true, skipped: true });

  await connectDB();

  const website = await Website.findOne({ businessId: data.businessId, status: "published" })
    .select("_id")
    .lean();
  if (!website) return NextResponse.json({ ok: true, skipped: true });

  await AnalyticsEvent.create({
    businessId: new Types.ObjectId(data.businessId),
    websiteId: website._id,
    type: data.type,
    path: data.path,
    referrer: data.referrer,
    productId: data.productId ? new Types.ObjectId(data.productId) : undefined,
    productName: data.productName,
    value: data.value ?? 0,
    visitorId: data.visitorId,
    device: data.device ?? "desktop",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}

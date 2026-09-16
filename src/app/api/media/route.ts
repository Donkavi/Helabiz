import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Media } from "@/models/Media";
import { getStorage, UploadError } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { businessId } = await requireBusiness();
  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();

  const items = await Media.find({
    businessId,
    ...(search ? { name: { $regex: search, $options: "i" } } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({
    items: serialize(items).map((m) => ({
      id: String(m._id),
      url: m.url,
      name: m.name,
      size: m.size ?? 0,
      alt: m.alt ?? "",
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const { businessId, user } = await requireBusiness();

  const limited = await rateLimit(`upload:${user.id}`, { limit: 40, windowMs: 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Too many uploads. Please wait a moment." }, { status: 429 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files were uploaded" }, { status: 400 });

  await connectDB();
  const storage = getStorage();
  const created = [];

  try {
    for (const file of files.slice(0, 12)) {
      const stored = await storage.put({ businessId, file });
      const record = await Media.create({
        businessId,
        name: stored.name,
        url: stored.url,
        size: stored.size,
        type: stored.type,
      });
      created.push({ id: String(record._id), url: stored.url, name: stored.name, size: stored.size, alt: "" });
    }
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }

  return NextResponse.json({ items: created });
}

export async function DELETE(request: Request) {
  const { businessId } = await requireBusiness();
  const { id } = (await request.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  const media = await Media.findOne({ _id: id, businessId });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await getStorage().remove(media.url);
  await media.deleteOne();
  return NextResponse.json({ ok: true });
}

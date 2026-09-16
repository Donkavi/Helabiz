import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { BusinessMember } from "@/models/BusinessMember";
import { Subscription } from "@/models/Subscription";
import { User } from "@/models/User";
import { slugify } from "@/lib/utils";

/** Finds a free slug by appending -2, -3 … when the preferred one is taken. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "business";
  if (!(await exists(root))) return root;
  for (let i = 2; i < 200; i += 1) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export type CreateBusinessData = {
  name: string;
  type?: string;
  city?: string;
  district?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
};

/**
 * Creates a business together with its owner membership and subscription row.
 * Used by onboarding, the business switcher and the demo seeder.
 */
export async function createBusinessForUser(userId: string, data: CreateBusinessData) {
  await connectDB();

  const slug = await uniqueSlug(data.name, async (candidate) => {
    const hit = await Business.findOne({ slug: candidate }).select("_id").lean();
    return Boolean(hit);
  });

  const business = await Business.create({
    name: data.name.trim(),
    slug,
    ownerId: userId,
    type: data.type || "retail",
    city: data.city || undefined,
    district: data.district || undefined,
    phone: data.phone || undefined,
    whatsapp: data.whatsapp || data.phone || undefined,
    description: data.description || undefined,
    plan: "free",
  });

  await BusinessMember.create({ businessId: business._id, userId, role: "owner", status: "active" });
  await Subscription.create({
    businessId: business._id,
    plan: "free",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await User.findByIdAndUpdate(userId, { lastBusinessId: business._id, onboardedAt: new Date() });

  return business;
}

// Re-exported for server callers that already import from this service.
export { BUSINESS_TYPES, SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";

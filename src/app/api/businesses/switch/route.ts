import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACTIVE_BUSINESS_COOKIE, AccessError, resolveBusinessAccess } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { businessId?: string };
    if (!body.businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

    // Throws unless the signed-in user is actually a member of that business.
    const access = await resolveBusinessAccess(body.businessId);

    const store = await cookies();
    store.set(ACTIVE_BUSINESS_COOKIE, access.businessId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    await connectDB();
    await User.findByIdAndUpdate(access.userId, { lastBusinessId: access.businessId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "Could not switch business" }, { status: 500 });
  }
}

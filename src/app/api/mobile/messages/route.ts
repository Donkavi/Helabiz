import { NextResponse } from "next/server";
import { hasAddon } from "@/lib/addons";
import { mobileRoute, requireMobileBusiness } from "@/lib/mobile/auth";
import { listShopThreads } from "@/services/shop-chat-service";

/** GET — the shop's customer conversations, unanswered first. */
export const GET = mobileRoute(async (request) => {
  const { business, businessId } = await requireMobileBusiness(request);
  const threads = await listShopThreads(businessId);
  return NextResponse.json({
    // Old conversations stay readable after the add-on lapses; replying needs it.
    canReply: hasAddon(business, "whatsapp_chat"),
    threads,
  });
});

import { NextResponse } from "next/server";
import { hasAddon } from "@/lib/addons";
import { mobileRoute, requireMobileBusiness } from "@/lib/mobile/auth";
import { toOrderSummary } from "@/lib/mobile/shape";
import { Website } from "@/models/Website";
import { getDashboardData } from "@/services/metrics-service";
import { unreadForShop } from "@/services/shop-chat-service";

/** GET — the app's home screen: the same numbers as the web dashboard. */
export const GET = mobileRoute(async (request) => {
  const { business, businessId } = await requireMobileBusiness(request);

  const [data, website, unreadMessages] = await Promise.all([
    getDashboardData(businessId),
    Website.findOne({ businessId }).select("status").lean(),
    unreadForShop(businessId),
  ]);

  return NextResponse.json({
    business: { id: businessId, name: business.name, plan: business.plan ?? "free" },
    today: data.today,
    yesterday: data.yesterday,
    month: data.month,
    lastMonth: data.lastMonth,
    series: data.series,
    topProducts: data.top.map((row) => ({
      id: String(row._id),
      name: row.name,
      image: row.image ?? null,
      quantity: row.quantity,
      revenue: row.revenue,
    })),
    lowStock: data.lowStock.map((product) => ({
      id: String(product._id),
      name: product.name,
      image: product.images?.[0] ?? null,
      stock: product.stock ?? 0,
      threshold: product.lowStockThreshold ?? 0,
    })),
    web: data.web,
    websitePublished: website?.status === "published",
    recentOrders: data.recentOrders.map(toOrderSummary),
    customerCount: data.customerCount,
    unreadMessages,
    chatEnabled: hasAddon(business, "whatsapp_chat"),
  });
});

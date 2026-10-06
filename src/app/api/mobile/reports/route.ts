import { NextResponse } from "next/server";
import { mobileRoute, requireMobileBusiness } from "@/lib/mobile/auth";
import { getReportData } from "@/services/metrics-service";

const RANGES = { "7": 7, "30": 30, "90": 90, "365": 365 } as const;

/** GET ?range=7|30|90|365 — the reports screen, from the same loader as the web. */
export const GET = mobileRoute(async (request) => {
  const { businessId } = await requireMobileBusiness(request);
  const range = new URL(request.url).searchParams.get("range") ?? "30";
  const days = RANGES[range as keyof typeof RANGES] ?? 30;

  const report = await getReportData(businessId, days);

  return NextResponse.json({
    days,
    ...report,
    top: report.top.map((row) => ({
      id: String(row._id),
      name: row.name,
      image: row.image ?? null,
      quantity: row.quantity,
      revenue: row.revenue,
    })),
    expenseSplit: report.expenseSplit.map((row) => ({ category: row._id, total: row.total })),
  });
});

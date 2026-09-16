import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { Eye, MousePointerClick, ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Order } from "@/models/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBarChart, DonutChart } from "@/components/charts/revenue-chart";
import { UpgradeNotice } from "@/components/dashboard/upgrade-notice";
import { getPlan } from "@/lib/plans";
import { daysAgo, websiteMetrics, REVENUE_STATUSES } from "@/services/metrics-service";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Website analytics" };

export default async function WebsiteAnalyticsPage() {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).select("_id").lean();
  if (!website) redirect("/website");

  const plan = getPlan(business.plan);
  const from = daysAgo(30);
  const oid = new Types.ObjectId(businessId);

  const [metrics, topPages, topProducts, devices, revenue] = await Promise.all([
    websiteMetrics(businessId, from),
    AnalyticsEvent.aggregate<{ _id: string; views: number }>([
      { $match: { businessId: oid, type: "page_view", createdAt: { $gte: from } } },
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 8 },
    ]),
    AnalyticsEvent.aggregate<{ _id: string; name: string; views: number; carts: number }>([
      { $match: { businessId: oid, type: { $in: ["product_view", "add_to_cart"] }, createdAt: { $gte: from } } },
      {
        $group: {
          _id: "$productId",
          name: { $first: "$productName" },
          views: { $sum: { $cond: [{ $eq: ["$type", "product_view"] }, 1, 0] } },
          carts: { $sum: { $cond: [{ $eq: ["$type", "add_to_cart"] }, 1, 0] } },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 8 },
    ]),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: { businessId: oid, type: "page_view", createdAt: { $gte: from } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ total: number }>([
      {
        $match: {
          businessId: oid,
          source: "website",
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: from },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  const websiteRevenue = revenue[0]?.total ?? 0;
  const hasData = metrics.pageViews > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website analytics"
        description="What visitors do on your website, over the last 30 days."
      />

      {!plan.limits.analytics && (
        <UpgradeNotice
          title="Analytics are a Starter feature"
          description="Upgrade to see traffic, product interest and conversion for your website."
        />
      )}

      {!hasData ? (
        <EmptyState
          icon={Eye}
          title="No visits recorded yet"
          description="Once your website is published and people start visiting, their page views, product interest and orders show up here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Visitors" value={formatNumber(metrics.visitors)} icon={Users} tone="primary" />
            <StatCard label="Page views" value={formatNumber(metrics.pageViews)} icon={Eye} />
            <StatCard
              label="Product views"
              value={formatNumber(metrics.productViews)}
              icon={MousePointerClick}
            />
            <StatCard label="Added to cart" value={formatNumber(metrics.addToCart)} icon={ShoppingCart} />
            <StatCard
              label="Website orders"
              value={formatNumber(metrics.orders)}
              icon={ShoppingBag}
              href="/orders?source=website"
            />
            <StatCard
              label="Website revenue"
              value={formatCurrency(websiteRevenue, { decimals: false })}
              icon={TrendingUp}
              tone="primary"
            />
          </div>

          {/* The funnel, in plain language */}
          <Card>
            <CardHeader>
              <CardTitle>From visit to order</CardTitle>
              <p className="text-[12.5px] text-muted-foreground">
                Where people drop off — the biggest gap is usually the best thing to fix.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <FunnelBar
                steps={[
                  { label: "Visited", value: metrics.visitors },
                  { label: "Viewed a product", value: metrics.productViews },
                  { label: "Added to cart", value: metrics.addToCart },
                  { label: "Started checkout", value: metrics.checkouts },
                  { label: "Ordered", value: metrics.orders },
                ]}
              />
              <p className="mt-4 text-[13px] text-muted-foreground">
                Conversion rate:{" "}
                <span className="font-semibold text-foreground">{metrics.conversionRate.toFixed(1)}%</span> of visitors
                placed an order.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top pages</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CategoryBarChart
                  money={false}
                  data={topPages.map((row) => ({ label: row._id === "/" ? "Home" : row._id.replace(/^\//, ""), value: row.views }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DonutChart money={false} data={devices.map((row) => ({ label: row._id ?? "unknown", value: row.count }))} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most viewed products</CardTitle>
              <p className="text-[12.5px] text-muted-foreground">
                A product with lots of views but few carts usually needs better photos or a clearer price.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="divide-y divide-border">
                {topProducts.map((row) => (
                  <li key={String(row._id)} className="flex items-center gap-4 py-2.5">
                    <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{row.name ?? "Unknown product"}</p>
                    <p className="w-20 shrink-0 text-right text-[13px] tabular-nums text-muted-foreground">
                      {row.views} views
                    </p>
                    <p className="w-20 shrink-0 text-right text-[13px] tabular-nums text-muted-foreground">
                      {row.carts} carts
                    </p>
                    <p className="w-14 shrink-0 text-right text-[13px] font-medium tabular-nums">
                      {row.views ? Math.round((row.carts / row.views) * 100) : 0}%
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function FunnelBar({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => {
        const width = (step.value / max) * 100;
        const previous = index > 0 ? steps[index - 1].value : null;
        const drop = previous && previous > 0 ? Math.round((1 - step.value / previous) * 100) : null;
        return (
          <li key={step.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-[13px] text-muted-foreground">{step.label}</span>
            <span className="h-7 min-w-0 flex-1 overflow-hidden rounded-md bg-muted">
              <span
                className="flex h-full items-center rounded-md bg-primary px-2.5 text-[12px] font-semibold text-primary-foreground transition-all duration-500"
                style={{ width: `${Math.max(width, 6)}%` }}
              >
                {step.value.toLocaleString()}
              </span>
            </span>
            <span className="w-16 shrink-0 text-right text-[12px] text-muted-foreground">
              {drop !== null && drop > 0 ? `−${drop}%` : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

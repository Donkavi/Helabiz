import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Eye,
  Globe,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { Product } from "@/models/Product";
import { getDashboardData } from "@/services/metrics-service";
import { formatCurrency, formatNumber, percentChange, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { RevenueChart, ProfitChart } from "@/components/charts/revenue-chart";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { getLang } from "@/lib/i18n/server";
import { dashboardCopy, fill } from "@/lib/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: dashboardCopy(await getLang()).home.metaTitle };
}

export default async function DashboardPage() {
  const { business, businessId } = await requireBusiness();
  const c = dashboardCopy(await getLang());
  const t = c.home;
  const data = await getDashboardData(businessId);

  const [website, productCount] = await Promise.all([
    Website.findOne({ businessId }).select("status subdomain").lean(),
    Product.countDocuments({ businessId, status: { $ne: "archived" } }),
  ]);

  const recentOrders = serialize(data.recentOrders);
  const lowStock = serialize(data.lowStock);
  const hasActivity = productCount > 0 || recentOrders.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title={fill(t.greeting, { name: business.name })}
        description={t.subtitle}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/products/new">
                <Plus className="size-4" />
                {t.addProduct}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/orders/new">
                <ShoppingCart className="size-4" />
                {t.newOrder}
              </Link>
            </Button>
          </>
        }
      />

      {!hasActivity && (
        <SetupChecklist
          hasProducts={productCount > 0}
          hasWebsite={Boolean(website)}
          isPublished={website?.status === "published"}
          hasOrders={recentOrders.length > 0}
        />
      )}

      {/* Today */}
      <section aria-labelledby="today-heading" className="space-y-3">
        <h2 id="today-heading" className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t.today}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t.todaysSales}
            value={formatCurrency(data.today.revenue, { decimals: false })}
            change={percentChange(data.today.revenue, data.yesterday.revenue)}
            sublabel={t.vsYesterday}
            icon={TrendingUp}
            tone="primary"
            href="/reports"
          />
          <StatCard
            label={t.orders}
            value={formatNumber(data.today.orders)}
            change={percentChange(data.today.orders, data.yesterday.orders)}
            sublabel={t.vsYesterday}
            icon={ShoppingCart}
            href="/orders"
          />
          <StatCard
            label={t.expenses}
            value={formatCurrency(data.today.expenses, { decimals: false })}
            change={percentChange(data.today.expenses, data.yesterday.expenses)}
            sublabel={t.vsYesterday}
            icon={Wallet}
            invertChange
            href="/expenses"
          />
          <StatCard
            label={t.profit}
            value={formatCurrency(data.today.profit, { decimals: false })}
            change={percentChange(data.today.profit, data.yesterday.profit)}
            sublabel={t.afterCostAndExpenses}
            icon={BarChart3}
            href="/reports"
          />
        </div>
      </section>

      {/* Website */}
      <section aria-labelledby="website-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="website-heading" className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.websiteLast30}
          </h2>
          <Link href="/website/analytics" className="text-[13px] font-medium text-primary hover:underline">
            {t.viewAnalytics}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.visitors} value={formatNumber(data.web.visitors)} icon={Eye} sublabel={fill(t.pageViews, { count: formatNumber(data.web.pageViews) })} />
          <StatCard label={t.websiteOrders} value={formatNumber(data.web.orders)} icon={Globe} tone="primary" href="/orders?source=website" />
          <StatCard label={t.conversionRate} value={`${data.web.conversionRate.toFixed(1)}%`} sublabel={t.visitorsWhoOrdered} icon={TrendingUp} />
          <StatCard
            label={t.lowStock}
            value={formatNumber(lowStock.length)}
            sublabel={lowStock.length ? t.itemsNeedRestocking : t.everythingInStock}
            icon={AlertTriangle}
            tone={lowStock.length ? "warning" : "default"}
            href="/inventory"
          />
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center">
            <div>
              <CardTitle>{t.sales}</CardTitle>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t.last30Days}</p>
            </div>
            <CardAction>
              <Badge variant="soft">{formatCurrency(data.month.revenue, { compact: true, decimals: false })} {t.thisMonth}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-1">
            <RevenueChart data={data.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <div>
              <CardTitle>{t.profitAndExpenses}</CardTitle>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t.last30Days}</p>
            </div>
            <CardAction>
              <Badge variant={data.month.profit >= 0 ? "success" : "destructive"}>
                {formatCurrency(data.month.profit, { compact: true, decimals: false })} {t.profitSuffix}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-1">
            <ProfitChart data={data.series} />
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle>{t.recentOrders}</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">
                  {c.common.viewAll}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <EmptyState
                compact
                icon={ShoppingCart}
                title={t.noOrdersTitle}
                description={t.noOrdersBody}
                action={
                  <Button size="sm" asChild>
                    <Link href="/orders/new">{t.recordAnOrder}</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <li key={String(order._id)}>
                    <Link
                      href={`/orders/${order._id}`}
                      className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13.5px] font-medium">
                          <span className="font-mono">{order.orderNumber}</span>
                          {order.source === "website" && (
                            <Badge variant="soft" className="text-[10px]">
                              Website
                            </Badge>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                          {order.customer?.name || t.walkInCustomer} · {relativeTime(order.createdAt as unknown as string)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                      <p className="w-24 shrink-0 text-right text-[13.5px] font-semibold tabular-nums">
                        {formatCurrency(order.total, { decimals: false })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.topProducts}</CardTitle>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Last 30 days by revenue</p>
            </CardHeader>
            <CardContent className="pt-0">
              {data.top.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-foreground">No sales in the last 30 days.</p>
              ) : (
                <ul className="space-y-3">
                  {data.top.map((product, i) => (
                    <li key={String(product._id)} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{product.name}</p>
                        <p className="text-[12px] text-muted-foreground">{product.quantity} {t.sold}</p>
                      </div>
                      <p className="shrink-0 text-[13.5px] font-semibold tabular-nums">
                        {formatCurrency(product.revenue, { decimals: false })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center">
              <CardTitle>{t.lowStock}</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/inventory">
                    Manage
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="pt-0">
              {lowStock.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-foreground">{t.everythingWellStocked}</p>
              ) : (
                <ul className="space-y-2.5">
                  {lowStock.map((product) => (
                    <li key={String(product._id)} className="flex items-center gap-3">
                      <Package className="size-3.5 shrink-0 text-muted-foreground" />
                      <p className="min-w-0 flex-1 truncate text-[13.5px]">{product.name}</p>
                      <Badge variant={product.stock <= 0 ? "destructive" : "warning"}>
                        {product.stock <= 0 ? t.outOfStock : fill(t.left, { count: product.stock })}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

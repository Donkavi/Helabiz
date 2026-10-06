import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronRight,
  Eye,
  Globe,
  MessagesSquare,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "@/components/icons";
import { BusinessSwitcher } from "@/components/business-switcher";
import { ChartLegend, TrendChart } from "@/components/charts";
import { OrderRow } from "@/components/order-row";
import { ErrorState, Page, PageHeader } from "@/components/page";
import { Badge, Card, CardBody, CardHeader, EmptyState, Skeleton, SectionHeading, TextLink, Thumb } from "@/components/primitives";
import { StatCard, StatGrid } from "@/components/stat-card";
import { Text } from "@/components/text";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, percentChange } from "@/lib/format";
import { useSession } from "@/lib/session";
import { radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import type { Dashboard } from "@/lib/types";

export default function DashboardScreen() {
  const { business } = useSession();
  const { colors: c } = useTheme();
  const query = useQuery({
    queryKey: ["dashboard", business?.id],
    queryFn: () => api<Dashboard>("/api/mobile/dashboard"),
    enabled: Boolean(business),
  });
  const d = query.data;

  return (
    <Page refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <BusinessSwitcher />
        <Pressable
          onPress={() => router.navigate("/(tabs)/messages")}
          accessibilityLabel={d?.unreadMessages ? `${d.unreadMessages} unread messages` : "Messages"}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: pressed ? c.muted : c.card,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Bell size={18} color={c.foreground} strokeWidth={1.9} />
          {d && d.unreadMessages > 0 && (
            <View
              style={{
                position: "absolute",
                top: 9,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: c.destructive,
                borderWidth: 1.5,
                borderColor: c.card,
              }}
            />
          )}
        </Pressable>
      </View>

      <PageHeader title={`Good day, ${business?.name ?? ""}`} description="Here is how your business is doing today." />

      {!d && query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !d ? (
        <DashboardSkeleton />
      ) : (
        <>
          {d.unreadMessages > 0 && (
            <Pressable
              onPress={() => router.navigate("/(tabs)/messages")}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: radius.xl,
                backgroundColor: c.primaryMuted,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <MessagesSquare size={18} color={c.primary} />
              <Text size={14} weight="medium" tone="primary" style={{ flex: 1 }}>
                {d.unreadMessages} unread customer {d.unreadMessages === 1 ? "message" : "messages"}
              </Text>
              <ChevronRight size={16} color={c.primary} />
            </Pressable>
          )}

          <SectionHeading title="Today" />
          <StatGrid>
            <StatCard
              label="Today's sales"
              value={formatCurrency(d.today.revenue)}
              change={percentChange(d.today.revenue, d.yesterday.revenue)}
              sublabel="vs yesterday"
              icon={TrendingUp}
              tone="primary"
              onPress={() => router.navigate("/(tabs)/analytics")}
            />
            <StatCard
              label="Orders"
              value={formatNumber(d.today.orders)}
              change={percentChange(d.today.orders, d.yesterday.orders)}
              sublabel="vs yesterday"
              icon={ShoppingCart}
              onPress={() => router.navigate("/(tabs)/orders")}
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(d.today.expenses)}
              change={percentChange(d.today.expenses, d.yesterday.expenses)}
              sublabel="vs yesterday"
              icon={Wallet}
              invertChange
            />
            <StatCard
              label="Profit"
              value={formatCurrency(d.today.profit)}
              change={percentChange(d.today.profit, d.yesterday.profit)}
              sublabel="after cost & expenses"
              icon={BarChart3}
              onPress={() => router.navigate("/(tabs)/analytics")}
            />
          </StatGrid>

          <SectionHeading
            title="Website · last 30 days"
            action={<TextLink label="View analytics" onPress={() => router.navigate("/(tabs)/analytics")} />}
          />
          {d.websitePublished ? (
            <StatGrid>
              <StatCard
                label="Visitors"
                value={formatNumber(d.web.visitors)}
                sublabel={`${formatNumber(d.web.pageViews)} page views`}
                icon={Eye}
              />
              <StatCard label="Website orders" value={formatNumber(d.web.orders)} icon={Globe} tone="primary" />
              <StatCard
                label="Conversion rate"
                value={`${d.web.conversionRate.toFixed(1)}%`}
                sublabel="visitors who ordered"
                icon={TrendingUp}
              />
              <StatCard
                label="Low stock"
                value={formatNumber(d.lowStock.length)}
                sublabel={d.lowStock.length ? "items need restocking" : "everything in stock"}
                icon={AlertTriangle}
                tone={d.lowStock.length ? "warning" : "default"}
              />
            </StatGrid>
          ) : (
            <EmptyState
              icon={Globe}
              title="Your website is not live yet"
              description="Publish it from the Helabiz website to start taking orders online. They will ring on this phone."
            />
          )}

          <Card>
            <CardHeader
              title="Sales"
              description="Last 30 days"
              action={<Badge label={`${formatCurrency(d.month.revenue, { compact: true })} this month`} variant="soft" />}
            />
            <CardBody>
              <TrendChart
                labels={d.series.map((p) => p.label)}
                series={[{ name: "Sales", values: d.series.map((p) => p.revenue), color: c.primary, fill: true }]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Profit & expenses"
              description="Last 30 days"
              action={
                <Badge
                  label={`${formatCurrency(d.month.profit, { compact: true })} profit`}
                  variant={d.month.profit >= 0 ? "success" : "destructive"}
                />
              }
            />
            <CardBody>
              <TrendChart
                labels={d.series.map((p) => p.label)}
                series={[
                  { name: "Profit", values: d.series.map((p) => p.profit), color: c.primary },
                  { name: "Expenses", values: d.series.map((p) => p.expenses), color: c.gold },
                ]}
              />
              <ChartLegend items={[{ label: "Profit", color: c.primary }, { label: "Expenses", color: c.gold }]} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent orders" action={<TextLink label="View all" onPress={() => router.navigate("/(tabs)/orders")} />} />
            {d.recentOrders.length === 0 ? (
              <CardBody>
                <EmptyState
                  bare
                  icon={ShoppingCart}
                  title="No orders yet"
                  description="Orders from your website and the ones you add by hand both land here."
                />
              </CardBody>
            ) : (
              <View style={{ paddingBottom: 6 }}>
                {d.recentOrders.map((order, i) => (
                  <OrderRow key={order.id} order={order} last={i === d.recentOrders.length - 1} />
                ))}
              </View>
            )}
          </Card>

          <Card>
            <CardHeader title="Top products" description="Last 30 days by revenue" />
            <CardBody style={{ gap: 14 }}>
              {d.topProducts.length === 0 ? (
                <Text size={13} tone="muted" center style={{ paddingVertical: 14 }}>
                  No sales in the last 30 days.
                </Text>
              ) : (
                d.topProducts.map((product, i) => (
                  <View key={product.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: radius.md,
                        backgroundColor: c.muted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text size={11} weight="semibold" tone="muted">
                        {i + 1}
                      </Text>
                    </View>
                    <Thumb src={product.image} size={36} fallback={Package} />
                    <View style={{ flex: 1 }}>
                      <Text size={13.5} weight="medium" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text size={12} tone="muted">
                        {product.quantity} sold
                      </Text>
                    </View>
                    <Text size={13.5} weight="semibold" tabular>
                      {formatCurrency(product.revenue)}
                    </Text>
                  </View>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Low stock" />
            <CardBody style={{ gap: 11 }}>
              {d.lowStock.length === 0 ? (
                <Text size={13} tone="muted" center style={{ paddingVertical: 14 }}>
                  Everything is well stocked.
                </Text>
              ) : (
                d.lowStock.map((product) => (
                  <View key={product.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Package size={15} color={c.mutedForeground} />
                    <Text size={13.5} style={{ flex: 1 }} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Badge
                      label={product.stock <= 0 ? "Out of stock" : `${product.stock} left`}
                      variant={product.stock <= 0 ? "destructive" : "warning"}
                    />
                  </View>
                ))
              )}
            </CardBody>
          </Card>
        </>
      )}
    </Page>
  );
}

function DashboardSkeleton() {
  return (
    <View style={{ gap: 18 }}>
      <Skeleton width={70} height={12} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} style={{ flexGrow: 1, flexBasis: "46%", padding: 16, gap: 12 }}>
            <Skeleton width={80} height={11} />
            <Skeleton width={110} height={22} />
            <Skeleton width={70} height={11} />
          </Card>
        ))}
      </View>
      <Card style={{ padding: 18, gap: 14 }}>
        <Skeleton width={90} height={14} />
        <Skeleton height={170} />
      </Card>
      <Card style={{ padding: 18, gap: 14 }}>
        <Skeleton width={120} height={14} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={34} />
        ))}
      </Card>
    </View>
  );
}

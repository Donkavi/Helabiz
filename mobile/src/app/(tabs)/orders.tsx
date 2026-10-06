import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, X } from "@/components/icons";
import { Input } from "@/components/input";
import { OrderRow } from "@/components/order-row";
import { ErrorState, PageHeader } from "@/components/page";
import { Card, EmptyState, Skeleton } from "@/components/primitives";
import { ORDER_STATUSES } from "@/components/status";
import { Text } from "@/components/text";
import { api } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import type { OrderStatus, OrderSummary } from "@/lib/types";

type Page = { orders: OrderSummary[]; hasMore: boolean };
type Filter = OrderStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [{ value: "all", label: "All orders" }, ...ORDER_STATUSES];

export default function OrdersScreen() {
  const { business } = useSession();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  // Search once typing pauses, not on every key.
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ["orders", business?.id, status, q],
    enabled: Boolean(business),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (q) params.set("q", q);
      if (pageParam) params.set("before", pageParam);
      return api<Page>(`/api/mobile/orders?${params.toString()}`);
    },
    getNextPageParam: (last) => (last.hasMore ? (last.orders[last.orders.length - 1]?.createdAt ?? null) : null),
  });

  const orders = query.data?.pages.flatMap((page) => page.orders) ?? [];
  const filtered = Boolean(q) || status !== "all";

  const header = (
    <View style={{ gap: 16, paddingTop: insets.top + 14, paddingBottom: 14 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <PageHeader title="Orders" description="Website, WhatsApp and walk-in orders — all in one list." />
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by order, customer or phone"
          returnKeyType="search"
          autoCorrect={false}
          leading={<Search size={16} color={c.mutedForeground} />}
          trailing={
            search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8} style={{ paddingHorizontal: 12 }} accessibilityLabel="Clear search">
                <X size={16} color={c.mutedForeground} />
              </Pressable>
            ) : null
          }
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map((option) => {
          const active = option.value === status;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                haptics.select();
                setStatus(option.value);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: active ? c.foreground : c.border,
                backgroundColor: active ? c.foreground : pressed ? c.muted : c.card,
                paddingHorizontal: 13,
                paddingVertical: 7,
              })}
            >
              <Text size={13} weight="medium" color={active ? c.background : c.foreground}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={query.isSuccess ? orders : []}
        keyExtractor={(order) => order.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => query.refetch()}
            tintColor={c.primary}
            colors={[c.primary]}
            progressBackgroundColor={c.card}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        renderItem={({ item, index }) => (
          <View style={{ marginHorizontal: 16 }}>
            <View
              style={{
                backgroundColor: c.card,
                borderColor: c.border,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderTopWidth: index === 0 ? 1 : 0,
                borderBottomWidth: index === orders.length - 1 ? 1 : 0,
                borderTopLeftRadius: index === 0 ? radius.xl : 0,
                borderTopRightRadius: index === 0 ? radius.xl : 0,
                borderBottomLeftRadius: index === orders.length - 1 ? radius.xl : 0,
                borderBottomRightRadius: index === orders.length - 1 ? radius.xl : 0,
                overflow: "hidden",
              }}
            >
              <OrderRow order={item} last={index === orders.length - 1} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16 }}>
            {query.isError ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            ) : !query.isSuccess ? (
              <Card style={{ paddingVertical: 6 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingVertical: 14 }}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width={90} height={13} />
                      <Skeleton width={150} height={11} />
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                      <Skeleton width={70} height={13} />
                      <Skeleton width={60} height={18} />
                    </View>
                  </View>
                ))}
              </Card>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title={filtered ? "No matching orders" : "No orders yet"}
                description={
                  filtered
                    ? "Try another search or status."
                    : "Orders from your website and the ones you add by hand both land here."
                }
              />
            )}
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator color={c.primary} style={{ marginTop: 18 }} /> : null
        }
      />
    </View>
  );
}

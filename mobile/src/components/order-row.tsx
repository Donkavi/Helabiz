import { View } from "react-native";
import { router } from "expo-router";
import { formatCurrency, relativeTime } from "@/lib/format";
import { mono } from "@/lib/theme";
import type { OrderSummary } from "@/lib/types";
import { Badge, ListRow } from "./primitives";
import { OrderStatusBadge } from "./status";
import { Text } from "./text";

/**
 * One order, laid out like the web dashboard's recent-orders list: the
 * number in mono with a Website tag, then customer and age, status, total.
 */
export function OrderRow({ order, last }: { order: OrderSummary; last?: boolean }) {
  return (
    <ListRow onPress={() => router.push(`/orders/${order.id}`)} last={last}>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text size={13.5} weight="medium" style={{ fontFamily: mono }}>
            {order.orderNumber}
          </Text>
          {order.source === "website" && <Badge label="Website" variant="soft" small />}
        </View>
        <Text size={12.5} tone="muted" numberOfLines={1}>
          {order.customerName || "Walk-in customer"} · {relativeTime(order.createdAt)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <Text size={13.5} weight="semibold" tabular>
          {formatCurrency(order.total)}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>
    </ListRow>
  );
}

import { useState } from "react";
import { Alert, Linking, Pressable, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  ImageOff,
  MapPin,
  MessageCircle,
  Phone,
  StickyNote,
} from "@/components/icons";
import { ErrorState, Page } from "@/components/page";
import { Badge, Button, Card, CardBody, CardHeader, Divider, Skeleton, Thumb } from "@/components/primitives";
import { Sheet, SheetOption } from "@/components/sheet";
import { ORDER_STATUSES, OrderStatusBadge, PaymentBadge, orderStatusLabel, orderStatusVariant } from "@/components/status";
import { Text } from "@/components/text";
import { api } from "@/lib/api";
import { ORDER_SOURCES, PAYMENT_METHODS, formatCurrency, formatDate, titleCase, whatsappNumber } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { mono, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import type { OrderDetail, OrderStatus, PaymentStatus } from "@/lib/types";

/** The usual next step, offered as the one big button. */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "packed",
  packed: "shipped",
  shipped: "delivered",
};

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partially paid" },
  { value: "refunded", label: "Refunded" },
];

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { business } = useSession();
  const { colors: c } = useTheme();
  const queryClient = useQueryClient();
  const [sheet, setSheet] = useState<"status" | "payment" | null>(null);
  const key = ["order", business?.id, id];

  const query = useQuery({
    queryKey: key,
    queryFn: () => api<{ order: OrderDetail }>(`/api/mobile/orders/${id}`).then((r) => r.order),
    enabled: Boolean(business && id),
  });

  const update = useMutation({
    mutationFn: (body: { status?: OrderStatus; paymentStatus?: PaymentStatus }) =>
      api<{ order: OrderDetail }>(`/api/mobile/orders/${id}`, { method: "PATCH", body }).then((r) => r.order),
    onSuccess: (order) => {
      haptics.success();
      queryClient.setQueryData(key, order);
      // Totals, stock and lists all move with a status change.
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["report"] });
    },
    onError: (error) => {
      haptics.error();
      Alert.alert("Could not update the order", error.message);
    },
  });

  const order = query.data;

  function changeStatus(status: OrderStatus) {
    if (!order) return;
    const label = orderStatusLabel(status).toLowerCase();
    const releasesStock = status === "cancelled" || status === "returned";
    Alert.alert(
      `Mark as ${label}?`,
      `${order.orderNumber} will move to ${label}.${releasesStock ? " Its stock goes back on the shelf." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: `Mark ${label}`, style: releasesStock ? "destructive" : "default", onPress: () => update.mutate({ status }) },
      ],
    );
  }

  if (!order) {
    return (
      <Page topInset={false}>
        <Stack.Screen options={{ title: "Order" }} />
        {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : <OrderSkeleton />}
      </Page>
    );
  }

  const next = NEXT[order.status];
  const phone = order.customer.phone;
  const address = [order.customer.address, order.customer.city, order.customer.district].filter(Boolean).join(", ");

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <Page topInset={false} refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
        {/* Header, as the web order page: number in mono, badges, when it was placed. */}
        <View style={{ gap: 10 }}>
          <Text size={24} weight="semibold" tracking={-0.02} style={{ fontFamily: mono }}>
            {order.orderNumber}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
            <Badge label={ORDER_SOURCES[order.source] ?? titleCase(order.source)} variant={order.source === "website" ? "soft" : "muted"} />
          </View>
          <Text size={13} tone="muted">
            Placed {formatDate(order.createdAt, true)}
          </Text>
        </View>

        <Card>
          <CardBody style={{ paddingTop: 18, gap: 10 }}>
            {next && (
              <Button
                label={`Mark as ${orderStatusLabel(next).toLowerCase()}`}
                icon={ArrowRight}
                size="lg"
                onPress={() => changeStatus(next)}
                loading={update.isPending && update.variables?.status === next}
                disabled={update.isPending}
              />
            )}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                label="Status"
                variant="outline"
                icon={ChevronDown}
                onPress={() => setSheet("status")}
                disabled={update.isPending}
                style={{ flex: 1 }}
              />
              <Button
                label="Payment"
                variant="outline"
                icon={CreditCard}
                onPress={() => setSheet("payment")}
                loading={update.isPending && Boolean(update.variables?.paymentStatus)}
                disabled={update.isPending}
                style={{ flex: 1 }}
              />
            </View>
            {order.whatsappUrl && (
              <Button
                label="Send via WhatsApp"
                variant="soft"
                icon={MessageCircle}
                onPress={() => Linking.openURL(order.whatsappUrl!)}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Items" />
          <CardBody>
            {order.items.map((item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={[
                  { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
                  index > 0 && { borderTopWidth: 1, borderTopColor: c.border },
                ]}
              >
                <Thumb src={item.image} size={44} fallback={ImageOff} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text size={13.5} weight="medium" numberOfLines={2}>
                    {item.name}
                    {item.variantName ? <Text size={13.5} tone="muted">{` · ${item.variantName}`}</Text> : null}
                  </Text>
                  <Text size={12.5} tone="muted" tabular>
                    {formatCurrency(item.price)} × {item.quantity}
                  </Text>
                </View>
                <Text size={13.5} weight="semibold" tabular>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}

            <View style={{ marginTop: 8, marginBottom: 14 }}>
              <Divider />
            </View>
            <View style={{ gap: 9 }}>
              <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              {order.discount > 0 && <SummaryRow label="Discount" value={`− ${formatCurrency(order.discount)}`} />}
              {order.deliveryFee > 0 && <SummaryRow label="Delivery" value={formatCurrency(order.deliveryFee)} />}
              <Divider />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text size={16} weight="semibold">
                  Total
                </Text>
                <Text size={16} weight="semibold" tabular>
                  {formatCurrency(order.total)}
                </Text>
              </View>
              {order.estimatedProfit !== null && (
                <Text size={12.5} tone="muted">
                  Estimated profit on this order:{" "}
                  <Text size={12.5} weight="medium">
                    {formatCurrency(order.estimatedProfit)}
                  </Text>
                </Text>
              )}
            </View>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Customer" />
          <CardBody style={{ gap: 11 }}>
            <Text size={14} weight="medium">
              {order.customer.name || "Walk-in customer"}
            </Text>
            {phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Phone size={14} color={c.mutedForeground} />
                <Text size={13.5} tone="muted">
                  {phone}
                </Text>
              </Pressable>
            ) : null}
            {address ? (
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <MapPin size={14} color={c.mutedForeground} style={{ marginTop: 2 }} />
                <Text size={13.5} tone="muted" style={{ flex: 1 }}>
                  {address}
                </Text>
              </View>
            ) : null}
            {phone ? (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Button label="Call" variant="outline" size="sm" icon={Phone} onPress={() => Linking.openURL(`tel:${phone}`)} style={{ flex: 1 }} />
                <Button
                  label="WhatsApp"
                  variant="outline"
                  size="sm"
                  icon={MessageCircle}
                  onPress={() => Linking.openURL(`https://wa.me/${whatsappNumber(phone)}`)}
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment" />
          <CardBody style={{ gap: 10 }}>
            <SummaryRow label="Method" value={PAYMENT_METHODS[order.paymentMethod] ?? titleCase(order.paymentMethod)} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text size={13.5} tone="muted">
                Status
              </Text>
              <PaymentBadge status={order.paymentStatus} />
            </View>
            {order.trackingNumber ? <SummaryRow label="Tracking" value={order.trackingNumber} /> : null}
          </CardBody>
        </Card>

        {order.notes ? (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 }}>
              <StickyNote size={15} color={c.mutedForeground} />
              <Text size={15} weight="semibold">
                Notes
              </Text>
            </View>
            <CardBody>
              <Text size={13.5} tone="muted" style={{ lineHeight: 21 }}>
                {order.notes}
              </Text>
            </CardBody>
          </Card>
        ) : null}

        {order.timeline.length > 0 && (
          <Card>
            <CardHeader title="History" />
            <CardBody>
              {order.timeline.map((entry, index) => (
                <View key={index} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ alignItems: "center", width: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, marginTop: 5 }} />
                    {index < order.timeline.length - 1 && <View style={{ width: 1, flex: 1, backgroundColor: c.border, marginVertical: 4 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: index < order.timeline.length - 1 ? 16 : 0 }}>
                    <Text size={13.5} weight="medium">
                      {titleCase(entry.status)}
                    </Text>
                    {entry.note ? (
                      <Text size={12.5} tone="muted">
                        {entry.note}
                      </Text>
                    ) : null}
                    <Text size={12} tone="muted" style={{ marginTop: 2 }}>
                      {formatDate(entry.at, true)}
                    </Text>
                  </View>
                </View>
              ))}
            </CardBody>
          </Card>
        )}
      </Page>

      <Sheet open={sheet === "status"} onClose={() => setSheet(null)} title="Change status" description={`Where ${order.orderNumber} is now.`}>
        {ORDER_STATUSES.map((option) => {
          const current = option.value === order.status;
          return (
            <SheetOption
              key={option.value}
              label={option.label}
              leading={<StatusDot variant={orderStatusVariant(option.value)} />}
              trailing={current ? <Check size={18} color={c.primary} strokeWidth={2.5} /> : null}
              destructive={option.value === "cancelled"}
              onPress={() => {
                setSheet(null);
                if (!current) changeStatus(option.value);
              }}
            />
          );
        })}
      </Sheet>

      <Sheet open={sheet === "payment"} onClose={() => setSheet(null)} title="Payment status">
        {PAYMENT_OPTIONS.map((option) => {
          const current = option.value === order.paymentStatus;
          return (
            <SheetOption
              key={option.value}
              label={option.label}
              trailing={current ? <Check size={18} color={c.primary} strokeWidth={2.5} /> : null}
              onPress={() => {
                setSheet(null);
                if (!current) update.mutate({ paymentStatus: option.value });
              }}
            />
          );
        })}
      </Sheet>
    </>
  );
}

function StatusDot({ variant }: { variant: string }) {
  const { colors: c } = useTheme();
  const color =
    { warning: c.warning, info: c.info, success: c.success, destructive: c.destructive, muted: c.mutedForeground }[variant] ?? c.primary;
  return (
    <View style={{ width: 28, height: 28, borderRadius: radius.md, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text size={13.5} tone="muted">
        {label}
      </Text>
      <Text size={13.5} weight="medium" tabular style={{ flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

function OrderSkeleton() {
  return (
    <View style={{ gap: 18 }}>
      <Skeleton width={140} height={24} />
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Skeleton width={70} height={20} />
        <Skeleton width={60} height={20} />
      </View>
      <Card style={{ padding: 18, gap: 10 }}>
        <Skeleton height={46} />
        <Skeleton height={40} />
      </Card>
      <Card style={{ padding: 18, gap: 14 }}>
        <Skeleton width={60} height={14} />
        {[0, 1].map((i) => (
          <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Skeleton width={44} height={44} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width={150} height={13} />
              <Skeleton width={90} height={11} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

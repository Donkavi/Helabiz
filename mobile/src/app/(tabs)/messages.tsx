import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare, Puzzle } from "@/components/icons";
import { ErrorState, PageHeader } from "@/components/page";
import { Avatar, Card, EmptyState, ListRow, Skeleton } from "@/components/primitives";
import { Text } from "@/components/text";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { alpha, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import type { ChatThread } from "@/lib/types";

export default function MessagesScreen() {
  const { business } = useSession();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: ["threads", business?.id],
    queryFn: () => api<{ threads: ChatThread[]; canReply: boolean }>("/api/mobile/messages"),
    enabled: Boolean(business),
    refetchInterval: 30_000,
  });
  const threads = query.data?.threads ?? [];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.background }}
      data={threads}
      keyExtractor={(thread) => thread.customer.id}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={c.primary}
          colors={[c.primary]}
          progressBackgroundColor={c.card}
        />
      }
      ListHeaderComponent={
        <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
          <PageHeader
            title="Messages"
            description="Chats from customers signed in on your website, with who they are and what they have bought."
          />
          {query.data && !query.data.canReply && (
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 14,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: alpha(c.warning, 0.3),
                backgroundColor: alpha(c.warning, 0.1),
              }}
            >
              <Puzzle size={18} color={c.warning} style={{ marginTop: 1 }} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text size={13.5} weight="semibold">
                  Chat with customers is off
                </Text>
                <Text size={13} tone="muted">
                  Turn on the add-on from Billing on the Helabiz website to reply here. Earlier conversations stay readable.
                </Text>
              </View>
            </View>
          )}
        </View>
      }
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === threads.length - 1;
        const unread = item.unread > 0;
        return (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: c.card,
              borderColor: c.border,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderTopWidth: first ? 1 : 0,
              borderBottomWidth: last ? 1 : 0,
              borderTopLeftRadius: first ? radius.xl : 0,
              borderTopRightRadius: first ? radius.xl : 0,
              borderBottomLeftRadius: last ? radius.xl : 0,
              borderBottomRightRadius: last ? radius.xl : 0,
              overflow: "hidden",
            }}
          >
            <ListRow onPress={() => router.push(`/messages/${item.customer.id}`)} last={last}>
              <Avatar name={item.customer.name} size={40} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text size={14} weight={unread ? "semibold" : "medium"} style={{ flex: 1 }} numberOfLines={1}>
                    {item.customer.name}
                  </Text>
                  <Text size={11.5} tone="muted">
                    {relativeTime(item.lastMessage.createdAt)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text size={13} tone={unread ? "default" : "muted"} style={{ flex: 1 }} numberOfLines={1}>
                    {item.lastMessage.from === "shop" ? "You: " : ""}
                    {item.lastMessage.body}
                  </Text>
                  {unread && (
                    <View
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        paddingHorizontal: 6,
                        backgroundColor: c.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text size={10.5} weight="semibold" color={c.primaryForeground}>
                        {item.unread}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ListRow>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16 }}>
          {query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : !query.data ? (
            <Card style={{ paddingVertical: 6 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center", paddingHorizontal: 18, paddingVertical: 14 }}>
                  <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton width={120} height={13} />
                    <Skeleton width={200} height={11} />
                  </View>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="No messages yet"
              description="When a signed-in customer taps the chat button on your website, their message lands here — and your phone lets you know."
            />
          )}
        </View>
      }
    />
  );
}

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, TextInput, View } from "react-native";
import { Stack, useIsFocused, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Phone, SendHorizontal, UserRound } from "@/components/icons";
import { ErrorState } from "@/components/page";
import { Avatar, Badge, Button, Skeleton } from "@/components/primitives";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, messageTime, titleCase, whatsappNumber } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { alpha, font, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import type { ChatCustomer, ChatMessage } from "@/lib/types";

type Conversation = { customer: ChatCustomer; messages: ChatMessage[]; canReply: boolean };

export default function ChatScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { business } = useSession();
  const { colors: c } = useTheme();
  const queryClient = useQueryClient();
  const focused = useIsFocused();
  // The stack header sits above this view: status bar plus a standard header bar.
  const headerHeight = useSafeAreaInsets().top + 44;
  const list = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const key = ["chat", business?.id, customerId];

  // Polls while open, like the web inbox; a push brings it forward sooner.
  const query = useQuery({
    queryKey: key,
    queryFn: () => api<Conversation>(`/api/mobile/messages/${customerId}`),
    enabled: Boolean(business && customerId),
    refetchInterval: focused ? 5000 : false,
  });

  // Opening the chat marks it read on the server; the badges should follow.
  const loaded = query.isSuccess;
  useEffect(() => {
    if (!loaded) return;
    void queryClient.invalidateQueries({ queryKey: ["threads"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [loaded, queryClient]);

  const send = useMutation({
    mutationFn: (body: string) =>
      api<{ message: ChatMessage }>(`/api/mobile/messages/${customerId}`, { method: "POST", body: { body } }),
    onSuccess: ({ message }) => {
      haptics.tap();
      setDraft("");
      queryClient.setQueryData<Conversation>(key, (current) =>
        current ? { ...current, messages: [...current.messages, message] } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
    onError: () => haptics.error(),
  });

  const count = query.data?.messages.length ?? 0;
  useEffect(() => {
    if (count) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
  }, [count]);

  const customer = query.data?.customer;
  const body = draft.trim();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () =>
            customer ? (
              <Pressable onPress={() => setProfileOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <Avatar name={customer.name} size={28} />
                <View>
                  <Text size={15} weight="semibold" numberOfLines={1}>
                    {customer.name}
                  </Text>
                  <Text size={11} tone="muted">
                    Customer profile
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Text size={16} weight="semibold">
                Chat
              </Text>
            ),
          headerRight: () =>
            customer ? (
              <Pressable onPress={() => setProfileOpen(true)} hitSlop={10} accessibilityLabel="Customer profile">
                <UserRound size={20} color={c.foreground} strokeWidth={1.9} />
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.background }}>
        {query.isError && !query.data ? (
          <View style={{ padding: 16 }}>
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          </View>
        ) : !query.data ? (
          <ChatSkeleton />
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={headerHeight}
          >
            <FlatList
              ref={list}
              data={query.data.messages}
              keyExtractor={(message) => message.id}
              contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
              onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <Text size={13} tone="muted" center style={{ paddingVertical: 40 }}>
                  No messages yet. Say hello!
                </Text>
              }
              renderItem={({ item, index }) => {
                const mine = item.from === "shop";
                const previous = query.data.messages[index - 1];
                const showName = !previous || previous.from !== item.from || previous.authorName !== item.authorName;
                return (
                  <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                    {showName && (
                      <Text size={11.5} weight="medium" tone="muted" style={{ marginBottom: 4, paddingHorizontal: 4 }}>
                        {mine ? "You" : item.authorName || query.data.customer.name}
                      </Text>
                    )}
                    <View
                      style={{
                        maxWidth: "85%",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: radius["2xl"],
                        borderBottomRightRadius: mine ? radius.md : radius["2xl"],
                        borderBottomLeftRadius: mine ? radius["2xl"] : radius.md,
                        backgroundColor: mine ? c.primary : c.muted,
                      }}
                    >
                      <Text size={14} color={mine ? c.primaryForeground : c.foreground} style={{ lineHeight: 21 }}>
                        {item.body}
                      </Text>
                    </View>
                    <Text size={11} color={alpha(c.mutedForeground, 0.8)} style={{ marginTop: 4, paddingHorizontal: 4 }}>
                      {messageTime(item.createdAt)}
                      {mine && item.readAt ? " · Seen" : ""}
                    </Text>
                  </View>
                );
              }}
            />

            {query.data.canReply ? (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card, padding: 12, gap: 8 }}>
                {send.isError && (
                  <Text size={12.5} tone="destructive" accessibilityRole="alert">
                    {send.error.message}
                  </Text>
                )}
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Write a reply…"
                    placeholderTextColor={alpha(c.mutedForeground, 0.7)}
                    selectionColor={c.primary}
                    multiline
                    maxLength={2000}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      maxHeight: 130,
                      borderWidth: 1,
                      borderColor: c.input,
                      borderRadius: radius.lg,
                      backgroundColor: c.background,
                      paddingHorizontal: 13,
                      paddingTop: 11,
                      paddingBottom: 11,
                      fontFamily: font.regular,
                      fontSize: 15,
                      color: c.foreground,
                    }}
                  />
                  <Pressable
                    onPress={() => body && send.mutate(body)}
                    disabled={!body || send.isPending}
                    accessibilityLabel="Send"
                    style={({ pressed }) => ({
                      width: 44,
                      height: 44,
                      borderRadius: radius.lg,
                      backgroundColor: c.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: !body || send.isPending ? 0.45 : pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    {send.isPending ? (
                      <ActivityIndicator size="small" color={c.primaryForeground} />
                    ) : (
                      <SendHorizontal size={18} color={c.primaryForeground} />
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 16 }}>
                <Text size={13} tone="muted" center>
                  Turn on Chat with customers to reply here.
                </Text>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      {customer && <ProfileSheet customer={customer} open={profileOpen} onClose={() => setProfileOpen(false)} />}
    </>
  );
}

/** The web inbox's customer panel: who they are and what they have bought. */
function ProfileSheet({ customer, open, onClose }: { customer: ChatCustomer; open: boolean; onClose: () => void }) {
  const address = [customer.address, customer.city, customer.district].filter(Boolean).join(", ");
  const type = { new: "New", regular: "Regular", vip: "VIP" }[customer.type] ?? titleCase(customer.type);
  return (
    <Sheet open={open} onClose={onClose} title="Customer profile">
      <View style={{ paddingHorizontal: 8, gap: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={customer.name} size={44} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text size={16} weight="semibold">
              {customer.name}
            </Text>
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Badge label={type} variant={customer.type === "vip" ? "soft" : "muted"} />
              {customer.memberSince && (
                <Text size={12} tone="muted">
                  Account since {formatDate(customer.memberSince)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <ProfileStat label="Orders" value={String(customer.totalOrders)} />
          <ProfileStat label="Total spent" value={formatCurrency(customer.totalSpent, { compact: true })} />
          <ProfileStat label="Last order" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"} />
        </View>

        <View style={{ gap: 8 }}>
          {customer.phone ? (
            <Text size={13.5} tone="muted">
              {customer.phone}
            </Text>
          ) : null}
          {customer.email ? (
            <Text size={13.5} tone="muted">
              {customer.email}
            </Text>
          ) : null}
          {address ? (
            <Text size={13.5} tone="muted">
              {address}
            </Text>
          ) : null}
        </View>

        {customer.phone ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="Call" variant="outline" icon={Phone} onPress={() => Linking.openURL(`tel:${customer.phone}`)} style={{ flex: 1 }} />
            <Button
              label="WhatsApp"
              variant="outline"
              icon={MessageCircle}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${whatsappNumber(customer.phone)}?text=${encodeURIComponent(`Hello ${customer.name},`)}`,
                )
              }
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ flex: 1, borderRadius: radius.lg, backgroundColor: alpha(c.muted, 0.7), paddingHorizontal: 12, paddingVertical: 10, gap: 2 }}>
      <Text size={11.5} tone="muted">
        {label}
      </Text>
      <Text size={14} weight="semibold" tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function ChatSkeleton() {
  return (
    <View style={{ padding: 16, gap: 14 }}>
      {[160, 220, 120, 200].map((width, i) => (
        <View key={i} style={{ alignItems: i % 2 ? "flex-end" : "flex-start" }}>
          <Skeleton width={width} height={40} style={{ borderRadius: radius["2xl"] }} />
        </View>
      ))}
    </View>
  );
}

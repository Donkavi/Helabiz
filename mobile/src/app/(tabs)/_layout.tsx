import { useEffect } from "react";
import type { ColorValue } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import { BarChart3, LayoutDashboard, MessagesSquare, Settings, ShoppingCart, type LucideIcon } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { registerForPush } from "@/lib/notifications";
import { useSession } from "@/lib/session";
import { font } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import type { Dashboard } from "@/lib/types";

/** The same icons as the web sidebar's nav items. */
function icon(Icon: LucideIcon) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean; size: number }) {
    return <Icon size={22} color={color as string} strokeWidth={focused ? 2.2 : 1.8} />;
  };
}

export default function TabsLayout() {
  const { signedIn, business } = useSession();
  const { colors } = useTheme();

  // Ask for notifications once the owner is in — the moment the app has
  // shown what it is for. Re-run quietly on later launches to keep the
  // server's copy of the push token current.
  useEffect(() => {
    if (signedIn) void registerForPush();
  }, [signedIn]);

  // Shares the dashboard's cache, so the badge costs no extra request.
  const dashboard = useQuery({
    queryKey: ["dashboard", business?.id],
    queryFn: () => api<Dashboard>("/api/mobile/dashboard"),
    enabled: signedIn && Boolean(business),
  });
  const unread = dashboard.data?.unreadMessages ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarLabel: "Home", tabBarIcon: icon(LayoutDashboard) }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: icon(ShoppingCart) }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: icon(MessagesSquare),
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.destructive, fontFamily: font.semibold, fontSize: 10.5 },
        }}
      />
      <Tabs.Screen name="analytics" options={{ title: "Reports", tabBarIcon: icon(BarChart3) }} />
      <Tabs.Screen name="more" options={{ title: "Settings", tabBarIcon: icon(Settings) }} />
    </Tabs>
  );
}

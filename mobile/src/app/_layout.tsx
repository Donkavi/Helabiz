import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider, focusManager, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from "@expo-google-fonts/geist";
import { GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { ApiError } from "@/lib/api";
import { ensureChannels } from "@/lib/notifications";
import { SessionProvider, useSession } from "@/lib/session";
import { font } from "@/lib/theme";
import { ThemeProvider, useTheme } from "@/lib/theme-provider";
import type { PushData } from "@/lib/types";

// Hold the splash until Geist is loaded, so no screen flashes in the system font.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_500Medium,
  });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // A 4xx will not fix itself on retry; a dropped connection might.
            retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
          },
        },
      }),
  );

  useEffect(() => {
    void ensureChannels();
    // Refresh stale screens when the owner comes back to the app.
    const subscription = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => subscription.remove();
  }, []);

  const ready = fontsLoaded || Boolean(fontError);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return null;

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AuthGate />
          <NotificationEvents />
          <ThemedStack />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: font.semibold, fontSize: 16, color: colors.foreground },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
        <Stack.Screen name="messages/[customerId]" options={{ title: "Chat" }} />
      </Stack>
    </>
  );
}

/** Sends a signed-out phone to sign-in from wherever it is — including mid-session, on a 401. */
function AuthGate() {
  const { ready, signedIn } = useSession();
  // Widened: the typed segments never admit the empty launch route, but it exists.
  const segments: string[] = useSegments();
  const onSignIn = segments[0] === "sign-in";
  // The launch screen (no segments) redirects by itself.
  const atLaunch = segments.length === 0;

  useEffect(() => {
    if (!ready || atLaunch) return;
    if (!signedIn && !onSignIn) router.replace("/sign-in");
    if (signedIn && onSignIn) router.replace("/");
  }, [ready, signedIn, onSignIn, atLaunch]);

  return null;
}

/**
 * Keeps the app in step with push notifications: refreshes data when one
 * arrives while the app is open, and opens the order or conversation when
 * one is tapped — switching business first if it is about another shop.
 */
function NotificationEvents() {
  const queryClient = useQueryClient();
  const { ready, signedIn, switchBusiness } = useSession();
  const response = Notifications.useLastNotificationResponse();
  const segments: string[] = useSegments();
  // Wait until the app has left the launch redirect, or the redirect would
  // replace the screen we open.
  const inApp = segments.length > 0 && segments[0] !== "sign-in";

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "session" });
    });
    return () => subscription.remove();
  }, [queryClient]);

  useEffect(() => {
    if (!ready || !signedIn || !inApp || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    // Handled once: without this the same tap reopens the order on every launch.
    Notifications.clearLastNotificationResponse();

    const data = (response.notification.request.content.data ?? {}) as PushData;
    void (async () => {
      if (data.businessId) await switchBusiness(data.businessId);
      if (data.type === "order" && data.orderId) router.push(`/orders/${data.orderId}`);
      else if (data.type === "message" && data.customerId) router.push(`/messages/${data.customerId}`);
    })();
  }, [ready, signedIn, inApp, response, switchBusiness]);

  return null;
}

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "./api";

/**
 * Push notifications: asking permission, registering this phone with the
 * server, and the Android channels the server sends to.
 *
 * Pushes are sent by the web app through Expo's push service, which needs the
 * EAS project id (added by `eas init`). Remote pushes do not work in Expo Go
 * on Android — use a development build (see mobile/README.md).
 */

// Show notifications while the app is open, too: an order arriving while the
// owner is looking at the orders list should still be heard.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** The same channel ids as `PushChannel` in the web app's push-service. */
export async function ensureChannels() {
  if (Platform.OS !== "android") return;
  await Promise.all([
    Notifications.setNotificationChannelAsync("orders", {
      name: "New orders",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#0D7E67",
    }),
    Notifications.setNotificationChannelAsync("messages", {
      name: "Customer messages",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 200],
    }),
    Notifications.setNotificationChannelAsync("general", {
      name: "Helabiz updates",
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  ]);
}

export type PushSetup =
  | { status: "enabled" }
  | { status: "denied" }
  | { status: "unavailable"; reason: string };

function projectId(): string | undefined {
  const fromConfig = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  return fromConfig ?? Constants.easConfig?.projectId ?? undefined;
}

/**
 * Asks for permission (once — the OS remembers a "no") and tells the server
 * where to push. Safe to call on every launch: the token rarely changes, and
 * re-sending it keeps the server current when it does.
 */
export async function registerForPush({ ask = true } = {}): Promise<PushSetup> {
  if (!Device.isDevice) {
    return { status: "unavailable", reason: "Notifications need a real phone, not a simulator." };
  }

  try {
    await ensureChannels();

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && ask) ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return { status: "denied" };

    const id = projectId();
    if (!id) {
      return { status: "unavailable", reason: "This build has no EAS project id. Run `eas init` in mobile/ and rebuild." };
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await api("/api/mobile/push-token", { method: "PUT", body: { pushToken } });
    return { status: "enabled" };
  } catch (error) {
    return { status: "unavailable", reason: error instanceof Error ? error.message : "Could not register this phone." };
  }
}

export function sendTestPush() {
  return api("/api/mobile/push-token", { method: "POST" });
}

/** Sent with sign-in so the owner can tell their sessions apart later. */
export function deviceInfo() {
  return {
    platform: Platform.OS,
    deviceName: [Device.manufacturer, Device.modelName].filter(Boolean).join(" ") || undefined,
  };
}

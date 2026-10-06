import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Pressable, View } from "react-native";
import { useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {
  Bell,
  BellOff,
  Check,
  ChevronRight,
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  Send,
  Sun,
  type LucideIcon,
} from "@/components/icons";
import { Page, PageHeader } from "@/components/page";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, IconTile, ListRow } from "@/components/primitives";
import { Text } from "@/components/text";
import { API_URL } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { registerForPush, sendTestPush, type PushSetup } from "@/lib/notifications";
import { useSession } from "@/lib/session";
import { alpha, radius } from "@/lib/theme";
import { useTheme, type ThemePreference } from "@/lib/theme-provider";

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function SettingsScreen() {
  const { user, businesses, business, switchBusiness, signOut } = useSession();
  const { colors: c, preference, setPreference } = useTheme();
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [setup, setSetup] = useState<PushSetup | null>(null);
  const [busy, setBusy] = useState<"enable" | "test" | "signout" | null>(null);

  // Re-read on focus: the owner may have changed it in system settings.
  useFocusEffect(
    useCallback(() => {
      void Notifications.getPermissionsAsync()
        .then((result) => setPermission(result.status))
        .catch(() => setPermission(null));
    }, []),
  );

  async function enable() {
    setBusy("enable");
    const result = await registerForPush();
    setSetup(result);
    setPermission(await Notifications.getPermissionsAsync().then((r) => r.status, () => null));
    setBusy(null);
    if (result.status === "enabled") haptics.success();
    if (result.status === "denied") {
      Alert.alert("Notifications are blocked", "Allow notifications for Helabiz in your phone's settings.", [
        { text: "Not now", style: "cancel" },
        { text: "Open settings", onPress: () => Linking.openSettings() },
      ]);
    }
  }

  async function test() {
    setBusy("test");
    try {
      await sendTestPush();
      haptics.success();
    } catch (error) {
      Alert.alert("Could not send a test", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  function confirmSignOut() {
    Alert.alert("Sign out?", "This phone will stop receiving order and message notifications.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setBusy("signout");
          await signOut();
        },
      },
    ]);
  }

  const granted = permission === "granted";
  const problem = setup?.status === "unavailable" ? setup.reason : null;

  return (
    <Page>
      <PageHeader title="Settings" description="Your account, your businesses and how this phone behaves." />

      {user && (
        <Card>
          <CardBody style={{ paddingTop: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={user.name || user.email} size={48} tone="solid" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={16} weight="semibold" numberOfLines={1}>
                {user.name}
              </Text>
              <Text size={13} tone="muted" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={businesses.length > 1 ? "Your businesses" : "Business"}
          description={businesses.length > 1 ? "Tap one to switch to it." : undefined}
        />
        <View style={{ paddingBottom: 6 }}>
          {businesses.map((item, index) => {
            const active = item.id === business?.id;
            return (
              <ListRow
                key={item.id}
                last={index === businesses.length - 1}
                onPress={
                  active
                    ? undefined
                    : () => {
                        haptics.select();
                        void switchBusiness(item.id);
                      }
                }
              >
                <Avatar name={item.name} size={36} tone={active ? "solid" : "soft"} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text size={14} weight="medium" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text size={12.5} tone="muted">
                    {titleCase(item.role)} · {titleCase(item.plan)} plan
                  </Text>
                </View>
                {active ? (
                  <Check size={18} color={c.primary} strokeWidth={2.5} />
                ) : item.locked ? (
                  <Badge label="Paused" variant="warning" />
                ) : (
                  <ChevronRight size={16} color={c.mutedForeground} />
                )}
              </ListRow>
            );
          })}
        </View>
      </Card>

      <Card>
        <CardHeader title="Appearance" description="Match your phone, or always light or dark." />
        <CardBody>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {THEMES.map((option) => {
              const active = option.value === preference;
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    haptics.select();
                    setPreference(option.value);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: active ? c.primary : c.border,
                    backgroundColor: active ? c.primaryMuted : pressed ? c.muted : c.card,
                  })}
                >
                  <Icon size={18} color={active ? c.primary : c.mutedForeground} />
                  <Text size={13} weight="medium" tone={active ? "primary" : "default"}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" />
        <CardBody style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconTile icon={granted ? Bell : BellOff} tone={granted ? "success" : "default"} size={36} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={14} weight="medium">
                {granted ? "On for this phone" : "Off for this phone"}
              </Text>
              <Text size={12.5} tone="muted">
                {granted
                  ? "New website orders and customer messages ring here."
                  : "Turn them on to hear about new orders the moment they arrive."}
              </Text>
            </View>
          </View>
          {problem && (
            <View
              style={{
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: alpha(c.warning, 0.3),
                backgroundColor: alpha(c.warning, 0.1),
                padding: 12,
              }}
            >
              <Text size={12.5}>{problem}</Text>
            </View>
          )}
          {!granted || problem ? (
            <Button label="Turn on notifications" icon={Bell} onPress={enable} loading={busy === "enable"} />
          ) : (
            <Button label="Send a test notification" variant="outline" icon={Send} onPress={test} loading={busy === "test"} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="On the website"
          description="Products, the website builder, invoices, billing and your team are managed on the Helabiz website."
        />
        <CardBody>
          <Button
            label="Open the Helabiz dashboard"
            variant="outline"
            icon={ExternalLink}
            onPress={() => Linking.openURL(`${API_URL}/dashboard`)}
            disabled={!API_URL}
          />
        </CardBody>
      </Card>

      <Button label="Sign out" variant="outline" icon={LogOut} onPress={confirmSignOut} loading={busy === "signout"} />

      <Text size={12} tone="muted" center>
        Helabiz for {Platform.OS === "ios" ? "iPhone" : "Android"} · v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </Page>
  );
}

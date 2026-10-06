import type { ReactNode } from "react";
import { Linking, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudOff, ExternalLink, Lock, RotateCw } from "@/components/icons";
import { API_URL, ApiError } from "@/lib/api";
import { useTheme } from "@/lib/theme-provider";
import { Button, EmptyState } from "./primitives";
import { Text } from "./text";

/** The web's `PageHeader`: a 22px semibold title with a muted line beneath. */
export function PageHeader({ title, description, right }: { title: string; description?: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text size={24} weight="semibold" tracking={-0.025} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text size={14} tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/**
 * A tab's scrolling page. The tab screens draw their own header (as the
 * web's pages do) rather than a navigation bar, so it starts under the
 * status bar.
 */
export function Page({
  children,
  refreshing,
  onRefresh,
  topInset = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** False under a navigation header, which already clears the status bar. */
  topInset?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: (topInset ? insets.top : 0) + 14,
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 18,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

/**
 * A failed load, in the server's own words. A paused business (trial over,
 * plan lapsed, suspended) gets a way to the website, where it can be fixed.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const paused = error instanceof ApiError && (error.code === "locked" || error.code === "suspended");
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <EmptyState
      icon={paused ? Lock : CloudOff}
      title={paused ? "Your Helabiz access is paused" : "Could not load this"}
      description={message}
      action={
        <View style={{ flexDirection: "row", gap: 8 }}>
          {onRetry && <Button label="Try again" variant="outline" size="sm" icon={RotateCw} onPress={onRetry} />}
          {paused && API_URL ? (
            <Button label="Open website" size="sm" icon={ExternalLink} onPress={() => Linking.openURL(`${API_URL}/dashboard`)} />
          ) : null}
        </View>
      }
    />
  );
}

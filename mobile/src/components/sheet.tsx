import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { Text } from "./text";

/**
 * A bottom sheet — the phone's answer to the web's dropdown menus and
 * dialogs. Slides up over a dimmed backdrop; tap outside or swipe the system
 * back gesture to close.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.spring(progress, { toValue: 1, useNativeDriver: true, damping: 24, stiffness: 260, mass: 0.9 }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 170, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, progress]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: c.overlay, opacity: progress }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "85%",
          backgroundColor: c.card,
          borderTopLeftRadius: radius["2xl"],
          borderTopRightRadius: radius["2xl"],
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: c.border,
          paddingBottom: insets.bottom + 12,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [640, 0] }) }],
        }}
      >
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border }} />
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 3 }}>
          <Text size={17} weight="semibold" tracking={-0.02}>
            {title}
          </Text>
          {description ? (
            <Text size={13} tone="muted">
              {description}
            </Text>
          ) : null}
        </View>
        <ScrollView bounces={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 4 }}>
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

/** One choice in a sheet: optional leading element, label, detail, and a trailing mark. */
export function SheetOption({
  label,
  detail,
  leading,
  trailing,
  onPress,
  destructive,
}: {
  label: string;
  detail?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 10,
        paddingVertical: 11,
        borderRadius: radius.lg,
        backgroundColor: pressed ? c.muted : "transparent",
      })}
    >
      {leading}
      <View style={{ flex: 1, gap: 1 }}>
        <Text size={14.5} weight="medium" color={destructive ? c.destructive : undefined}>
          {label}
        </Text>
        {detail ? (
          <Text size={12.5} tone="muted">
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

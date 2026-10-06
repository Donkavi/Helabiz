import { useEffect, useRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { LucideIcon } from "@/components/icons";
import { SvgUri } from "react-native-svg";
import { imageUrl } from "@/lib/api";
import { alpha, radius, type Palette } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-provider";
import { Text } from "./text";

/* ── Card ─────────────────────────────────────────────────────────────────
   The web's `Card`: rounded-xl, 1px border, a whisper of shadow. */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles(cardStyles);
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const s = useStyles(cardStyles);
  return (
    <View style={s.header}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={15} weight="semibold" tracking={-0.01}>
          {title}
        </Text>
        {description ? (
          <Text size={12.5} tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function CardBody({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles(cardStyles);
  return <View style={[s.body, style]}>{children}</View>;
}

const cardStyles = (c: Palette) => ({
  card: {
    backgroundColor: c.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  body: { paddingHorizontal: 18, paddingBottom: 18 },
});

/* ── Badge ────────────────────────────────────────────────────────────────
   The web's `Badge` variants: tinted at 10–16%, rounded-md, 12px medium. */

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "soft"
  | "muted";

function badgeColors(c: Palette, variant: BadgeVariant) {
  switch (variant) {
    case "default":
      return { bg: c.primary, fg: c.primaryForeground, border: "transparent" };
    case "secondary":
      return { bg: c.secondary, fg: c.foreground, border: "transparent" };
    case "outline":
      return { bg: c.card, fg: c.foreground, border: c.border };
    case "success":
      return { bg: alpha(c.success, 0.12), fg: c.success, border: "transparent" };
    case "warning":
      return { bg: alpha(c.warning, 0.16), fg: c.warning, border: "transparent" };
    case "destructive":
      return { bg: alpha(c.destructive, 0.12), fg: c.destructive, border: "transparent" };
    case "info":
      return { bg: alpha(c.info, 0.12), fg: c.info, border: "transparent" };
    case "soft":
      return { bg: c.primaryMuted, fg: c.primary, border: "transparent" };
    case "muted":
      return { bg: c.muted, fg: c.mutedForeground, border: "transparent" };
  }
}

export function Badge({
  label,
  variant = "default",
  icon: Icon,
  small,
}: {
  label: string;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  small?: boolean;
}) {
  const { colors } = useTheme();
  const tone = badgeColors(colors, variant);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: tone.bg,
        borderColor: tone.border,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: small ? 6 : 8,
        paddingVertical: small ? 0 : 1.5,
      }}
    >
      {Icon && <Icon size={12} color={tone.fg} strokeWidth={2.25} />}
      <Text size={small ? 10.5 : 12} weight="medium" color={tone.fg}>
        {label}
      </Text>
    </View>
  );
}

/* ── Button ───────────────────────────────────────────────────────────────
   The web's `Button`: rounded-lg, 14px medium, scales to 0.985 when pressed. */

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "soft";

export function Button({
  label,
  onPress,
  variant = "default",
  size = "default",
  icon: Icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "default" | "lg";
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: c } = useTheme();
  const tone = {
    default: { bg: c.primary, fg: c.primaryForeground, border: c.primary },
    destructive: { bg: c.destructive, fg: "#FFFFFF", border: c.destructive },
    outline: { bg: c.card, fg: c.foreground, border: c.border },
    secondary: { bg: c.secondary, fg: c.foreground, border: c.secondary },
    ghost: { bg: "transparent", fg: c.foreground, border: "transparent" },
    soft: { bg: c.primaryMuted, fg: c.primary, border: c.primaryMuted },
  }[variant];
  const dims = {
    sm: { height: 32, px: 12, text: 13, icon: 14, radius: radius.md },
    default: { height: 40, px: 16, text: 14, icon: 16, radius: radius.lg },
    lg: { height: 46, px: 22, text: 15, icon: 17, radius: radius.xl },
  }[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: dims.height,
          paddingHorizontal: dims.px,
          borderRadius: dims.radius,
          borderWidth: 1,
          backgroundColor: tone.bg,
          borderColor: tone.border,
          opacity: disabled && !loading ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        pressed && { opacity: 0.88 },
        variant === "default" && { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 1, shadowOffset: { width: 0, height: 1 } },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone.fg} />
      ) : (
        Icon && <Icon size={dims.icon} color={tone.fg} strokeWidth={2} />
      )}
      <Text size={dims.text} weight="medium" color={tone.fg}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Small pieces ─────────────────────────────────────────────────────── */

/** The tinted square behind a stat card's icon. */
export function IconTile({
  icon: Icon,
  tone = "default",
  size = 32,
}: {
  icon: LucideIcon;
  tone?: "default" | "primary" | "warning" | "success" | "destructive" | "info";
  size?: number;
}) {
  const { colors: c } = useTheme();
  const palette = {
    default: { bg: c.muted, fg: c.mutedForeground },
    primary: { bg: c.primaryMuted, fg: c.primary },
    warning: { bg: alpha(c.warning, 0.14), fg: c.warning },
    success: { bg: alpha(c.success, 0.12), fg: c.success },
    destructive: { bg: alpha(c.destructive, 0.1), fg: c.destructive },
    info: { bg: alpha(c.info, 0.12), fg: c.info },
  }[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.lg,
        backgroundColor: palette.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={size * 0.5} color={palette.fg} strokeWidth={2} />
    </View>
  );
}

/** "TODAY" — the web's section labels: 13px semibold, uppercase, wide tracking. */
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: -4 }}>
      <Text size={12.5} weight="semibold" tone="muted" tracking={0.06} style={{ textTransform: "uppercase" }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Text size={13} weight="medium" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: inset }} />;
}

/** Initials in a circle, as the web's avatar fallback. */
export function Avatar({ name, size = 40, tone = "soft" }: { name: string; size?: number; tone?: "soft" | "solid" }) {
  const { colors: c } = useTheme();
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone === "solid" ? c.primary : c.primaryMuted,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text size={size * 0.36} weight="semibold" color={tone === "solid" ? c.primaryForeground : c.primary}>
        {initials}
      </Text>
    </View>
  );
}

/** A product photo, or a quiet placeholder tile when there is none. */
export function Thumb({ src, size = 40, fallback: Fallback }: { src: string | null; size?: number; fallback: LucideIcon }) {
  const { colors: c } = useTheme();
  const uri = imageUrl(src);
  const box = { width: size, height: size, borderRadius: radius.lg, backgroundColor: c.muted };
  if (uri && /\.svg($|\?)/i.test(uri)) {
    // <Image> cannot draw SVG; the web's placeholder artwork is SVG.
    return (
      <View style={[box, { overflow: "hidden" }]}>
        <SvgUri uri={uri} width={size} height={size} preserveAspectRatio="xMidYMid slice" />
      </View>
    );
  }
  if (uri) return <Image source={{ uri }} style={box} />;
  return (
    <View style={[box, { alignItems: "center", justifyContent: "center" }]}>
      <Fallback size={size * 0.42} color={c.mutedForeground} strokeWidth={1.75} />
    </View>
  );
}

/** The web's `TabsList`: a muted track with the active option lifted onto a card. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: c.muted, borderRadius: radius.lg, padding: 3, gap: 3 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 7,
              borderRadius: radius.md,
              backgroundColor: active ? c.card : "transparent",
              shadowColor: "#000",
              shadowOpacity: active ? 0.06 : 0,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}
          >
            <Text size={13} weight="medium" tone={active ? "default" : "muted"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A shimmering placeholder in the shape of what is loading. */
export function Skeleton({ width, height, style }: { width?: number | `${number}%`; height: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[{ width: width ?? "100%", height, borderRadius: radius.md, backgroundColor: colors.muted, opacity: pulse }, style]}
    />
  );
}

/** The web's `EmptyState`: dashed outline, an icon on a lifted tile, a short line of help. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bare,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Without the dashed frame, for use inside a card. */
  bare?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <View
      style={[
        { alignItems: "center", paddingHorizontal: 24, paddingVertical: 36 },
        !bare && {
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: c.border,
          borderRadius: radius.xl,
          backgroundColor: alpha(c.card, 0.6),
        },
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius["2xl"] - 4,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.card,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          shadowColor: c.primary,
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Icon size={20} color={c.primary} strokeWidth={2} />
      </View>
      <Text size={15} weight="semibold" center>
        {title}
      </Text>
      {description ? (
        <Text size={13} tone="muted" center style={{ marginTop: 6, maxWidth: 290, lineHeight: 20 }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 18 }}>{action}</View> : null}
    </View>
  );
}

/**
 * A pressable list row with the web's hover tint on press. `last` drops the
 * divider under the final row of a list.
 */
export function ListRow({
  children,
  onPress,
  last,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 18,
          backgroundColor: pressed && onPress ? alpha(c.muted, 0.7) : "transparent",
        },
        !last && { borderBottomWidth: 1, borderBottomColor: c.border },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

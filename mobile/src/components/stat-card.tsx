import { Pressable, View } from "react-native";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "@/components/icons";
import { alpha, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { IconTile } from "./primitives";
import { Text } from "./text";

/**
 * The web dashboard's `StatCard`: a label, a tinted icon tile, the figure,
 * and a coloured change pill against a comparison period.
 */
export function StatCard({
  label,
  value,
  sublabel,
  change,
  icon,
  tone = "default",
  invertChange,
  onPress,
}: {
  label: string;
  value: string;
  sublabel?: string;
  change?: number;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "warning";
  /** For metrics where a rise is bad (expenses). */
  invertChange?: boolean;
  onPress?: () => void;
}) {
  const { colors: c } = useTheme();
  const positive = (change ?? 0) >= 0;
  const good = invertChange ? !positive : positive;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: "46%",
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: pressed ? alpha(c.primary, 0.3) : c.border,
        borderRadius: radius.xl,
        padding: 16,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <Text size={12.5} weight="medium" tone="muted" style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Text>
        {icon && <IconTile icon={icon} tone={tone} />}
      </View>

      <Text
        size={23}
        weight="semibold"
        tracking={-0.025}
        tabular
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{ marginTop: 10 }}
      >
        {value}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 8, minHeight: 20 }}>
        {change !== undefined && Number.isFinite(change) && Math.abs(change) < 0.05 && (
          // No movement is neither good nor bad.
          <View style={{ borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1.5, backgroundColor: c.muted }}>
            <Text size={11.5} weight="semibold" tone="muted" tabular>
              0%
            </Text>
          </View>
        )}
        {change !== undefined && Number.isFinite(change) && Math.abs(change) >= 0.05 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 1,
              borderRadius: radius.sm,
              paddingHorizontal: 5,
              paddingVertical: 1.5,
              backgroundColor: good ? alpha(c.success, 0.12) : alpha(c.destructive, 0.1),
            }}
          >
            <Arrow size={12} color={good ? c.success : c.destructive} strokeWidth={2.5} />
            <Text size={11.5} weight="semibold" color={good ? c.success : c.destructive} tabular>
              {Math.abs(change).toFixed(Math.abs(change) >= 100 ? 0 : 1)}%
            </Text>
          </View>
        )}
        {sublabel ? (
          <Text size={12} tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Two stat cards to a row, as the web's `sm:grid-cols-2`. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{children}</View>;
}

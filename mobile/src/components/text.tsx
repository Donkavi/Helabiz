import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { font, type FontWeight, type Palette } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";

type Tone = "default" | "muted" | "primary" | "success" | "warning" | "destructive" | "inverse";

const TONES: Record<Tone, keyof Palette> = {
  default: "foreground",
  muted: "mutedForeground",
  primary: "primary",
  success: "success",
  warning: "warning",
  destructive: "destructive",
  inverse: "primaryForeground",
};

/**
 * Every piece of text in the app: Geist, theme-aware, and the web's type
 * scale (13.5px body, tight tracking on large numbers).
 */
export function Text({
  size = 14,
  weight = "regular",
  tone = "default",
  color,
  tabular,
  tracking,
  center,
  style,
  ...props
}: TextProps & {
  size?: number;
  weight?: FontWeight;
  tone?: Tone;
  /** Overrides `tone`. */
  color?: string;
  /** Lining, equal-width digits for figures that line up — `tabular-nums`. */
  tabular?: boolean;
  /** Letter spacing in em, like Tailwind's `tracking-[-0.025em]`. */
  tracking?: number;
  center?: boolean;
}) {
  const { colors } = useTheme();
  const base: TextStyle = {
    fontFamily: font[weight],
    fontSize: size,
    lineHeight: Math.round(size * (size >= 20 ? 1.2 : 1.45)),
    color: color ?? colors[TONES[tone]],
  };
  if (tabular) base.fontVariant = ["tabular-nums"];
  if (tracking) base.letterSpacing = tracking * size;
  if (center) base.textAlign = "center";
  return <RNText {...props} style={[base, style]} />;
}

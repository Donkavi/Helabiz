/**
 * The Helabiz design tokens, converted exactly from the web app's oklch
 * values in `src/app/globals.css` — a warm-neutral surface system with one
 * deep jade brand hue, in light and dark. Change a colour there, change it
 * here.
 */

export type Palette = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  primaryMuted: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  gold: string;
  destructive: string;
  success: string;
  warning: string;
  info: string;
  border: string;
  input: string;
  sidebar: string;
  /** Behind a bottom sheet. */
  overlay: string;
};

export const light: Palette = {
  background: "#FDFDFC",
  foreground: "#1A1814",
  card: "#FFFFFF",
  primary: "#0D7E67",
  primaryForeground: "#FAFDFB",
  primaryMuted: "#E3F5EF",
  secondary: "#F5F4F1",
  muted: "#F5F4F1",
  mutedForeground: "#6E6C64",
  accent: "#F5F4EF",
  gold: "#E0A54B",
  destructive: "#D73337",
  success: "#2C965D",
  warning: "#E1A035",
  info: "#2D86C8",
  border: "#E4E3E0",
  input: "#DFDEDA",
  sidebar: "#FAFAF8",
  overlay: "rgba(26, 24, 20, 0.36)",
};

export const dark: Palette = {
  background: "#0E0F12",
  foreground: "#F2F2F0",
  card: "#15171A",
  primary: "#42BCA0",
  primaryForeground: "#021611",
  primaryMuted: "#102F28",
  secondary: "#222428",
  muted: "#222428",
  mutedForeground: "#95989F",
  accent: "#26292E",
  gold: "#EBB25F",
  destructive: "#E85854",
  success: "#51B67A",
  warning: "#EEB154",
  info: "#58A5E4",
  border: "#27292D",
  input: "#2B2E32",
  sidebar: "#0B0C0F",
  overlay: "rgba(0, 0, 0, 0.6)",
};

/** The web's categorical chart ramp (`CHART_COLORS`), in the same order. */
export const CHART_COLORS = ["#0D7E67", "#E0A54B", "#2D86C8", "#C65B93", "#5AA75E", "#8668B6"];

/** `--radius` is 10px on the web; these mirror its sm/md/lg/xl/2xl steps. */
export const radius = { sm: 6, md: 8, lg: 10, xl: 14, "2xl": 20, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24 } as const;

/**
 * Geist, as on the web. React Native picks a font file per weight by family
 * name — `fontWeight` alone does not switch files on Android.
 */
export const font = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  bold: "Geist_700Bold",
} as const;

export type FontWeight = keyof typeof font;

/** Geist Mono, for order numbers — the web shows them in `font-mono`. */
export const mono = "GeistMono_500Medium";

/** A colour at the given opacity, as Tailwind's `bg-success/12`. */
export function alpha(hex: string, opacity: number) {
  const value = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex.slice(0, 7)}${value}`;
}

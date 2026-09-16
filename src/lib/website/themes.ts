import type { ThemeTokens } from "@/types";

export type ThemePreset = {
  id: string;
  name: string;
  category: string;
  description: string;
  tokens: ThemeTokens;
};

export const FONT_OPTIONS = [
  { value: "Geist", label: "Geist — clean & modern", stack: "var(--font-geist-sans), sans-serif" },
  { value: "Inter", label: "Inter — neutral sans", stack: "Inter, var(--font-geist-sans), sans-serif" },
  { value: "Playfair Display", label: "Playfair — elegant serif", stack: "'Playfair Display', Georgia, serif" },
  { value: "Georgia", label: "Georgia — classic serif", stack: "Georgia, 'Times New Roman', serif" },
  { value: "Poppins", label: "Poppins — friendly geometric", stack: "Poppins, var(--font-geist-sans), sans-serif" },
  { value: "DM Sans", label: "DM Sans — soft sans", stack: "'DM Sans', var(--font-geist-sans), sans-serif" },
  { value: "Space Grotesk", label: "Space Grotesk — technical", stack: "'Space Grotesk', var(--font-geist-sans), sans-serif" },
  { value: "Courier New", label: "Courier — typewriter", stack: "'Courier New', monospace" },
];

export function fontStack(name?: string) {
  return FONT_OPTIONS.find((f) => f.value === name)?.stack ?? FONT_OPTIONS[0].stack;
}

/** Google Fonts that need loading on the public site (Geist/Georgia/Courier are already available). */
export const WEB_FONT_FAMILIES = ["Inter", "Playfair Display", "Poppins", "DM Sans", "Space Grotesk"];

export function googleFontsHref(families: string[]) {
  const wanted = [...new Set(families)].filter((f) => WEB_FONT_FAMILIES.includes(f));
  if (!wanted.length) return null;
  const params = wanted.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

const base: ThemeTokens = {
  primary: "#0f766e",
  secondary: "#0b3b36",
  background: "#ffffff",
  surface: "#f7f7f5",
  text: "#18181b",
  muted: "#71717a",
  headingFont: "Geist",
  bodyFont: "Geist",
  radius: 10,
  buttonStyle: "solid",
  sectionSpacing: 80,
  cardStyle: "bordered",
  headerStyle: "simple",
  footerStyle: "columns",
  containerWidth: 1160,
};

/** The eight designed themes shipped with the product (spec §18). */
export const THEMES: ThemePreset[] = [
  {
    id: "aurora",
    name: "Aurora",
    category: "Fashion",
    description: "Luxury fashion — generous whitespace, editorial serif headings.",
    tokens: {
      ...base,
      primary: "#111111",
      secondary: "#8a7a63",
      background: "#ffffff",
      surface: "#f6f4f1",
      text: "#141414",
      muted: "#7c7770",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      radius: 2,
      buttonStyle: "outline",
      sectionSpacing: 104,
      cardStyle: "flat",
      headerStyle: "centered",
      footerStyle: "columns",
    },
  },
  {
    id: "spice",
    name: "Spice Route",
    category: "Restaurant",
    description: "Modern restaurant — warm, appetising, confident type.",
    tokens: {
      ...base,
      primary: "#b4341f",
      secondary: "#2b1a12",
      background: "#fffaf5",
      surface: "#f6ead9",
      text: "#241812",
      muted: "#7c6558",
      headingFont: "Playfair Display",
      bodyFont: "DM Sans",
      radius: 6,
      buttonStyle: "pill",
      sectionSpacing: 88,
      cardStyle: "shadow",
      headerStyle: "split",
      footerStyle: "columns",
    },
  },
  {
    id: "butter",
    name: "Butter & Crumb",
    category: "Bakery",
    description: "Warm bakery — rounded shapes and soft cream surfaces.",
    tokens: {
      ...base,
      primary: "#c2762b",
      secondary: "#5b3a1a",
      background: "#fffdf8",
      surface: "#fbf1e2",
      text: "#3b2a19",
      muted: "#8b7460",
      headingFont: "Poppins",
      bodyFont: "DM Sans",
      radius: 18,
      buttonStyle: "pill",
      sectionSpacing: 80,
      cardStyle: "shadow",
      headerStyle: "simple",
      footerStyle: "centered",
    },
  },
  {
    id: "petal",
    name: "Petal",
    category: "Beauty",
    description: "Minimal beauty brand — quiet palette, lots of air.",
    tokens: {
      ...base,
      primary: "#a8577a",
      secondary: "#3d2531",
      background: "#fffcfd",
      surface: "#f8eef2",
      text: "#2e2028",
      muted: "#8a7580",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      radius: 14,
      buttonStyle: "soft",
      sectionSpacing: 96,
      cardStyle: "flat",
      headerStyle: "centered",
      footerStyle: "simple",
    },
  },
  {
    id: "circuit",
    name: "Circuit",
    category: "Electronics",
    description: "Modern technology store — crisp, dense, high contrast.",
    tokens: {
      ...base,
      primary: "#2563eb",
      secondary: "#0f172a",
      background: "#ffffff",
      surface: "#f1f5f9",
      text: "#0f172a",
      muted: "#64748b",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      radius: 8,
      buttonStyle: "solid",
      sectionSpacing: 72,
      cardStyle: "bordered",
      headerStyle: "split",
      footerStyle: "columns",
    },
  },
  {
    id: "frame",
    name: "Frame",
    category: "Photography",
    description: "Portfolio — dark canvas so the work carries the page.",
    tokens: {
      ...base,
      primary: "#e8e8e8",
      secondary: "#9a9a9a",
      background: "#0c0c0d",
      surface: "#161617",
      text: "#f2f2f2",
      muted: "#a1a1a6",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      radius: 4,
      buttonStyle: "outline",
      sectionSpacing: 100,
      cardStyle: "flat",
      headerStyle: "minimal",
      footerStyle: "simple",
    },
  },
  {
    id: "meridian",
    name: "Meridian",
    category: "Services",
    description: "Professional services — trustworthy, structured, calm.",
    tokens: {
      ...base,
      primary: "#0f766e",
      secondary: "#134e4a",
      background: "#ffffff",
      surface: "#f0fdfa",
      text: "#111827",
      muted: "#6b7280",
      headingFont: "Geist",
      bodyFont: "Geist",
      radius: 10,
      buttonStyle: "solid",
      sectionSpacing: 80,
      cardStyle: "bordered",
      headerStyle: "simple",
      footerStyle: "columns",
    },
  },
  {
    id: "signature",
    name: "Signature",
    category: "Personal Brand",
    description: "Creator and personal brand — bold headline, single column.",
    tokens: {
      ...base,
      primary: "#7c3aed",
      secondary: "#1e1b4b",
      background: "#fbfaff",
      surface: "#f1edfe",
      text: "#1c1917",
      muted: "#78716c",
      headingFont: "Poppins",
      bodyFont: "Inter",
      radius: 16,
      buttonStyle: "solid",
      sectionSpacing: 88,
      cardStyle: "elevated",
      headerStyle: "minimal",
      footerStyle: "centered",
    },
  },
];

export function getTheme(id?: string | null): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function normalizeTheme(tokens?: Partial<ThemeTokens> | null): ThemeTokens {
  return { ...base, ...(tokens ?? {}) };
}

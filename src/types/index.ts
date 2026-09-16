export type PlanId = "free" | "starter" | "business";
export type BusinessRole = "owner" | "admin" | "staff";

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";
export type PaymentMethod = "cod" | "bank_transfer" | "online" | "cash" | "card";
export type OrderSource = "website" | "manual" | "whatsapp" | "instagram" | "facebook" | "walk_in";

export type ExpenseCategory =
  | "rent" | "salary" | "marketing" | "packaging" | "delivery"
  | "inventory" | "utilities" | "transport" | "other";

export type Viewport = "desktop" | "tablet" | "mobile";

/** ── Website builder schema (spec §43) ────────────────────────────────── */
export type StyleProps = {
  background?: string;
  backgroundImage?: string;
  backgroundOverlay?: number;
  color?: string;
  paddingY?: number;
  paddingX?: number;
  marginTop?: number;
  marginBottom?: number;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  align?: "left" | "center" | "right";
  radius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  minHeight?: number;
  gap?: number;
  columns?: number;
  animation?: "none" | "fade" | "fade-up" | "zoom";
  hidden?: boolean;
};

export type SectionNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles: StyleProps;
  responsiveStyles?: { tablet?: StyleProps; mobile?: StyleProps };
  children?: SectionNode[];
};

export type PageSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export type ThemeTokens = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
  radius: number;
  buttonStyle: "solid" | "outline" | "soft" | "pill";
  sectionSpacing: number;
  cardStyle: "flat" | "bordered" | "shadow" | "elevated";
  headerStyle: "simple" | "centered" | "split" | "minimal";
  footerStyle: "simple" | "columns" | "centered";
  containerWidth: number;
};

export type NavItem = { id: string; label: string; href: string; children?: NavItem[] };

export type CartLine = {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  quantity: number;
  slug: string;
  stock?: number;
};

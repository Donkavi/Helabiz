import type { NavItem, ThemeTokens, Viewport } from "@/types";

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  trackInventory: boolean;
  categoryId?: string;
  featured?: boolean;
  sold?: number;
  createdAt?: string;
  shortDescription?: string;
  description?: string;
  /** When present, each variant carries the real price and stock; the fields above summarise them. */
  variants?: PublicVariant[];
};

export type PublicVariant = { id: string; name: string; price: number; compareAtPrice?: number; stock: number };

export type PublicCategory = { id: string; name: string; slug: string; image?: string };

export type SiteBusiness = {
  id: string;
  name: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  deliveryFee: number;
  freeDeliveryOver: number;
  social?: { facebook?: string; instagram?: string; tiktok?: string; youtube?: string };
};

export type SiteSettings = {
  showCart: boolean;
  allowCheckout: boolean;
  whatsappOrdering: boolean;
  announcement?: string;
  announcementEnabled?: boolean;
};

export type SitePageRef = { title: string; slug: string; isHome?: boolean };

/** Everything a section needs in order to render, in the editor or in public. */
export type SiteContext = {
  theme: ThemeTokens;
  business: SiteBusiness;
  products: PublicProduct[];
  categories: PublicCategory[];
  pages: SitePageRef[];
  navigation: NavItem[];
  settings: SiteSettings;
  /** URL prefix for links: "/site/my-shop" in path mode, "" on a custom domain. */
  basePath: string;
  /** True when rendering inside the builder — disables navigation and live forms. */
  editor: boolean;
  viewport: Viewport;
  websiteId?: string;
  businessId?: string;
};

export function resolveHref(ctx: SiteContext, href?: string) {
  if (!href) return ctx.editor ? undefined : "#";
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${ctx.basePath}${path === "/" ? "" : path}` || "/";
}

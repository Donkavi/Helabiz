import {
  AtSign,
  BarChart3,
  Boxes,
  FileText,
  Globe,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  MessagesSquare,
  Package,
  PanelsTopLeft,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { DashboardCopy } from "@/lib/i18n/dashboard";

/** `key` names the entry in `nav` of the dictionary; the label is looked up at render. */
export type NavKey = keyof Omit<DashboardCopy["nav"], "groups" | "viewLiveSite" | "freePlan" | "usageThisMonth" | "upgradePlan">;
export type NavLink = { href: string; key: NavKey; icon: LucideIcon; exact?: boolean };
export type NavGroup = { group: "business" | "website"; items: NavLink[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "business",
    items: [
      { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, exact: true },
      { href: "/orders", key: "orders", icon: ShoppingCart },
      { href: "/products", key: "products", icon: Package },
      { href: "/inventory", key: "inventory", icon: Boxes },
      { href: "/customers", key: "customers", icon: Users },
      { href: "/messages", key: "messages", icon: MessagesSquare },
      { href: "/expenses", key: "expenses", icon: Wallet },
      { href: "/invoices", key: "invoices", icon: FileText },
      { href: "/reports", key: "reports", icon: BarChart3 },
    ],
  },
  {
    group: "website",
    items: [
      { href: "/website", key: "overview", icon: Globe, exact: true },
      { href: "/website/pages", key: "pages", icon: PanelsTopLeft },
      { href: "/website/themes", key: "themes", icon: LayoutTemplate },
      { href: "/website/navigation", key: "navigation", icon: Link2 },
      { href: "/website/analytics", key: "analytics", icon: Sparkles },
      { href: "/website/domains", key: "domains", icon: AtSign },
      { href: "/website/settings", key: "settings", icon: Settings },
    ],
  },
];

export const ACCOUNT_LINKS: NavLink[] = [{ href: "/settings", key: "settings", icon: Settings }];

export function isActive(pathname: string, link: NavLink) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

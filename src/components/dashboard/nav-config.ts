import {
  AtSign,
  BarChart3,
  Boxes,
  FileText,
  Globe,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  Package,
  PanelsTopLeft,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { href: string; label: string; icon: LucideIcon; exact?: boolean };
export type NavGroup = { label: string; items: NavLink[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Business",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/products", label: "Products", icon: Package },
      { href: "/inventory", label: "Inventory", icon: Boxes },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/expenses", label: "Expenses", icon: Wallet },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/website", label: "Overview", icon: Globe, exact: true },
      { href: "/website/pages", label: "Pages", icon: PanelsTopLeft },
      { href: "/website/themes", label: "Themes", icon: LayoutTemplate },
      { href: "/website/navigation", label: "Navigation", icon: Link2 },
      { href: "/website/analytics", label: "Analytics", icon: Sparkles },
      { href: "/website/domains", label: "Domains", icon: AtSign },
      { href: "/website/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const ACCOUNT_LINKS: NavLink[] = [{ href: "/settings", label: "Settings", icon: Settings }];

export function isActive(pathname: string, link: NavLink) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

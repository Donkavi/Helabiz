import type { PlanId } from "@/types";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  description: string;
  popular?: boolean;
  limits: {
    ordersPerMonth: number;
    products: number;
    websites: number;
    pages: number;
    teamMembers: number;
    templates: number;
    customDomain: boolean;
    analytics: boolean;
    aiGenerator: boolean;
    invoices: boolean;
    whatsappTools: boolean;
    removeBranding: boolean;
  };
  features: string[];
};

export const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free trial",
    price: 0,
    tagline: "One month, no card",
    description:
      "Everything you need to open a real shop online, free for a whole month. Choose a plan before it ends to stay open.",
    limits: {
      ordersPerMonth: 20,
      products: 50,
      websites: 1,
      pages: 4,
      teamMembers: 1,
      // The two designs marked `tier: "free"` in lib/website/templates.ts,
      // plus the blank one, which is always available.
      templates: 2,
      customDomain: false,
      analytics: false,
      aiGenerator: false,
      invoices: false,
      whatsappTools: false,
      removeBranding: false,
    },
    features: [
      "Full access for 1 month",
      "20 orders per month",
      "50 products",
      "Basic website builder",
      "2 starter templates",
      "Free helabiz.lk subdomain",
      "Orders, customers & inventory",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 999,
    tagline: "For a growing shop",
    popular: true,
    description: "The full website builder plus the day-to-day tools that keep a busy shop organised.",
    limits: {
      ordersPerMonth: UNLIMITED,
      products: 500,
      websites: 1,
      pages: 20,
      teamMembers: 3,
      templates: UNLIMITED,
      customDomain: false,
      analytics: true,
      aiGenerator: false,
      invoices: true,
      whatsappTools: true,
      removeBranding: true,
    },
    features: [
      "Unlimited orders",
      "500 products",
      "Full website builder",
      "All templates & themes",
      "Unlimited custom pages",
      "Website analytics",
      "Professional invoices",
      "WhatsApp order tools",
      "No Helabiz branding",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 2499,
    tagline: "For established businesses",
    description: "Advanced analytics, AI website generation and a team that can work together.",
    limits: {
      ordersPerMonth: UNLIMITED,
      products: UNLIMITED,
      websites: 3,
      pages: UNLIMITED,
      teamMembers: 10,
      templates: UNLIMITED,
      customDomain: true,
      analytics: true,
      aiGenerator: true,
      invoices: true,
      whatsappTools: true,
      removeBranding: true,
    },
    features: [
      "Everything in Starter",
      "Unlimited products",
      "Advanced analytics & reports",
      "AI website generation",
      "Custom domain support",
      "Up to 10 staff accounts",
      "Multiple websites",
      "Priority support",
    ],
  },
};

export const PLAN_LIST = [PLANS.free, PLANS.starter, PLANS.business];

export function getPlan(planId?: string | null): Plan {
  return PLANS[(planId as PlanId) ?? "free"] ?? PLANS.free;
}

export function limitLabel(value: number) {
  return value === UNLIMITED ? "Unlimited" : value.toLocaleString("en-LK");
}

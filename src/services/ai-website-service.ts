import type { SectionNode, ThemeTokens } from "@/types";
import { createSection } from "@/lib/website/section-registry";
import { THEMES, getTheme } from "@/lib/website/themes";
import { getTemplate } from "@/lib/website/templates";

/**
 * AI website generation (spec §31).
 *
 * `generateWebsitePlan` is the seam: it returns a plan the caller turns into a
 * real website. The bundled generator is deterministic and runs with no API key,
 * so the feature works out of the box; wiring a model in means implementing
 * `AiProvider` and selecting it in `getAiProvider()` — nothing else changes.
 */
export type AiBrief = {
  businessName: string;
  description: string;
  industry?: string;
  city?: string;
  tone?: "warm" | "premium" | "playful" | "professional";
};

export type AiWebsitePlan = {
  provider: "mock" | "anthropic";
  themeId: string;
  theme: ThemeTokens;
  tagline: string;
  heroTitle: string;
  heroDescription: string;
  aboutTitle: string;
  aboutBody: string;
  ctaTitle: string;
  ctaDescription: string;
  features: { icon: string; title: string; description: string }[];
  pages: { title: string; slug: string; isHome?: boolean; sections: SectionNode[] }[];
  suggestedImages: string[];
  notes: string[];
};

export interface AiProvider {
  readonly name: "mock" | "anthropic";
  plan(brief: AiBrief): Promise<AiWebsitePlan>;
}

/* ── Keyword → theme mapping used by the built-in generator ────────────── */
const INDUSTRY_HINTS: { match: RegExp; themeId: string; icons: string[]; noun: string }[] = [
  { match: /cloth|fashion|wear|dress|apparel|boutique|saree|frock/i, themeId: "aurora", icons: ["truck", "gem", "heart"], noun: "pieces" },
  { match: /bak|cake|sweet|dessert|pastr|bread/i, themeId: "butter", icons: ["cake", "truck", "leaf"], noun: "bakes" },
  { match: /restaur|food|cafe|café|kitchen|catering|meal|rice/i, themeId: "spice", icons: ["coffee", "truck", "users"], noun: "dishes" },
  { match: /beauty|salon|spa|cosmetic|skin|hair|makeup|nail/i, themeId: "petal", icons: ["flower", "sparkles", "heart"], noun: "treatments" },
  { match: /electronic|phone|laptop|computer|tech|gadget|mobile/i, themeId: "circuit", icons: ["badge-check", "shield", "headphones"], noun: "products" },
  { match: /photo|studio|portfolio|design|art|creative|film|video/i, themeId: "frame", icons: ["camera", "star", "palette"], noun: "work" },
  { match: /service|repair|consult|clean|plumb|build|tuition|class/i, themeId: "meridian", icons: ["handshake", "badge-check", "clock"], noun: "services" },
];

function detect(brief: AiBrief) {
  const haystack = `${brief.industry ?? ""} ${brief.description} ${brief.businessName}`;
  return INDUSTRY_HINTS.find((hint) => hint.match.test(haystack)) ?? {
    match: /./,
    themeId: "meridian",
    icons: ["star", "truck", "heart"],
    noun: "products",
  };
}

function firstSentence(text: string) {
  const match = text.match(/[^.!?]+[.!?]?/);
  return (match?.[0] ?? text).trim();
}

const mockProvider: AiProvider = {
  name: "mock",
  async plan(brief) {
    const hint = detect(brief);
    const theme = getTheme(hint.themeId);
    const place = brief.city ? ` in ${brief.city}` : " in Sri Lanka";
    const summary = firstSentence(brief.description) || `${brief.businessName} sells quality ${hint.noun}.`;

    const heroTitle = `${brief.businessName}\nmade${place}`;
    const heroDescription = summary;
    const tagline = `Quality ${hint.noun}, delivered island-wide.`;

    const features = [
      { icon: hint.icons[0], title: "Island-wide delivery", description: "Delivered to your door in 2–4 working days." },
      { icon: hint.icons[1], title: "Quality you can trust", description: `Every one of our ${hint.noun} is checked before it leaves us.` },
      { icon: hint.icons[2], title: "Made with care", description: `A small team${place}, doing this properly.` },
    ];

    const aboutTitle = `About ${brief.businessName}`;
    const aboutBody = `${summary}\n\nWe started small and we have stayed close to our customers ever since. Everything we sell is something we would happily use ourselves.\n\nMessage us any time — we usually reply the same day.`;

    const ctaTitle = "Ready to order?";
    const ctaDescription = `Browse the full range and we will get it to you${place}.`;

    const s = (type: string, props: Record<string, unknown> = {}, styles: Record<string, unknown> = {}) => {
      const node = createSection(type);
      return { ...node, props: { ...node.props, ...props }, styles: { ...node.styles, ...styles } };
    };

    const pages: AiWebsitePlan["pages"] = [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("hero", {
            layout: "text-left",
            eyebrow: tagline,
            title: heroTitle,
            description: heroDescription,
            buttonText: "Shop now",
            buttonUrl: "/shop",
            secondaryButtonText: "Contact us",
            secondaryButtonUrl: "/contact",
          }),
          s("features", { title: "Why customers choose us", items: features }),
          s("product-grid", { title: `Our ${hint.noun}`, source: "all", limit: 8, columns: 4 }, { background: theme.tokens.surface }),
          s("about", { eyebrow: "Our story", title: aboutTitle, body: aboutBody }),
          s("testimonials", {}),
          s("cta", { title: ctaTitle, description: ctaDescription, buttonText: "Shop now", buttonUrl: "/shop" }),
        ],
      },
      {
        title: "Shop",
        slug: "shop",
        sections: [
          s("heading", { text: "Shop", subtext: tagline, level: "h1" }, { paddingY: 64, align: "center" }),
          s("product-grid", { title: "", source: "all", limit: 12, columns: 4, showViewAll: false }, { paddingY: 0, marginBottom: 80 }),
        ],
      },
      {
        title: "About",
        slug: "about",
        sections: [
          s("heading", { text: aboutTitle, level: "h1" }, { paddingY: 64, align: "center" }),
          s("about", { eyebrow: "", title: "", body: aboutBody }, { paddingY: 0 }),
          s("stats", {}, { paddingY: 80 }),
        ],
      },
      {
        title: "Contact",
        slug: "contact",
        sections: [
          s("heading", { text: "Contact us", subtext: "We reply the same day.", level: "h1" }, { paddingY: 64, align: "center" }),
          s("contact", {}, { paddingY: 0 }),
          s("hours", {}, { paddingY: 72 }),
        ],
      },
    ];

    return {
      provider: "mock",
      themeId: theme.id,
      theme: theme.tokens,
      tagline,
      heroTitle,
      heroDescription,
      aboutTitle,
      aboutBody,
      ctaTitle,
      ctaDescription,
      features,
      pages,
      suggestedImages: [
        "/placeholders/photo-1.svg",
        "/placeholders/photo-2.svg",
        "/placeholders/photo-3.svg",
      ],
      notes: [
        `Chose the ${theme.name} theme because your description reads as ${theme.category.toLowerCase()}.`,
        "Product sections read live from your catalogue — add products and they appear here.",
        "Replace the placeholder images with your own photos in the builder.",
      ],
    };
  },
};

/**
 * Selects the provider. A real model would be added here, behind the same
 * interface; with no key configured we fall back to the built-in generator.
 */
export function getAiProvider(): AiProvider {
  return mockProvider;
}

export function aiIsLive() {
  return getAiProvider().name !== "mock";
}

export async function generateWebsitePlan(brief: AiBrief) {
  return getAiProvider().plan(brief);
}

/** Every theme the generator can choose between, for the UI to preview. */
export const AI_THEME_CHOICES = THEMES.map((t) => ({ id: t.id, name: t.name, category: t.category }));

export function fallbackTemplateId(brief: AiBrief) {
  return getTemplate(detect(brief).themeId).id;
}

import type { SectionNode, StyleProps, ThemeTokens } from "@/types";
import { createSection } from "./section-registry";
import { THEMES, getTheme } from "./themes";

export type TemplatePage = {
  title: string;
  slug: string;
  isHome?: boolean;
  kind?: "standard" | "shop";
  seo?: { title?: string; description?: string };
  sections: SectionNode[];
};

export type TemplateTier = "free" | "premium";

export type Template = {
  id: string;
  /** Free plans get the two plainest designs; the rest come with a paid plan. */
  tier: TemplateTier;
  name: string;
  category: string;
  description: string;
  themeId: string;
  theme: ThemeTokens;
  pages: TemplatePage[];
  header: SectionNode;
  footer: SectionNode;
};

/** Builds a section node from the registry defaults with overrides applied. */
function s(type: string, props: Record<string, unknown> = {}, styles: StyleProps = {}): SectionNode {
  const node = createSection(type);
  return {
    ...node,
    props: { ...node.props, ...props },
    styles: { ...node.styles, ...styles },
  };
}

function header(style: string, extra: Record<string, unknown> = {}) {
  return s("header", { style, ...extra });
}

function footer(style: string, extra: Record<string, unknown> = {}) {
  return s("footer", { style, ...extra });
}

function shopPage(title = "Shop", columns = 4): TemplatePage {
  return {
    title,
    slug: "shop",
    kind: "shop",
    seo: { title, description: "Browse the full range." },
    sections: [
      s("heading", { text: title, subtext: "Everything we have, in one place.", level: "h1" }, { paddingY: 64, align: "center" }),
      s(
        "product-grid",
        { title: "", source: "all", limit: 12, columns, showViewAll: false, showFilters: true },
        { paddingY: 0, marginBottom: 80 },
      ),
    ],
  };
}

function contactPage(): TemplatePage {
  return {
    title: "Contact",
    slug: "contact",
    seo: { title: "Contact us", description: "Get in touch — we reply the same day." },
    sections: [
      s("heading", { text: "Contact us", subtext: "We would love to hear from you.", level: "h1" }, { paddingY: 64, align: "center" }),
      s("contact", {}, { paddingY: 0 }),
      s("hours", {}, { paddingY: 72 }),
      s("location", {}, { paddingY: 0, marginBottom: 80 }),
    ],
  };
}

const IMG = {
  fashion1: "/placeholders/fashion-1.svg",
  fashion2: "/placeholders/fashion-2.svg",
  food1: "/placeholders/food-1.svg",
  food2: "/placeholders/food-2.svg",
  bakery1: "/placeholders/bakery-1.svg",
  beauty1: "/placeholders/beauty-1.svg",
  tech1: "/placeholders/tech-1.svg",
  photo1: "/placeholders/photo-1.svg",
  photo2: "/placeholders/photo-2.svg",
  photo3: "/placeholders/photo-3.svg",
  service1: "/placeholders/service-1.svg",
  person1: "/placeholders/person-1.svg",
};

export const TEMPLATES: Template[] = [
  {
    id: "modern-fashion",
    tier: "premium",
    name: "Modern Fashion Store",
    category: "Fashion",
    description: "Editorial layout for clothing and accessories, built around big imagery.",
    themeId: "aurora",
    theme: getTheme("aurora").tokens,
    header: header("centered", { showCart: true }),
    footer: footer("columns"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        seo: { title: "Home", description: "Modern casual clothing, made in Sri Lanka." },
        sections: [
          s("announcement", { text: "Free island-wide delivery on orders over Rs. 10,000" }, { background: "#111111", color: "#ffffff", paddingY: 11 }),
          s("hero", {
            layout: "text-left",
            eyebrow: "New arrivals",
            title: "Your style.\nYour store.\nYour website.",
            description: "Discover our latest collection of everyday pieces, cut and finished in Colombo.",
            buttonText: "Shop now",
            buttonUrl: "/shop",
            secondaryButtonText: "Our story",
            secondaryButtonUrl: "/about",
            image: IMG.fashion1,
          }, { paddingY: 96 }),
          s("product-grid", { title: "New this week", source: "featured", limit: 4, columns: 4 }, { paddingY: 88, background: "#f6f4f1" }),
          s("about", {
            eyebrow: "Our story",
            title: "Made by a small team who care",
            body: "We started in a spare room in 2019 with one sewing machine.\n\nToday we make clothes we are proud to put our name on, for customers across Sri Lanka.",
            image: IMG.fashion2,
            buttonText: "Read more",
            buttonUrl: "/about",
          }),
          s("gallery", { title: "From our studio", layout: "grid", columns: 3, items: [
            { src: IMG.fashion1, caption: "" },
            { src: IMG.fashion2, caption: "" },
            { src: IMG.photo1, caption: "" },
            { src: IMG.photo2, caption: "" },
            { src: IMG.photo3, caption: "" },
            { src: IMG.fashion1, caption: "" },
          ] }),
          s("testimonials", {}),
          s("cta", { title: "Join the list", description: "New drops, quietly announced. No spam, ever.", buttonText: "Contact us", buttonUrl: "/contact" }),
        ],
      },
      shopPage("Shop"),
      {
        title: "About",
        slug: "about",
        seo: { title: "About us" },
        sections: [
          s("heading", { text: "About us", level: "h1" }, { paddingY: 72, align: "center" }),
          s("about", {}, { paddingY: 0 }),
          s("stats", {}, { paddingY: 88 }),
          s("team", {}, { paddingY: 0, marginBottom: 88 }),
        ],
      },
      contactPage(),
    ],
  },

  {
    id: "sri-lankan-bakery",
    tier: "premium",
    name: "Sri Lankan Bakery",
    category: "Bakery",
    description: "Warm, appetising layout for bakeries, sweets and home kitchens.",
    themeId: "butter",
    theme: getTheme("butter").tokens,
    header: header("simple"),
    footer: footer("centered"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("slider", { slides: [
            { image: IMG.bakery1, heading: "Baked fresh every morning", description: "Order before 3pm for same-day delivery in Kandy.", buttonText: "Order now", buttonUrl: "/shop" },
            { image: IMG.food1, heading: "Celebration cakes", description: "Made to order for birthdays and weddings.", buttonText: "See our cakes", buttonUrl: "/shop" },
          ], height: 520 }),
          s("features", { title: "Why our customers come back", items: [
            { icon: "cake", title: "Baked daily", description: "Nothing sits overnight. Everything is made the morning you order it." },
            { icon: "truck", title: "Same-day delivery", description: "Order before 3pm and we will get it to you today." },
            { icon: "leaf", title: "Real ingredients", description: "Real butter, real eggs, no shortcuts." },
          ] }),
          s("product-grid", { title: "Today's bakes", source: "all", limit: 8, columns: 4 }, { background: "#fbf1e2" }),
          s("cards", { title: "We also make", items: [
            { image: IMG.food1, title: "Celebration cakes", description: "Custom cakes for any occasion.", price: "From Rs. 4,500", buttonText: "Enquire", link: "/contact" },
            { image: IMG.food2, title: "Party boxes", description: "Short eats and sweets for events.", price: "From Rs. 2,800", buttonText: "Enquire", link: "/contact" },
            { image: IMG.bakery1, title: "Corporate orders", description: "Office tea-time, delivered weekly.", price: "On request", buttonText: "Enquire", link: "/contact" },
          ] }),
          s("testimonials", { title: "Kind words" }),
          s("hours", {}, { background: "#fbf1e2", paddingY: 72 }),
          s("cta", { title: "Hungry yet?", description: "Order online and we will do the rest.", buttonText: "Order now", buttonUrl: "/shop" }),
        ],
      },
      shopPage("Order online"),
      {
        title: "About",
        slug: "about",
        sections: [
          s("heading", { text: "Our story", level: "h1" }, { paddingY: 72, align: "center" }),
          s("about", { title: "Three generations of baking", image: IMG.bakery1 }, { paddingY: 0 }),
          s("gallery", { title: "Inside the bakery", columns: 3 }, { paddingY: 88 }),
        ],
      },
      contactPage(),
    ],
  },

  {
    id: "home-business",
    tier: "free",
    name: "Home Business",
    category: "Home Business",
    description: "A simple one-page site for a business run from home.",
    themeId: "meridian",
    theme: getTheme("meridian").tokens,
    header: header("simple"),
    footer: footer("simple"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("hero", {
            layout: "centered",
            eyebrow: "Handmade in Sri Lanka",
            title: "Small batch. Big care.",
            description: "Everything here is made by hand, in small quantities, by us.",
            buttonText: "See what we make",
            buttonUrl: "/shop",
            secondaryButtonText: "",
            image: IMG.service1,
          }),
          s("product-grid", { title: "What we make", limit: 6, columns: 3 }),
          s("about", { title: "Who we are", body: "We are a family business working out of our home in Gampaha.\n\nEvery order is packed by one of us, by hand, usually the same day you place it." }),
          s("features", { title: "How it works", columns: 3, items: [
            { icon: "shopping-bag", title: "1. Order online", description: "Pick what you want and pay on delivery." },
            { icon: "package", title: "2. We pack it", description: "Made and packed within a day." },
            { icon: "truck", title: "3. It arrives", description: "Island-wide courier, 2–4 days." },
          ] }),
          s("contact", { title: "Questions?" }),
        ],
      },
      shopPage("Shop", 3),
      contactPage(),
    ],
  },

  {
    id: "beauty-salon",
    tier: "premium",
    name: "Beauty Salon",
    category: "Beauty",
    description: "Calm, minimal layout for salons, spas and beauty brands.",
    themeId: "petal",
    theme: getTheme("petal").tokens,
    header: header("centered"),
    footer: footer("simple"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("hero", {
            layout: "background",
            eyebrow: "",
            title: "Look after yourself",
            description: "A quiet salon in Colombo 05, by appointment only.",
            buttonText: "Book an appointment",
            buttonUrl: "/contact",
            secondaryButtonText: "See services",
            secondaryButtonUrl: "/services",
            image: IMG.beauty1,
          }, { minHeight: 620, backgroundOverlay: 42, paddingY: 0 }),
          s("services", { title: "Our services", columns: 2 }),
          s("pricing", { title: "Packages" }, { background: "#f8eef2" }),
          s("gallery", { title: "Our work", layout: "masonry", columns: 3 }),
          s("testimonials", { layout: "single" }),
          s("hours", {}),
          s("cta", { title: "Ready when you are", description: "Appointments fill up quickly — book a few days ahead.", buttonText: "Book now", buttonUrl: "/contact" }),
        ],
      },
      {
        title: "Services",
        slug: "services",
        sections: [
          s("heading", { text: "Services", level: "h1" }, { paddingY: 72, align: "center" }),
          s("services", { title: "", columns: 2 }, { paddingY: 0 }),
          s("pricing", {}, { paddingY: 88 }),
        ],
      },
      contactPage(),
    ],
  },

  {
    id: "restaurant",
    tier: "premium",
    name: "Restaurant",
    category: "Restaurant",
    description: "Menu-forward layout for restaurants and cafés.",
    themeId: "spice",
    theme: getTheme("spice").tokens,
    header: header("split"),
    footer: footer("columns"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("hero", {
            layout: "background",
            eyebrow: "Since 2014",
            title: "Sri Lankan food,\ncooked properly",
            description: "Open for lunch and dinner, seven days a week.",
            buttonText: "See the menu",
            buttonUrl: "/menu",
            secondaryButtonText: "Book a table",
            secondaryButtonUrl: "/contact",
            image: IMG.food1,
          }, { minHeight: 660, backgroundOverlay: 52, paddingY: 0 }),
          s("features", { title: "", columns: 3, items: [
            { icon: "coffee", title: "Open daily", description: "11:00 am until late, every day of the week." },
            { icon: "truck", title: "Delivery", description: "We deliver within 8km of the restaurant." },
            { icon: "users", title: "Private events", description: "The upstairs room seats 40." },
          ] }, { paddingY: 64 }),
          s("product-grid", { title: "Popular dishes", source: "featured", limit: 6, columns: 3, showAddToCart: true }, { background: "#f6ead9" }),
          s("about", { title: "Our kitchen", body: "We cook the food we grew up eating.\n\nEverything is made fresh each day — nothing is reheated, nothing is frozen.", image: IMG.food2 }),
          s("gallery", { title: "The room", columns: 4, layout: "grid" }),
          s("location", {}, { background: "#f6ead9", paddingY: 80 }),
          s("cta", { title: "Come and eat", description: "Walk-ins welcome, but we recommend booking on weekends.", buttonText: "Book a table", buttonUrl: "/contact" }),
        ],
      },
      shopPage("Menu", 3),
      contactPage(),
    ],
  },

  {
    id: "electronics-shop",
    tier: "premium",
    name: "Electronics Shop",
    category: "Electronics",
    description: "Dense, information-first layout for a technology store.",
    themeId: "circuit",
    theme: getTheme("circuit").tokens,
    header: header("split", { buttonText: "Shop", buttonUrl: "/shop" }),
    footer: footer("columns"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("announcement", { text: "Warranty on everything we sell · Island-wide delivery" }, { background: "#0f172a", color: "#ffffff" }),
          s("hero", {
            layout: "text-left",
            eyebrow: "Authorised dealer",
            title: "Technology that just works",
            description: "Laptops, phones and accessories with a real warranty and real support.",
            buttonText: "Shop now",
            buttonUrl: "/shop",
            secondaryButtonText: "Talk to us",
            secondaryButtonUrl: "/contact",
            image: IMG.tech1,
          }, { paddingY: 72 }),
          s("categories", { title: "Shop by category", columns: 4, limit: 8 }),
          s("product-grid", { title: "Best sellers", sort: "best-selling", limit: 8, columns: 4, showStock: true }, { background: "#f1f5f9" }),
          s("features", { title: "Why buy from us", columns: 4, items: [
            { icon: "badge-check", title: "Genuine stock", description: "Sourced through authorised channels only." },
            { icon: "shield", title: "Real warranty", description: "Handled locally — no shipping things abroad." },
            { icon: "truck", title: "Fast delivery", description: "Dispatched the same day where possible." },
            { icon: "headphones", title: "Support", description: "We answer the phone. Genuinely." },
          ] }),
          s("featured-product", { eyebrow: "This week", buttonText: "See details" }, { background: "#f1f5f9" }),
          s("faq", {}),
        ],
      },
      shopPage("Shop"),
      contactPage(),
    ],
  },

  {
    id: "portfolio",
    tier: "premium",
    name: "Portfolio",
    category: "Photography",
    description: "Dark, image-led portfolio for photographers and creatives.",
    themeId: "frame",
    theme: getTheme("frame").tokens,
    header: header("minimal"),
    footer: footer("simple"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("hero", {
            layout: "centered",
            eyebrow: "Photographer · Colombo",
            title: "Light, patience, and a good story",
            description: "Weddings, portraits and editorial work across Sri Lanka.",
            buttonText: "See the work",
            buttonUrl: "/work",
            secondaryButtonText: "Book a shoot",
            secondaryButtonUrl: "/contact",
            image: IMG.photo1,
          }, { paddingY: 88 }),
          s("gallery", { title: "", layout: "masonry", columns: 3, lightbox: true }, { paddingY: 40 }),
          s("pricing", { title: "Packages" }),
          s("testimonials", { layout: "single" }),
          s("cta", { title: "Let's work together", description: "Tell me about your day and I will send availability.", buttonText: "Get in touch", buttonUrl: "/contact" }),
        ],
      },
      {
        title: "Work",
        slug: "work",
        sections: [
          s("heading", { text: "Selected work", level: "h1" }, { paddingY: 72, align: "center" }),
          s("gallery", { layout: "grid", columns: 3 }, { paddingY: 0, marginBottom: 88 }),
        ],
      },
      contactPage(),
    ],
  },

  {
    id: "service-business",
    tier: "free",
    name: "Service Business",
    category: "Services",
    description: "Trust-building layout for consultants, trades and agencies.",
    themeId: "meridian",
    theme: getTheme("meridian").tokens,
    header: header("simple", { buttonText: "Get a quote", buttonUrl: "/contact" }),
    footer: footer("columns"),
    pages: [
      {
        title: "Home",
        slug: "home",
        isHome: true,
        sections: [
          s("hero", {
            layout: "text-left",
            eyebrow: "Serving Colombo & Gampaha",
            title: "Work you will not have to do twice",
            description: "Fifteen years of doing things properly, on time, for a fair price.",
            buttonText: "Get a quote",
            buttonUrl: "/contact",
            secondaryButtonText: "Our services",
            secondaryButtonUrl: "/services",
            image: IMG.service1,
          }),
          s("stats", {}, { background: "#f0fdfa", paddingY: 64 }),
          s("services", { title: "What we do", columns: 2 }),
          s("features", { eyebrow: "How we work", title: "Simple, from start to finish", columns: 3, items: [
            { icon: "message-circle", title: "Tell us what you need", description: "A quick call or WhatsApp message is enough to start." },
            { icon: "lightbulb", title: "We quote in writing", description: "A clear price, with no surprises later." },
            { icon: "badge-check", title: "We do the work", description: "On the agreed day, finished properly." },
          ] }, { background: "#f0fdfa" }),
          s("testimonials", {}),
          s("faq", {}),
          s("cta", { title: "Need a quote?", description: "Send us the details and we will reply within a day.", buttonText: "Contact us", buttonUrl: "/contact" }),
        ],
      },
      {
        title: "Services",
        slug: "services",
        sections: [
          s("heading", { text: "Our services", level: "h1" }, { paddingY: 72, align: "center" }),
          s("services", { title: "", columns: 2 }, { paddingY: 0 }),
          s("pricing", { title: "Typical pricing" }, { paddingY: 88 }),
        ],
      },
      contactPage(),
    ],
  },
];

export const BLANK_TEMPLATE: Template = {
  id: "blank",
  tier: "free",
  name: "Start from scratch",
  category: "Blank",
  description: "An empty home page with just a header and footer. Build it your way.",
  themeId: "meridian",
  theme: getTheme("meridian").tokens,
  header: header("simple"),
  footer: footer("simple"),
  pages: [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [
        s("hero", { title: "Welcome to our website", description: "Replace this text with something about your business.", image: "" }),
      ],
    },
    shopPage("Shop"),
    { title: "About", slug: "about", sections: [s("heading", { text: "About us", level: "h1" }), s("richtext", {})] },
    contactPage(),
  ],
};

export const ALL_TEMPLATES = [BLANK_TEMPLATE, ...TEMPLATES];

/** Ids a free plan may build from. Keep `PLANS.free.limits.templates` in step. */
export const FREE_TEMPLATE_IDS = ALL_TEMPLATES.filter((t) => t.tier === "free").map((t) => t.id);

export function isPremiumTemplate(id?: string | null) {
  return ALL_TEMPLATES.find((t) => t.id === id)?.tier === "premium";
}

export function getTemplate(id?: string | null): Template {
  return ALL_TEMPLATES.find((t) => t.id === id) ?? BLANK_TEMPLATE;
}

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export { THEMES };

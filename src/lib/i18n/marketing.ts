import type { Lang } from ".";

/**
 * Every string on the public marketing pages, in both languages.
 *
 * Sinhala is written the way Sri Lankan shop owners actually speak about this
 * work: the product words they already use in English — order, stock, invoice,
 * WhatsApp, template, publish, plan — stay in English inside the Sinhala
 * sentence. Translating those into formal Sinhala would read like a manual
 * nobody asked for.
 *
 * Structured by page so a string is easy to find from the markup that uses it.
 */
type Feature = { title: string; body: string };
type Faq = { q: string; a: string };

export type MarketingCopy = {
  nav: {
    links: { href: string; label: string }[];
    signIn: string;
    startFree: string;
    openMenu: string;
    closeMenu: string;
  };

  footer: {
    blurb: string;
    columns: { title: string; links: { href: string; label: string }[] }[];
    madeIn: string;
    currency: string;
  };

  home: {
    metaTitle: string;
    metaDescription: string;
    badge: string;
    headline: [string, string, string];
    lede: string;
    startFree: string;
    createWebsite: string;
    reassurance: string;

    problem: { eyebrow: string; title: string; body: string; items: Feature[] };
    solution: {
      eyebrow: string;
      title: string;
      body: string;
      front: { kicker: string; title: string; body: string; points: string[] };
      back: { kicker: string; title: string; body: string; points: string[] };
      learnMore: string;
    };
    builder: {
      eyebrow: string;
      title: string;
      body: string;
      steps: { label: string; body: string }[];
      features: Feature[];
      sectionsIncluded: string;
      sections: string[];
    };
    business: { eyebrow: string; title: string; body: string; features: Feature[]; strip: Feature[] };
    templates: { eyebrow: string; title: string; body: string; browseAll: string };
    steps: { eyebrow: string; title: string; items: { n: string; title: string; body: string }[] };
    pricing: { eyebrow: string; title: string; body: string };
    testimonials: { eyebrow: string; title: string; items: { quote: string; name: string; role: string }[] };
    faq: { eyebrow: string; title: string; body: string; items: Faq[] };
    finalCta: { title: string; body: string; startFree: string; seePricing: string };
  };

  pricing: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    lede: string;
    compare: string;
    feature: string;
    popular: string;
    rows: { key: string; label: string }[];
    faqTitle: string;
    faqs: Faq[];
    cta: string;
  };

  plans: Record<string, { name: string; tagline: string; description: string; features: string[] }>;

  /** `choose` holds a {plan} placeholder: word order differs between the two. */
  planCard: { mostPopular: string; free: string; perMonth: string; currentPlan: string; startFree: string; choose: string };

  limits: { unlimited: string };

  templatesPage: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    lede: string;
    startFree: string;
    seePricing: string;
    viewTemplate: string;
    useTemplate: string;
    unlock: string;
    free: string;
    blankTitle: string;
    blankBody: string;
    blankCta: string;
  };
};

const EN: MarketingCopy = {
  nav: {
    links: [
      { href: "/#website-builder", label: "Website builder" },
      { href: "/#business", label: "Business tools" },
      { href: "/templates", label: "Templates" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
    signIn: "Sign in",
    startFree: "Start free",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  footer: {
    blurb:
      "The business platform built for Sri Lankan small businesses. Run your shop and build your website in one place.",
    columns: [
      {
        title: "Product",
        links: [
          { href: "/#website-builder", label: "Website builder" },
          { href: "/#business", label: "Business management" },
          { href: "/templates", label: "Templates" },
          { href: "/pricing", label: "Pricing" },
        ],
      },
      {
        title: "Built for",
        links: [
          { href: "/templates?category=Fashion", label: "Clothing stores" },
          { href: "/templates?category=Bakery", label: "Bakeries" },
          { href: "/templates?category=Beauty", label: "Salons & beauty" },
          { href: "/templates?category=Restaurant", label: "Restaurants" },
        ],
      },
      {
        title: "Company",
        links: [
          { href: "/#faq", label: "FAQ" },
          { href: "/sign-up", label: "Start free" },
          { href: "/sign-in", label: "Sign in" },
        ],
      },
    ],
    madeIn: "Made in Sri Lanka.",
    currency: "Prices in Sri Lankan Rupees (LKR).",
  },

  home: {
    metaTitle: "Helabiz — Your business. Your website. One simple platform.",
    metaDescription:
      "Manage your products, orders, customers and profits — and build your own professional website without writing code. Made for Sri Lankan small businesses.",
    badge: "Built for Sri Lankan small businesses",
    headline: ["Your business.", "Your website.", "One simple platform."],
    lede:
      "Manage your products, orders, customers and profits — and build your own professional website without writing code.",
    startFree: "Start free",
    createWebsite: "Create a website",
    reassurance: "Free forever plan · No card required · Live in under an hour",

    problem: {
      eyebrow: "The problem",
      title: "Selling through chat stops working",
      body: "It gets you started, but it does not scale. Somewhere between the tenth and hundredth order, the messages win.",
      items: [
        {
          title: "Orders lost in chat",
          body: "Sales arrive across WhatsApp, Instagram and Facebook, then disappear into a scroll of messages.",
        },
        {
          title: "Numbers in a notebook",
          body: "You are guessing at profit because sales, costs and expenses live in three different places.",
        },
        {
          title: "No real website",
          body: "Customers ask for a link and you send a photo album. Quotes from developers start at Rs. 80,000.",
        },
      ],
    },

    solution: {
      eyebrow: "The solution",
      title: "One platform, two halves that talk to each other",
      body: "A website your customers order from, and a dashboard that keeps the business behind it in order. Same products, same customers, same numbers.",
      front: {
        kicker: "Front of house",
        title: "A professional website",
        body: "Drag-and-drop pages, real product listings, a cart and a Sri Lankan-friendly checkout — published to your own address.",
        points: ["Drag-and-drop builder", "8 designed templates", "Cart & checkout", "SEO and sitemaps"],
      },
      back: {
        kicker: "Back of house",
        title: "A business that runs itself",
        body: "Orders land in one list, stock adjusts automatically, customers build up a history, and profit is calculated for you.",
        points: ["Orders & inventory", "Customers & expenses", "Invoices & reports", "WhatsApp messaging"],
      },
      learnMore: "Learn more",
    },

    builder: {
      eyebrow: "Website builder",
      title: "Build it the way you picture it",
      body: "Everything on your website is a section. Drag one in, drop it where it belongs, and edit it in place.",
      steps: [
        { label: "Drag", body: "Choose from 40+ sections across layout, content, marketing, media and commerce." },
        { label: "Drop", body: "A clear line shows exactly where the section will land before you let go." },
        { label: "Customise", body: "Change text, colour, spacing, images and layout from the settings panel." },
        { label: "Publish", body: "Your draft stays private until you publish. Then it is live on the web." },
      ],
      features: [
        { title: "Drag and drop", body: "Pick a section, drop it where you want it. No code, no theme files." },
        { title: "Change anything", body: "Colours, fonts, spacing, images and buttons — every section has real settings." },
        { title: "Mobile ready", body: "Design for desktop, tablet and phone with a single switch. Published sites are responsive." },
        { title: "Your real products", body: "Product sections read straight from your catalogue. Add a product once, it appears everywhere." },
      ],
      sectionsIncluded: "Sections included",
      sections: [
        "Hero", "Image gallery", "Image slider", "Product grid", "Featured product", "Testimonials",
        "Call to action", "Features", "Statistics", "FAQ", "Pricing cards", "About us", "Services",
        "Team", "Contact form", "Business hours", "Location", "Social links", "Announcement bar",
        "Video", "Columns", "Rich text", "Categories", "Footer",
      ],
    },

    business: {
      eyebrow: "Business management",
      title: "The half your customers never see",
      body: "Every website order becomes a real order, a real customer and a real stock movement — automatically.",
      features: [
        { title: "Orders", body: "Every website and manual order in one list, with status tracking and WhatsApp replies." },
        { title: "Inventory", body: "Stock drops automatically when an order comes in, with a movement log you can audit." },
        { title: "Customers", body: "Website buyers are added to your customer list with their order history and spend." },
        { title: "Expenses", body: "Record rent, salaries, packaging and delivery so profit is a real number." },
        { title: "Invoices", body: "Generate a clean, printable invoice from any order in two clicks." },
        { title: "Reports", body: "Sales, profit, top products and website performance — exportable to CSV." },
      ],
      strip: [
        { title: "One catalogue", body: "Add a product once — it appears on your website instantly." },
        { title: "One order list", body: "Website, WhatsApp and walk-in orders side by side." },
        { title: "One profit figure", body: "Sales minus cost of goods minus expenses. Calculated for you." },
      ],
    },

    templates: {
      eyebrow: "Templates",
      title: "Start from a design, not a blank page",
      body: "Each template arrives with pages, sections, fonts and colours already in place. Change what you like.",
      browseAll: "Browse all templates",
    },

    steps: {
      eyebrow: "How it works",
      title: "From first product to first order",
      items: [
        { n: "01", title: "Create your business", body: "Name it, tell us what you sell, and you are in. Takes about a minute." },
        { n: "02", title: "Add your products", body: "Name, price, photos, stock. Or import what you already have." },
        { n: "03", title: "Pick a template", body: "Eight designed templates for Sri Lankan businesses, or start from a blank page." },
        { n: "04", title: "Customise and publish", body: "Drag sections around, change the colours, hit Publish. You are live on a helabiz.lk address." },
      ],
    },

    pricing: {
      eyebrow: "Pricing",
      title: "Start free. Upgrade when it pays for itself.",
      body: "Prices in Sri Lankan Rupees. Cancel any time — your website stays published on the free plan.",
    },

    testimonials: {
      eyebrow: "Customers",
      title: "Shops already running on Helabiz",
      items: [
        {
          quote:
            "I was posting clothes on Instagram and losing track of who ordered what. Now customers order from my own site and everything lands in one place.",
          name: "Tharushi Silva",
          role: "Kavi Fashion, Colombo",
        },
        {
          quote:
            "The website took me one evening. My customers order cakes without messaging me at midnight, and I finally know what my profit is.",
          name: "Nimali Perera",
          role: "Sweet Crumb Bakery, Kandy",
        },
        {
          quote:
            "Stock used to be a guess. Now every website order reduces inventory and I get a warning before something runs out.",
          name: "Roshan Fernando",
          role: "TechPoint, Negombo",
        },
      ],
    },

    faq: {
      eyebrow: "FAQ",
      title: "Questions we get asked",
      body: "Still unsure? Create a free account — you can see the whole builder before you decide.",
      items: [
        {
          q: "Do I need to know how to build websites?",
          a: "No. You pick a template, drag sections into place and type over the text. Everything is edited visually — there is nothing to install and no code to write.",
        },
        {
          q: "What web address will my site have?",
          a: "Every business gets a free address like yourshop.helabiz.lk as soon as you publish. On the Business plan you can point your own domain at it.",
        },
        {
          q: "Do I have to add my products twice?",
          a: "Never. Products you add in the dashboard appear immediately in the website builder's product sections, and website orders flow back into your orders, customers and inventory.",
        },
        {
          q: "How do customers pay?",
          a: "Cash on delivery and bank transfer are ready now, which is how most Sri Lankan customers prefer to pay. The checkout is built so local card gateways can be added without changing your store.",
        },
        {
          q: "Can I try it before paying?",
          a: "Yes. The Free plan handles 20 orders and 50 products a month with a real published website, and it does not expire. Upgrade when you outgrow it.",
        },
        {
          q: "Does my website work on phones?",
          a: "Yes. Published sites are fully responsive, and you can preview and adjust the tablet and mobile layouts from inside the builder before publishing.",
        },
      ],
    },

    finalCta: {
      title: "I can build my business website myself.",
      body: "That is the whole idea. Create your account, pick a template and be online before the end of the day.",
      startFree: "Start free",
      seePricing: "See pricing",
    },
  },

  pricing: {
    metaTitle: "Pricing",
    metaDescription:
      "Simple pricing in Sri Lankan Rupees. Start free with a real published website, upgrade when your shop outgrows it.",
    eyebrow: "Pricing",
    title: "Priced for a Sri Lankan small business",
    lede: "Start free with a real, published website. Upgrade the month it starts paying for itself.",
    compare: "Compare the plans",
    feature: "Feature",
    popular: "Popular",
    rows: [
      { key: "ordersPerMonth", label: "Orders per month" },
      { key: "products", label: "Products" },
      { key: "websites", label: "Websites" },
      { key: "pages", label: "Website pages" },
      { key: "templates", label: "Templates" },
      { key: "teamMembers", label: "Staff accounts" },
      { key: "analytics", label: "Website analytics" },
      { key: "invoices", label: "Invoices" },
      { key: "whatsappTools", label: "WhatsApp tools" },
      { key: "removeBranding", label: "Remove Helabiz branding" },
      { key: "aiGenerator", label: "AI website generation" },
      { key: "customDomain", label: "Custom domain" },
    ],
    faqTitle: "Billing questions",
    faqs: [
      { q: "Can I change plan later?", a: "Yes — upgrade or downgrade at any time. Changes apply from your next billing period and nothing is lost when you move." },
      { q: "What happens if I go over the free plan limits?", a: "Your website stays online and existing orders are untouched. You will be asked to upgrade before adding beyond the limit." },
      { q: "How do I pay?", a: "Bank transfer today, with local card gateways being added. The billing system is built so a provider can be connected without any change to your store." },
      { q: "Is there a contract?", a: "No. Plans are monthly and you can cancel whenever you like. Your site falls back to the free plan rather than going offline." },
    ],
    cta: "Create your free account",
  },

  plans: {
    free: {
      name: "Free",
      tagline: "Get online this week",
      description: "Everything you need to test the waters and take your first online orders.",
      features: [
        "20 orders per month",
        "50 products",
        "Basic website builder",
        "2 starter templates",
        "Free helabiz.lk subdomain",
        "Orders, customers & inventory",
      ],
    },
    starter: {
      name: "Starter",
      tagline: "For a growing shop",
      description: "The full website builder plus the day-to-day tools that keep a busy shop organised.",
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
      name: "Business",
      tagline: "For established businesses",
      description: "Advanced analytics, AI website generation and a team that can work together.",
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
  },

  planCard: {
    mostPopular: "Most popular",
    free: "Free",
    perMonth: "/month",
    currentPlan: "Current plan",
    startFree: "Start free",
    choose: "Choose {plan}",
  },

  limits: { unlimited: "Unlimited" },

  templatesPage: {
    metaTitle: "Website templates",
    metaDescription:
      "Eight designed website templates for Sri Lankan businesses — fashion, bakery, restaurant, beauty, electronics, photography and services.",
    eyebrow: "Templates",
    title: "Start from a design, not a blank page",
    lede: "Every template arrives with its pages, sections, fonts and colours already set. Swap in your products and your words — change anything you like. Two are free forever; the rest come with any paid plan, and you can preview all of them before you decide.",
    startFree: "Start free",
    seePricing: "See pricing",
    viewTemplate: "View template",
    useTemplate: "Use this template",
    unlock: "Unlock with Starter",
    free: "Free",
    blankTitle: "Or start from a blank page",
    blankBody:
      "Templates are a starting point, never a cage. Every section can be moved, edited, restyled or removed — and you can add any of the 40+ sections to any page.",
    blankCta: "Start building",
  },
};

const SI: MarketingCopy = {
  nav: {
    links: [
      { href: "/#website-builder", label: "වෙබ් අඩවි නිර්මාණකරු" },
      { href: "/#business", label: "ව්‍යාපාර මෙවලම්" },
      { href: "/templates", label: "Template" },
      { href: "/pricing", label: "මිල ගණන්" },
      { href: "/#faq", label: "ප්‍රශ්න" },
    ],
    signIn: "පිවිසෙන්න",
    startFree: "නොමිලේ පටන් ගන්න",
    openMenu: "මෙනුව විවෘත කරන්න",
    closeMenu: "මෙනුව වහන්න",
  },

  footer: {
    blurb:
      "ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම හදපු platform එකක්. ඔබේ ව්‍යාපාරය කළමනාකරණය කරන්නත්, වෙබ් අඩවිය හදන්නත් එකම තැනකින්.",
    columns: [
      {
        title: "නිෂ්පාදනය",
        links: [
          { href: "/#website-builder", label: "වෙබ් අඩවි නිර්මාණකරු" },
          { href: "/#business", label: "ව්‍යාපාර කළමනාකරණය" },
          { href: "/templates", label: "Template" },
          { href: "/pricing", label: "මිල ගණන්" },
        ],
      },
      {
        title: "කාටද",
        links: [
          { href: "/templates?category=Fashion", label: "ඇඳුම් සාප්පු" },
          { href: "/templates?category=Bakery", label: "බේකරි" },
          { href: "/templates?category=Beauty", label: "සැලූන් සහ රූපලාවන්‍ය" },
          { href: "/templates?category=Restaurant", label: "අවන්හල්" },
        ],
      },
      {
        title: "සමාගම",
        links: [
          { href: "/#faq", label: "ප්‍රශ්න" },
          { href: "/sign-up", label: "නොමිලේ පටන් ගන්න" },
          { href: "/sign-in", label: "පිවිසෙන්න" },
        ],
      },
    ],
    madeIn: "ශ්‍රී ලංකාවේ හදපු.",
    currency: "මිල ගණන් ශ්‍රී ලංකා රුපියල් (LKR) වලින්.",
  },

  home: {
    metaTitle: "Helabiz — ඔබේ ව්‍යාපාරය. ඔබේ වෙබ් අඩවිය.",
    metaDescription:
      "භාණ්ඩ, order, ගනුදෙනුකරුවෝ සහ ලාභය කළමනාකරණය කරන්න — ඒ එක්කම කේත ලියන්නේ නැතිව ඔබේම වෙබ් අඩවියක් හදාගන්න. ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම.",
    badge: "ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම",
    headline: ["ඔබේ ව්‍යාපාරය.", "ඔබේ වෙබ් අඩවිය.", "එකම සරල platform එකක්."],
    lede:
      "භාණ්ඩ, order, ගනුදෙනුකරුවෝ සහ ලාභය කළමනාකරණය කරන්න — ඒ එක්කම කේත ලියන්නේ නැතිව ඔබේම වෘත්තීය වෙබ් අඩවියක් හදාගන්න.",
    startFree: "නොමිලේ පටන් ගන්න",
    createWebsite: "වෙබ් අඩවියක් හදන්න",
    reassurance: "සදාකාලිකව නොමිලේ plan එකක් · Card එකක් ඕන නෑ · පැයකට අඩුවෙන් online",

    problem: {
      eyebrow: "ප්‍රශ්නය",
      title: "Chat එකෙන් විකුණන එක එක තැනකින් නවතිනවා",
      body: "පටන් ගන්න හොඳයි, ඒත් ලොකු වෙනකොට එහෙම යන්නේ නෑ. දහවෙනි order එකයි සියයවෙනි order එකයි අතරදී message ටික ජය ගන්නවා.",
      items: [
        {
          title: "Chat අස්සේ නැති වෙන order",
          body: "WhatsApp, Instagram, Facebook හරහා order එනවා, ඊට පස්සේ message ගොඩක් අස්සේ නැති වෙනවා.",
        },
        {
          title: "පොතක ලියපු ගිණුම්",
          body: "විකුණුම්, වියදම් සහ පිරිවැය තැන් තුනක තියෙන නිසා ලාභය කීයද කියලා අනුමාන කරන්න වෙනවා.",
        },
        {
          title: "හරි වෙබ් අඩවියක් නෑ",
          body: "“Link එකක් එවන්න” කිව්වම එවන්නේ photo album එකක්. Developer කෙනෙක්ගේ මිල රු. 80,000 ඉඳන් පටන් ගන්නවා.",
        },
      ],
    },

    solution: {
      eyebrow: "විසඳුම",
      title: "එකම platform එකක්, එකිනෙකා එක්ක කතා කරන කොටස් දෙකක්",
      body: "ගනුදෙනුකරුවෝ order කරන වෙබ් අඩවියක්, ඒ පිටිපස්සේ ව්‍යාපාරය පිළිවෙළට තියාගන්න dashboard එකක්. එකම භාණ්ඩ, එකම ගනුදෙනුකරුවෝ, එකම අංක.",
      front: {
        kicker: "ඉස්සරහ පැත්ත",
        title: "වෘත්තීය වෙබ් අඩවියක්",
        body: "Drag & drop පිටු, ඇත්ත භාණ්ඩ ලැයිස්තු, cart එකක් සහ ශ්‍රී ලාංකිකයන්ට ගැලපෙන checkout එකක් — ඔබේම ලිපිනයකට publish කරනවා.",
        points: ["Drag & drop නිර්මාණකරු", "Template 8ක්", "Cart සහ checkout", "SEO සහ sitemap"],
      },
      back: {
        kicker: "පිටිපස්ස පැත්ත",
        title: "තමන්ම දුවන ව්‍යාපාරයක්",
        body: "Order එකම ලැයිස්තුවකට එනවා, stock ඉබේම වෙනස් වෙනවා, ගනුදෙනුකරුවන්ගේ ඉතිහාසයක් හැදෙනවා, ලාභය ඔබ වෙනුවෙන් ගණනය වෙනවා.",
        points: ["Order සහ stock", "ගනුදෙනුකරුවෝ සහ වියදම්", "Invoice සහ වාර්තා", "WhatsApp පණිවුඩ"],
      },
      learnMore: "තව දැනගන්න",
    },

    builder: {
      eyebrow: "වෙබ් අඩවි නිර්මාණකරු",
      title: "ඔබ හිතන විදිහටම හදන්න",
      body: "වෙබ් අඩවියේ හැම දෙයක්ම section එකක්. එකක් අරගෙන, ඕන තැනට දාලා, එතනම edit කරන්න.",
      steps: [
        { label: "අදින්න", body: "Layout, content, marketing, media සහ commerce යටතේ section 40කට වැඩියෙන් තෝරගන්න." },
        { label: "දාන්න", body: "අත ඇරලා දාන්න කලින්ම, section එක වැටෙන්නේ කොහෙද කියලා පැහැදිලි ඉරකින් පේනවා." },
        { label: "වෙනස් කරන්න", body: "අකුරු, පාට, ඉඩ, පින්තූර සහ layout එක settings panel එකෙන් වෙනස් කරන්න." },
        { label: "Publish කරන්න", body: "Publish කරන තුරු ඔබේ draft එක ඔබට විතරයි. Publish කළාම ලෝකෙටම පේනවා." },
      ],
      features: [
        { title: "Drag සහ drop", body: "Section එකක් අරගෙන ඕන තැනට දාන්න. කේත නෑ, theme file නෑ." },
        { title: "ඕන දෙයක් වෙනස් කරන්න", body: "පාට, අකුරු, ඉඩ, පින්තූර සහ button — හැම section එකකටම ඇත්ත settings තියෙනවා." },
        { title: "Phone එකට සූදානම්", body: "Desktop, tablet සහ phone එකට එකම switch එකකින් හදන්න. Publish වෙන අඩවි responsive." },
        { title: "ඔබේම ඇත්ත භාණ්ඩ", body: "භාණ්ඩ section කෙළින්ම ඔබේ catalogue එකෙන් කියවනවා. භාණ්ඩයක් එක පාරයි එකතු කරන්නේ." },
      ],
      sectionsIncluded: "ඇතුළත් section",
      sections: [
        "Hero", "පින්තූර gallery", "පින්තූර slider", "භාණ්ඩ grid", "විශේෂ භාණ්ඩය", "ගනුදෙනුකරු අදහස්",
        "Call to action", "විශේෂාංග", "සංඛ්‍යා ලේඛන", "ප්‍රශ්න", "මිල කාඩ්", "අප ගැන", "සේවා",
        "කණ්ඩායම", "සම්බන්ධ වීම", "විවෘත වේලාවන්", "පිහිටීම", "සමාජ මාධ්‍ය", "Announcement bar",
        "Video", "තීරු", "Rich text", "කාණ්ඩ", "Footer",
      ],
    },

    business: {
      eyebrow: "ව්‍යාපාර කළමනාකරණය",
      title: "ගනුදෙනුකරුවන්ට කවදාවත් නොපෙනෙන කොටස",
      body: "වෙබ් අඩවියෙන් එන හැම order එකක්ම ඇත්ත order එකක්, ඇත්ත ගනුදෙනුකරුවෙක් සහ ඇත්ත stock වෙනසක් වෙනවා — ඉබේම.",
      features: [
        { title: "Order", body: "Website සහ අතින් දාපු හැම order එකක්ම එකම ලැයිස්තුවක, status සහ WhatsApp පිළිතුරු එක්ක." },
        { title: "තොග", body: "Order එකක් ආපු ගමන් stock එක ඉබේම අඩු වෙනවා, පරීක්ෂා කරන්න පුළුවන් සටහනක් එක්ක." },
        { title: "ගනුදෙනුකරුවෝ", body: "වෙබ් අඩවියෙන් ගන්න අය, ඔවුන්ගේ order ඉතිහාසය සහ වියදම එක්ක ලැයිස්තුවට එනවා." },
        { title: "වියදම්", body: "කුලී, පඩි, ඇසුරුම් සහ delivery සටහන් කරන්න — එතකොට ලාභය ඇත්ත අංකයක්." },
        { title: "Invoice", body: "ඕනෑම order එකකින් පිරිසිදු, print කරන්න පුළුවන් invoice එකක් click දෙකකින්." },
        { title: "වාර්තා", body: "විකුණුම්, ලාභය, හොඳම භාණ්ඩ සහ වෙබ් අඩවියේ තත්ත්වය — CSV එකට export කරන්න පුළුවන්." },
      ],
      strip: [
        { title: "එකම catalogue එකක්", body: "භාණ්ඩයක් එක පාරයි එකතු කරන්නේ — වහාම වෙබ් අඩවියේ පේනවා." },
        { title: "එකම order ලැයිස්තුවක්", body: "Website, WhatsApp සහ walk-in order එකට එකක් ළඟ." },
        { title: "එකම ලාභ අංකයක්", body: "විකුණුම් - භාණ්ඩ පිරිවැය - වියදම්. ඔබ වෙනුවෙන් ගණනය කරනවා." },
      ],
    },

    templates: {
      eyebrow: "Template",
      title: "හිස් පිටුවකින් නෙවෙයි, හදපු design එකකින් පටන් ගන්න",
      body: "හැම template එකක්ම පිටු, section, අකුරු සහ පාට එක්කම එනවා. ඕන දෙයක් වෙනස් කරන්න.",
      browseAll: "හැම template එකක්ම බලන්න",
    },

    steps: {
      eyebrow: "වැඩ කරන විදිහ",
      title: "පළමු භාණ්ඩයේ ඉඳන් පළමු order එක දක්වා",
      items: [
        { n: "01", title: "ව්‍යාපාරය හදන්න", body: "නමක් දෙන්න, විකුණන්නේ මොනවද කියන්න, ඉවරයි. විනාඩියක් විතර යනවා." },
        { n: "02", title: "භාණ්ඩ එකතු කරන්න", body: "නම, මිල, පින්තූර, stock. නැත්නම් දැනට තියෙන ඒවා import කරන්න." },
        { n: "03", title: "Template එකක් තෝරන්න", body: "ශ්‍රී ලාංකික ව්‍යාපාර සඳහා හදපු template 8ක්, නැත්නම් හිස් පිටුවකින් පටන් ගන්න." },
        { n: "04", title: "වෙනස් කරලා publish කරන්න", body: "Section අදින්න, පාට වෙනස් කරන්න, Publish කරන්න. ඔබ helabiz.lk ලිපිනයක online." },
      ],
    },

    pricing: {
      eyebrow: "මිල ගණන්",
      title: "නොමිලේ පටන් ගන්න. ගෙවන්න වටින දවසේ upgrade කරන්න.",
      body: "මිල ශ්‍රී ලංකා රුපියල් වලින්. ඕන වෙලාවක නවත්තන්න පුළුවන් — නොමිලේ plan එකේ ඔබේ වෙබ් අඩවිය publish වෙලාම තියෙනවා.",
    },

    testimonials: {
      eyebrow: "ගනුදෙනුකරුවෝ",
      title: "දැනටමත් Helabiz පාවිච්චි කරන සාප්පු",
      items: [
        {
          quote:
            "මම Instagram එකේ ඇඳුම් දාලා, කවුද මොනවද order කළේ කියලා අමතක වෙනවා. දැන් ගනුදෙනුකරුවෝ මගේම අඩවියෙන් order කරනවා, හැම දෙයක්ම එකම තැනකට එනවා.",
          name: "තරුෂි සිල්වා",
          role: "Kavi Fashion, කොළඹ",
        },
        {
          quote:
            "වෙබ් අඩවිය හදන්න ගියේ එක සැන්දෑවක්. දැන් ගනුදෙනුකරුවෝ මැදියම් රෑ මට message කරන්නේ නැතුව cake order කරනවා, ලාභය කීයද කියලත් දැන් මම දන්නවා.",
          name: "නිමාලි පෙරේරා",
          role: "Sweet Crumb Bakery, මහනුවර",
        },
        {
          quote:
            "Stock කියන්නේ කලින් අනුමානයක්. දැන් හැම website order එකකින්ම තොගය අඩු වෙනවා, ඉවර වෙන්න කලින් මට දැනුම් දෙනවා.",
          name: "රොෂාන් ප්‍රනාන්දු",
          role: "TechPoint, මීගමුව",
        },
      ],
    },

    faq: {
      eyebrow: "ප්‍රශ්න",
      title: "අපෙන් නිතර අහන ප්‍රශ්න",
      body: "තාම විශ්වාස නෑද? නොමිලේ account එකක් හදන්න — තීරණය කරන්න කලින් මුළු builder එකම බලන්න පුළුවන්.",
      items: [
        {
          q: "වෙබ් අඩවි හදන්න දැනගෙන ඉන්න ඕනද?",
          a: "නෑ. Template එකක් තෝරලා, section අදිනවා, අකුරු මත type කරනවා. හැම දෙයක්ම ඇහැට පේන විදිහට edit කරනවා — install කරන්න දෙයක් නෑ, කේත ලියන්න දෙයක් නෑ.",
        },
        {
          q: "මගේ අඩවියට ලැබෙන්නේ මොන ලිපිනයද?",
          a: "Publish කරපු ගමන් හැම ව්‍යාපාරයකටම yourshop.helabiz.lk වගේ ලිපිනයක් නොමිලේ ලැබෙනවා. Business plan එකේදී ඔබේම domain එකක් ඒකට යොමු කරන්න පුළුවන්.",
        },
        {
          q: "භාණ්ඩ දෙපාරක් එකතු කරන්න ඕනද?",
          a: "කවදාවත් නෑ. Dashboard එකේ එකතු කරන භාණ්ඩ වහාම වෙබ් අඩවි නිර්මාණකරුගේ භාණ්ඩ section වල පේනවා, website order ආපහු ඔබේ order, ගනුදෙනුකරුවෝ සහ stock වලට එනවා.",
        },
        {
          q: "ගනුදෙනුකරුවෝ ගෙවන්නේ කොහොමද?",
          a: "Cash on delivery සහ bank transfer දැන් සූදානම් — ශ්‍රී ලාංකික ගනුදෙනුකරුවෝ ගොඩක් දෙනෙක් කැමති ඒවාට. Checkout එක හදලා තියෙන්නේ, ඔබේ සාප්පුව වෙනස් නොකර local card gateway එකතු කරන්න පුළුවන් විදිහට.",
        },
        {
          q: "ගෙවන්න කලින් බලන්න පුළුවන්ද?",
          a: "ඔව්. නොමිලේ plan එකෙන් මාසෙකට order 20ක් සහ භාණ්ඩ 50ක් සමඟ ඇත්ත publish වුණු වෙබ් අඩවියක් ලැබෙනවා, ඒක කල් ඉකුත් වෙන්නේ නෑ. ලොකු වුණාම upgrade කරන්න.",
        },
        {
          q: "මගේ වෙබ් අඩවිය phone එකේ හරියට වැඩ කරනවද?",
          a: "ඔව්. Publish වෙන අඩවි සම්පූර්ණයෙන්ම responsive, publish කරන්න කලින් builder එක ඇතුළේම tablet සහ phone layout බලලා හදාගන්න පුළුවන්.",
        },
      ],
    },

    finalCta: {
      title: "මගේ ව්‍යාපාරයේ වෙබ් අඩවිය මටම හදාගන්න පුළුවන්.",
      body: "ඒකමයි අපේ අදහසත්. Account එකක් හදලා, template එකක් තෝරලා, අද දවස ඉවර වෙන්න කලින් online වෙන්න.",
      startFree: "නොමිලේ පටන් ගන්න",
      seePricing: "මිල ගණන් බලන්න",
    },
  },

  pricing: {
    metaTitle: "මිල ගණන්",
    metaDescription:
      "ශ්‍රී ලංකා රුපියල් වලින් සරල මිල ගණන්. ඇත්ත publish වුණු වෙබ් අඩවියක් එක්ක නොමිලේ පටන් ගන්න, සාප්පුව ලොකු වුණාම upgrade කරන්න.",
    eyebrow: "මිල ගණන්",
    title: "ශ්‍රී ලාංකික කුඩා ව්‍යාපාරයකට ගැලපෙන මිලක්",
    lede: "ඇත්ත, publish වුණු වෙබ් අඩවියක් එක්ක නොමිලේ පටන් ගන්න. ගෙවන එක වටින්න පටන් ගන්න මාසේ upgrade කරන්න.",
    compare: "Plan සංසන්දනය",
    feature: "විශේෂාංගය",
    popular: "ජනප්‍රියයි",
    rows: [
      { key: "ordersPerMonth", label: "මාසෙකට order" },
      { key: "products", label: "භාණ්ඩ" },
      { key: "websites", label: "වෙබ් අඩවි" },
      { key: "pages", label: "වෙබ් පිටු" },
      { key: "templates", label: "Template" },
      { key: "teamMembers", label: "සේවක ගිණුම්" },
      { key: "analytics", label: "වෙබ් අඩවි analytics" },
      { key: "invoices", label: "Invoice" },
      { key: "whatsappTools", label: "WhatsApp මෙවලම්" },
      { key: "removeBranding", label: "Helabiz නම ඉවත් කිරීම" },
      { key: "aiGenerator", label: "AI වෙබ් අඩවි නිර්මාණය" },
      { key: "customDomain", label: "ඔබේම domain එකක්" },
    ],
    faqTitle: "ගෙවීම් ගැන ප්‍රශ්න",
    faqs: [
      { q: "පස්සේ plan එක වෙනස් කරන්න පුළුවන්ද?", a: "ඔව් — ඕන වෙලාවක ඉහළට හෝ පහළට යන්න පුළුවන්. වෙනස්කම් ඊළඟ ගෙවීම් කාලයේ ඉඳන් බලපානවා, මාරු වෙනකොට කිසිම දෙයක් නැති වෙන්නේ නෑ." },
      { q: "නොමිලේ plan එකේ සීමාව ඉක්මවුවොත් මොකද වෙන්නේ?", a: "ඔබේ වෙබ් අඩවිය online තියෙනවා, දැනට තියෙන order වලට කිසි දෙයක් වෙන්නේ නෑ. සීමාවෙන් එහාට එකතු කරන්න කලින් upgrade කරන්න කියලා අහනවා." },
      { q: "මම ගෙවන්නේ කොහොමද?", a: "දැනට bank transfer, local card gateway එකතු කරමින් තියෙනවා. ඔබේ සාප්පුවට කිසිම වෙනසක් නොකර provider කෙනෙක් සම්බන්ධ කරන්න පුළුවන් විදිහට billing එක හදලා තියෙන්නේ." },
      { q: "ගිවිසුමක් තියෙනවද?", a: "නෑ. Plan මාසිකයි, ඕන වෙලාවක නවත්තන්න පුළුවන්. ඔබේ අඩවිය offline යනවා වෙනුවට නොමිලේ plan එකට වැටෙනවා." },
    ],
    cta: "නොමිලේ account එකක් හදන්න",
  },

  plans: {
    free: {
      name: "නොමිලේ",
      tagline: "මේ සතියේම online වෙන්න",
      description: "පොඩ්ඩක් බලන්නත්, පළමු online order ටික ගන්නත් ඕන හැම දෙයක්ම.",
      features: [
        "මාසෙකට order 20ක්",
        "භාණ්ඩ 50ක්",
        "මූලික වෙබ් අඩවි නිර්මාණකරු",
        "පටන් ගන්න template 2ක්",
        "නොමිලේ helabiz.lk ලිපිනයක්",
        "Order, ගනුදෙනුකරුවෝ සහ තොග",
      ],
    },
    starter: {
      name: "Starter",
      tagline: "වැඩෙන සාප්පුවකට",
      description: "සම්පූර්ණ වෙබ් අඩවි නිර්මාණකරුත්, කාර්යබහුල සාප්පුවක් පිළිවෙළට තියාගන්න දෛනික මෙවලමුත්.",
      features: [
        "සීමාවක් නැති order",
        "භාණ්ඩ 500ක්",
        "සම්පූර්ණ වෙබ් අඩවි නිර්මාණකරු",
        "හැම template එකක්ම සහ theme එකක්ම",
        "සීමාවක් නැති පිටු",
        "වෙබ් අඩවි analytics",
        "වෘත්තීය invoice",
        "WhatsApp order මෙවලම්",
        "Helabiz නම නෑ",
      ],
    },
    business: {
      name: "Business",
      tagline: "ස්ථාවර ව්‍යාපාර සඳහා",
      description: "දියුණු analytics, AI වෙබ් අඩවි නිර්මාණය සහ එකට වැඩ කරන්න පුළුවන් කණ්ඩායමක්.",
      features: [
        "Starter එකේ හැම දෙයක්ම",
        "සීමාවක් නැති භාණ්ඩ",
        "දියුණු analytics සහ වාර්තා",
        "AI වෙබ් අඩවි නිර්මාණය",
        "ඔබේම domain එකක්",
        "සේවක ගිණුම් 10ක් දක්වා",
        "වෙබ් අඩවි කිහිපයක්",
        "ප්‍රමුඛතා සහාය",
      ],
    },
  },

  planCard: {
    mostPopular: "වැඩියෙන්ම ජනප්‍රිය",
    free: "නොමිලේ",
    perMonth: "/මාසෙට",
    currentPlan: "දැන් තියෙන plan එක",
    startFree: "නොමිලේ පටන් ගන්න",
    choose: "{plan} තෝරන්න",
  },

  limits: { unlimited: "සීමාවක් නෑ" },

  templatesPage: {
    metaTitle: "වෙබ් අඩවි template",
    metaDescription:
      "ශ්‍රී ලාංකික ව්‍යාපාර සඳහා හදපු වෙබ් අඩවි template 8ක් — ඇඳුම්, බේකරි, අවන්හල්, රූපලාවන්‍ය, ඉලෙක්ට්‍රොනික, ඡායාරූප සහ සේවා.",
    eyebrow: "Template",
    title: "හිස් පිටුවකින් නෙවෙයි, හදපු design එකකින් පටන් ගන්න",
    lede: "හැම template එකක්ම පිටු, section, අකුරු සහ පාට එක්කම එනවා. ඔබේ භාණ්ඩ සහ ඔබේ වචන දාන්න — ඕන දෙයක් වෙනස් කරන්න පුළුවන්. දෙකක් සදාකාලිකව නොමිලේ; ඉතුරු ඒවා ඕනෑම ගෙවන plan එකක් එක්ක එනවා, තීරණය කරන්න කලින් ඔක්කොම බලන්නත් පුළුවන්.",
    startFree: "නොමිලේ පටන් ගන්න",
    seePricing: "මිල ගණන් බලන්න",
    viewTemplate: "Template එක බලන්න",
    useTemplate: "මේක පාවිච්චි කරන්න",
    unlock: "Starter එකෙන් ලබාගන්න",
    free: "නොමිලේ",
    blankTitle: "නැත්නම් හිස් පිටුවකින් පටන් ගන්න",
    blankBody:
      "Template කියන්නේ පටන් ගන්න තැනක් විතරයි, කූඩුවක් නෙවෙයි. හැම section එකක්ම මාරු කරන්න, edit කරන්න, පාට වෙනස් කරන්න, අයින් කරන්න පුළුවන් — section 40කට වැඩියෙන් ඕන පිටුවකට එකතු කරන්නත් පුළුවන්.",
    blankCta: "හදන්න පටන් ගන්න",
  },
};

const COPY: Record<Lang, MarketingCopy> = { si: SI, en: EN };

export function marketingCopy(lang: Lang) {
  return COPY[lang];
}

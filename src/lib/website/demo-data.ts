import type { SectionNode } from "@/types";
import { artFor, PEOPLE_ART, scenesFor } from "./template-art";
import type { SiteContext, PublicCategory, PublicProduct, SiteBusiness } from "./render-types";
import type { Template } from "./templates";
import { normalizeTheme } from "./themes";

/**
 * Stand-in catalogue for template previews.
 *
 * A template's product sections read from a real business's catalogue. On the
 * public marketing site there is no business, so previews are rendered against
 * this in-memory data instead — nothing here touches the database, which keeps
 * `/templates/[id]` cheap enough to serve to anonymous visitors.
 */
type DemoSet = {
  business: string;
  tagline: string;
  city: string;
  categories: string[];
  products: { name: string; price: number; was?: number; blurb: string }[];
};

/** Keyed by template category, so each preview shows plausible stock. */
const SETS: Record<string, DemoSet> = {
  Fashion: {
    business: "Kavi Fashion",
    tagline: "Modern casual clothing, made in Colombo.",
    city: "Colombo 04",
    categories: ["Dresses", "Tops", "Accessories"],
    products: [
      { name: "Linen Wrap Dress", price: 8900, blurb: "Breathable linen for Colombo heat" },
      { name: "Oversized Cotton Tee", price: 4500, was: 6000, blurb: "Heavyweight cotton, relaxed fit" },
      { name: "Batik Midi Dress", price: 11500, blurb: "Hand-blocked batik, made in Kandy" },
      { name: "Canvas Tote Bag", price: 2200, blurb: "Sturdy canvas with an inner pocket" },
      { name: "Ribbed Knit Top", price: 3800, blurb: "Soft stretch rib, everyday fit" },
      { name: "Wide Leg Trousers", price: 7200, blurb: "High waist, flowing silhouette" },
      { name: "Silk Scarf", price: 3400, blurb: "Lightweight silk, hand-rolled edges" },
      { name: "Cotton Shirt Dress", price: 9600, was: 11000, blurb: "Crisp poplin with a tie belt" },
    ],
  },
  Bakery: {
    business: "Sweet Crumb Bakery",
    tagline: "Baked fresh every morning in Kandy.",
    city: "Kandy",
    categories: ["Cakes", "Short eats", "Bread"],
    products: [
      { name: "Butter Cake", price: 1800, blurb: "Real butter, baked this morning" },
      { name: "Chocolate Gateau", price: 4500, blurb: "Rich and fudgy, serves eight" },
      { name: "Fish Bun (6 pack)", price: 900, blurb: "Still warm when it reaches you" },
      { name: "Seeni Sambol Bun", price: 150, blurb: "Sweet, spicy, made daily" },
      { name: "Milk Toffee Box", price: 1200, blurb: "Traditional recipe, 20 pieces" },
      { name: "Birthday Cake", price: 6500, blurb: "Made to order for your day" },
      { name: "Sourdough Loaf", price: 950, blurb: "Slow fermented over two days" },
      { name: "Party Box", price: 2800, blurb: "Short eats for twelve people" },
    ],
  },
  Restaurant: {
    business: "Spice Garden",
    tagline: "Sri Lankan food, cooked properly.",
    city: "Colombo 07",
    categories: ["Rice & curry", "Kottu", "Drinks"],
    products: [
      { name: "Rice and Curry", price: 750, blurb: "Five curries, papadam and sambol" },
      { name: "Chicken Kottu", price: 950, blurb: "Cooked to order on the griddle" },
      { name: "Devilled Prawns", price: 1650, blurb: "Hot, sweet and properly spicy" },
      { name: "String Hoppers (10)", price: 450, blurb: "With kiri hodi and pol sambol" },
      { name: "Lamprais", price: 1250, blurb: "Wrapped and baked in banana leaf" },
      { name: "Watalappan", price: 400, blurb: "Jaggery, coconut milk, cardamom" },
      { name: "Faluda", price: 550, blurb: "Rose syrup, basil seed, ice cream" },
      { name: "Plain Tea", price: 120, blurb: "Ceylon black, properly brewed" },
    ],
  },
  Beauty: {
    business: "Petal Studio",
    tagline: "A quiet salon in Colombo 05, by appointment.",
    city: "Colombo 05",
    categories: ["Hair", "Skin", "Nails"],
    products: [
      { name: "Signature Facial", price: 6500, blurb: "75 minutes, tailored to your skin" },
      { name: "Hair Colour", price: 8500, blurb: "Ammonia free, consultation included" },
      { name: "Bridal Package", price: 35000, blurb: "Trial, day-of hair and makeup" },
      { name: "Gel Manicure", price: 3200, blurb: "Lasts three weeks, chip free" },
      { name: "Hydrating Serum", price: 4800, was: 5600, blurb: "For dry and dull skin" },
      { name: "Scalp Treatment", price: 4200, blurb: "For flaking and irritation" },
      { name: "Threading", price: 800, blurb: "Brows shaped in ten minutes" },
      { name: "Gift Voucher", price: 5000, blurb: "Let them choose their own" },
    ],
  },
  Electronics: {
    business: "TechPoint",
    tagline: "Genuine stock with a real local warranty.",
    city: "Negombo",
    categories: ["Laptops", "Phones", "Accessories"],
    products: [
      { name: "Wireless Earbuds", price: 12500, was: 15900, blurb: "Noise cancelling, 28h battery" },
      { name: "USB-C Charger 65W", price: 6800, blurb: "Charges a laptop and a phone" },
      { name: "Mechanical Keyboard", price: 18500, blurb: "Hot-swap switches, backlit" },
      { name: "Power Bank 20000mAh", price: 9200, blurb: "Two devices at once" },
      { name: "1080p Webcam", price: 8900, blurb: "Autofocus with a built-in mic" },
      { name: "Laptop Sleeve 14\"", price: 3400, blurb: "Padded, water resistant" },
      { name: "Bluetooth Speaker", price: 14500, blurb: "IPX7, twelve hours of play" },
      { name: "SSD 1TB", price: 27500, blurb: "Read speeds up to 3500MB/s" },
    ],
  },
  Photography: {
    business: "Frame Studio",
    tagline: "Weddings, portraits and editorial work.",
    city: "Colombo",
    categories: ["Weddings", "Portraits", "Prints"],
    products: [
      { name: "Portrait Session", price: 18000, blurb: "One hour, 20 edited photographs" },
      { name: "Wedding — Full Day", price: 165000, blurb: "Two photographers, album included" },
      { name: "Engagement Shoot", price: 32000, blurb: "Two locations, 40 photographs" },
      { name: "Product Photography", price: 24000, blurb: "Ten products, white background" },
      { name: "Fine Art Print A3", price: 6500, blurb: "Archival paper, signed" },
      { name: "Photo Album", price: 28000, blurb: "Lay-flat, 40 pages" },
      { name: "Event Coverage", price: 45000, blurb: "Four hours, same-week delivery" },
      { name: "Digital Gallery", price: 8000, blurb: "Private online gallery for a year" },
    ],
  },
  Services: {
    business: "Meridian Services",
    tagline: "Fifteen years of doing things properly.",
    city: "Gampaha",
    categories: ["Installation", "Repairs", "Maintenance"],
    products: [
      { name: "Site Visit & Quote", price: 2500, blurb: "Written quote within 24 hours" },
      { name: "AC Installation", price: 18500, blurb: "Including brackets and piping" },
      { name: "Annual Service Plan", price: 24000, blurb: "Four visits across the year" },
      { name: "Emergency Callout", price: 6500, blurb: "Same day where we can" },
      { name: "Electrical Rewiring", price: 55000, blurb: "Certified, per average home" },
      { name: "Plumbing Repair", price: 4500, blurb: "Charged per hour on site" },
      { name: "Deep Clean", price: 12500, blurb: "Full property, team of three" },
      { name: "Maintenance Retainer", price: 35000, blurb: "Priority booking, monthly" },
    ],
  },
  "Home Business": {
    business: "Small Batch",
    tagline: "Handmade at home in Gampaha.",
    city: "Gampaha",
    categories: ["Candles", "Soap", "Gifts"],
    products: [
      { name: "Soy Candle", price: 2400, blurb: "Forty hours of burn time" },
      { name: "Coconut Soap", price: 650, blurb: "Cold pressed, no palm oil" },
      { name: "Gift Hamper", price: 6800, blurb: "Wrapped and ready to give" },
      { name: "Reed Diffuser", price: 3200, blurb: "Lasts about three months" },
      { name: "Lip Balm", price: 450, blurb: "Beeswax and shea butter" },
      { name: "Wax Melts", price: 1200, blurb: "Six cubes, two scents" },
      { name: "Body Scrub", price: 1900, blurb: "Coffee and coconut oil" },
      { name: "Starter Set", price: 4500, was: 5400, blurb: "Candle, soap and balm" },
    ],
  },
};

const FALLBACK = SETS.Fashion;

function demoId(prefix: string, index: number) {
  // Stable, ObjectId-shaped ids: some sections key off them, and a stable value
  // keeps server and client markup identical.
  return `${prefix}${String(index).padStart(24 - prefix.length, "0")}`;
}

export function demoCatalogue(category: string) {
  const set = SETS[category] ?? FALLBACK;
  const pool = artFor(category);

  const categories: PublicCategory[] = set.categories.map((name, index) => ({
    id: demoId("cat", index + 1),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    image: pool[index % pool.length],
  }));

  const products: PublicProduct[] = set.products.map((product, index) => ({
    id: demoId("prd", index + 1),
    name: product.name,
    slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    price: product.price,
    compareAtPrice: product.was,
    images: [pool[index % pool.length]],
    stock: 12 + index,
    trackInventory: true,
    categoryId: categories[index % categories.length]?.id,
    featured: index < 4,
    sold: 40 - index * 3,
    createdAt: new Date(2026, 0, 28 - index).toISOString(),
    shortDescription: product.blurb,
    description: `${product.blurb}.\n\nThis is sample content shown in the template preview. When you use this template your own products appear here instead.`,
    variants: [],
  }));

  const business: SiteBusiness = {
    id: demoId("biz", 1),
    name: set.business,
    phone: "077 123 4567",
    whatsapp: "077 123 4567",
    email: `hello@${set.business.toLowerCase().replace(/[^a-z0-9]+/g, "")}.lk`,
    address: "128 Galle Road",
    city: set.city,
    district: "Colombo",
    description: set.tagline,
    deliveryFee: 350,
    freeDeliveryOver: 10000,
    social: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
    },
  };

  return { business, products, categories };
}

/** Builds the render context for a template preview. */
export function demoSiteContext(template: Template): SiteContext {
  const { business, products, categories } = demoCatalogue(template.category);

  return {
    theme: normalizeTheme(template.theme),
    business,
    products,
    categories,
    pages: template.pages.map((page) => ({
      title: page.title,
      slug: page.slug,
      isHome: Boolean(page.isHome),
    })),
    navigation: template.pages
      .filter((page) => !page.isHome)
      .map((page) => ({ id: page.slug, label: page.title, href: `/${page.slug}` })),
    settings: {
      showCart: true,
      allowCheckout: false,
      whatsappOrdering: true,
    },
    basePath: "",
    // Links stay inert: this is a showcase, not a working shop.
    editor: true,
    viewport: "desktop",
  };
}

const isPlaceholder = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("/placeholders/");

/**
 * Re-points a template's own artwork at the preview's category.
 *
 * Templates ship with neutral placeholders, which is right for someone who is
 * about to replace them with their own photographs. A preview is doing the
 * opposite job — it has to look like a finished bakery — so every
 * `/placeholders/…` reference is swapped for the next picture in that
 * category's pool. Nothing here touches the stored template, so a business
 * that uses it still starts from the neutral artwork.
 *
 * Full-bleed slots get a patterned backdrop rather than a picture: a hero
 * background and a slider slide crop hard and sit under white text, where a
 * single centred subject blown up to fill the frame looks like a mistake.
 */
export function decorateForPreview<T extends SectionNode | SectionNode[] | null>(input: T, category: string): T {
  const photos = artFor(category);
  const scenes = scenesFor(category);
  let photoAt = 0;
  let sceneAt = 0;
  let personAt = 0;
  const photo = () => photos[photoAt++ % photos.length];
  const backdrop = () => scenes[sceneAt++ % scenes.length];
  const person = () => PEOPLE_ART[personAt++ % PEOPLE_ART.length];

  const swapIn = (record: Record<string, unknown>, pick: () => string) =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, isPlaceholder(value) ? pick() : value]),
    );

  const walk = (node: SectionNode): SectionNode => {
    // A hero laid out as a background, and every slide in a slider, are the
    // full-bleed cases.
    const heroBackdrop = node.type === "hero" && node.props.layout === "background";
    const listPick = node.type === "slider" ? backdrop : node.type === "team" ? person : photo;

    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node.props)) {
      if (isPlaceholder(value)) props[key] = heroBackdrop ? backdrop() : photo();
      else if (Array.isArray(value)) {
        props[key] = value.map((item) =>
          item && typeof item === "object" && !Array.isArray(item)
            ? swapIn(item as Record<string, unknown>, listPick)
            : isPlaceholder(item)
              ? listPick()
              : item,
        );
      } else props[key] = value;
    }

    return {
      ...node,
      props,
      styles: isPlaceholder(node.styles.backgroundImage)
        ? { ...node.styles, backgroundImage: backdrop() }
        : node.styles,
      children: node.children?.map(walk),
    };
  };

  if (input === null) return input;
  if (Array.isArray(input)) return input.map(walk) as T;
  return walk(input) as T;
}

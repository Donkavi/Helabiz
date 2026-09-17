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
  products: { name: string; price: number; was?: number; image: string; blurb: string }[];
};

const IMAGES = {
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
};

/** Keyed by template category, so each preview shows plausible stock. */
const SETS: Record<string, DemoSet> = {
  Fashion: {
    business: "Kavi Fashion",
    tagline: "Modern casual clothing, made in Colombo.",
    city: "Colombo 04",
    categories: ["Dresses", "Tops", "Accessories"],
    products: [
      { name: "Linen Wrap Dress", price: 8900, image: IMAGES.fashion2, blurb: "Breathable linen for Colombo heat" },
      { name: "Oversized Cotton Tee", price: 4500, was: 6000, image: IMAGES.fashion1, blurb: "Heavyweight cotton, relaxed fit" },
      { name: "Batik Midi Dress", price: 11500, image: IMAGES.photo3, blurb: "Hand-blocked batik, made in Kandy" },
      { name: "Canvas Tote Bag", price: 2200, image: IMAGES.photo2, blurb: "Sturdy canvas with an inner pocket" },
      { name: "Ribbed Knit Top", price: 3800, image: IMAGES.photo1, blurb: "Soft stretch rib, everyday fit" },
      { name: "Wide Leg Trousers", price: 7200, image: IMAGES.fashion1, blurb: "High waist, flowing silhouette" },
      { name: "Silk Scarf", price: 3400, image: IMAGES.beauty1, blurb: "Lightweight silk, hand-rolled edges" },
      { name: "Cotton Shirt Dress", price: 9600, was: 11000, image: IMAGES.photo1, blurb: "Crisp poplin with a tie belt" },
    ],
  },
  Bakery: {
    business: "Sweet Crumb Bakery",
    tagline: "Baked fresh every morning in Kandy.",
    city: "Kandy",
    categories: ["Cakes", "Short eats", "Bread"],
    products: [
      { name: "Butter Cake", price: 1800, image: IMAGES.bakery1, blurb: "Real butter, baked this morning" },
      { name: "Chocolate Gateau", price: 4500, image: IMAGES.food1, blurb: "Rich and fudgy, serves eight" },
      { name: "Fish Bun (6 pack)", price: 900, image: IMAGES.food2, blurb: "Still warm when it reaches you" },
      { name: "Seeni Sambol Bun", price: 150, image: IMAGES.bakery1, blurb: "Sweet, spicy, made daily" },
      { name: "Milk Toffee Box", price: 1200, image: IMAGES.food1, blurb: "Traditional recipe, 20 pieces" },
      { name: "Birthday Cake", price: 6500, image: IMAGES.food2, blurb: "Made to order for your day" },
      { name: "Sourdough Loaf", price: 950, image: IMAGES.bakery1, blurb: "Slow fermented over two days" },
      { name: "Party Box", price: 2800, image: IMAGES.food1, blurb: "Short eats for twelve people" },
    ],
  },
  Restaurant: {
    business: "Spice Garden",
    tagline: "Sri Lankan food, cooked properly.",
    city: "Colombo 07",
    categories: ["Rice & curry", "Kottu", "Drinks"],
    products: [
      { name: "Rice and Curry", price: 750, image: IMAGES.food1, blurb: "Five curries, papadam and sambol" },
      { name: "Chicken Kottu", price: 950, image: IMAGES.food2, blurb: "Cooked to order on the griddle" },
      { name: "Devilled Prawns", price: 1650, image: IMAGES.food1, blurb: "Hot, sweet and properly spicy" },
      { name: "String Hoppers (10)", price: 450, image: IMAGES.food2, blurb: "With kiri hodi and pol sambol" },
      { name: "Lamprais", price: 1250, image: IMAGES.food1, blurb: "Wrapped and baked in banana leaf" },
      { name: "Watalappan", price: 400, image: IMAGES.food2, blurb: "Jaggery, coconut milk, cardamom" },
      { name: "Faluda", price: 550, image: IMAGES.beauty1, blurb: "Rose syrup, basil seed, ice cream" },
      { name: "Plain Tea", price: 120, image: IMAGES.food1, blurb: "Ceylon black, properly brewed" },
    ],
  },
  Beauty: {
    business: "Petal Studio",
    tagline: "A quiet salon in Colombo 05, by appointment.",
    city: "Colombo 05",
    categories: ["Hair", "Skin", "Nails"],
    products: [
      { name: "Signature Facial", price: 6500, image: IMAGES.beauty1, blurb: "75 minutes, tailored to your skin" },
      { name: "Hair Colour", price: 8500, image: IMAGES.photo2, blurb: "Ammonia free, consultation included" },
      { name: "Bridal Package", price: 35000, image: IMAGES.beauty1, blurb: "Trial, day-of hair and makeup" },
      { name: "Gel Manicure", price: 3200, image: IMAGES.photo3, blurb: "Lasts three weeks, chip free" },
      { name: "Hydrating Serum", price: 4800, was: 5600, image: IMAGES.beauty1, blurb: "For dry and dull skin" },
      { name: "Scalp Treatment", price: 4200, image: IMAGES.photo2, blurb: "For flaking and irritation" },
      { name: "Threading", price: 800, image: IMAGES.beauty1, blurb: "Brows shaped in ten minutes" },
      { name: "Gift Voucher", price: 5000, image: IMAGES.photo3, blurb: "Let them choose their own" },
    ],
  },
  Electronics: {
    business: "TechPoint",
    tagline: "Genuine stock with a real local warranty.",
    city: "Negombo",
    categories: ["Laptops", "Phones", "Accessories"],
    products: [
      { name: "Wireless Earbuds", price: 12500, was: 15900, image: IMAGES.tech1, blurb: "Noise cancelling, 28h battery" },
      { name: "USB-C Charger 65W", price: 6800, image: IMAGES.tech1, blurb: "Charges a laptop and a phone" },
      { name: "Mechanical Keyboard", price: 18500, image: IMAGES.tech1, blurb: "Hot-swap switches, backlit" },
      { name: "Power Bank 20000mAh", price: 9200, image: IMAGES.tech1, blurb: "Two devices at once" },
      { name: "1080p Webcam", price: 8900, image: IMAGES.tech1, blurb: "Autofocus with a built-in mic" },
      { name: "Laptop Sleeve 14\"", price: 3400, image: IMAGES.photo2, blurb: "Padded, water resistant" },
      { name: "Bluetooth Speaker", price: 14500, image: IMAGES.tech1, blurb: "IPX7, twelve hours of play" },
      { name: "SSD 1TB", price: 27500, image: IMAGES.tech1, blurb: "Read speeds up to 3500MB/s" },
    ],
  },
  Photography: {
    business: "Frame Studio",
    tagline: "Weddings, portraits and editorial work.",
    city: "Colombo",
    categories: ["Weddings", "Portraits", "Prints"],
    products: [
      { name: "Portrait Session", price: 18000, image: IMAGES.photo1, blurb: "One hour, 20 edited photographs" },
      { name: "Wedding — Full Day", price: 165000, image: IMAGES.photo2, blurb: "Two photographers, album included" },
      { name: "Engagement Shoot", price: 32000, image: IMAGES.photo3, blurb: "Two locations, 40 photographs" },
      { name: "Product Photography", price: 24000, image: IMAGES.photo1, blurb: "Ten products, white background" },
      { name: "Fine Art Print A3", price: 6500, image: IMAGES.photo2, blurb: "Archival paper, signed" },
      { name: "Photo Album", price: 28000, image: IMAGES.photo3, blurb: "Lay-flat, 40 pages" },
      { name: "Event Coverage", price: 45000, image: IMAGES.photo1, blurb: "Four hours, same-week delivery" },
      { name: "Digital Gallery", price: 8000, image: IMAGES.photo2, blurb: "Private online gallery for a year" },
    ],
  },
  Services: {
    business: "Meridian Services",
    tagline: "Fifteen years of doing things properly.",
    city: "Gampaha",
    categories: ["Installation", "Repairs", "Maintenance"],
    products: [
      { name: "Site Visit & Quote", price: 2500, image: IMAGES.service1, blurb: "Written quote within 24 hours" },
      { name: "AC Installation", price: 18500, image: IMAGES.service1, blurb: "Including brackets and piping" },
      { name: "Annual Service Plan", price: 24000, image: IMAGES.service1, blurb: "Four visits across the year" },
      { name: "Emergency Callout", price: 6500, image: IMAGES.service1, blurb: "Same day where we can" },
      { name: "Electrical Rewiring", price: 55000, image: IMAGES.photo2, blurb: "Certified, per average home" },
      { name: "Plumbing Repair", price: 4500, image: IMAGES.service1, blurb: "Charged per hour on site" },
      { name: "Deep Clean", price: 12500, image: IMAGES.photo3, blurb: "Full property, team of three" },
      { name: "Maintenance Retainer", price: 35000, image: IMAGES.service1, blurb: "Priority booking, monthly" },
    ],
  },
  "Home Business": {
    business: "Small Batch",
    tagline: "Handmade at home in Gampaha.",
    city: "Gampaha",
    categories: ["Candles", "Soap", "Gifts"],
    products: [
      { name: "Soy Candle", price: 2400, image: IMAGES.service1, blurb: "Forty hours of burn time" },
      { name: "Coconut Soap", price: 650, image: IMAGES.photo3, blurb: "Cold pressed, no palm oil" },
      { name: "Gift Hamper", price: 6800, image: IMAGES.photo2, blurb: "Wrapped and ready to give" },
      { name: "Reed Diffuser", price: 3200, image: IMAGES.service1, blurb: "Lasts about three months" },
      { name: "Lip Balm", price: 450, image: IMAGES.beauty1, blurb: "Beeswax and shea butter" },
      { name: "Wax Melts", price: 1200, image: IMAGES.service1, blurb: "Six cubes, two scents" },
      { name: "Body Scrub", price: 1900, image: IMAGES.photo3, blurb: "Coffee and coconut oil" },
      { name: "Starter Set", price: 4500, was: 5400, image: IMAGES.photo2, blurb: "Candle, soap and balm" },
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

  const categories: PublicCategory[] = set.categories.map((name, index) => ({
    id: demoId("cat", index + 1),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    image: set.products[index]?.image,
  }));

  const products: PublicProduct[] = set.products.map((product, index) => ({
    id: demoId("prd", index + 1),
    name: product.name,
    slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    price: product.price,
    compareAtPrice: product.was,
    images: [product.image],
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

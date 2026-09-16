/**
 * Seeds a demo business with products, customers, orders, expenses and a
 * published website. Safe to re-run: it removes the demo account first.
 *
 *   npm run seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB, shutdownDB } from "../src/lib/db/mongoose";
import { User } from "../src/models/User";
import { Business } from "../src/models/Business";
import { BusinessMember } from "../src/models/BusinessMember";
import { Subscription } from "../src/models/Subscription";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { Customer } from "../src/models/Customer";
import { Order } from "../src/models/Order";
import { Expense } from "../src/models/Expense";
import { Website } from "../src/models/Website";
import { WebsitePage } from "../src/models/WebsitePage";
import { InventoryMovement } from "../src/models/InventoryMovement";
import { AnalyticsEvent } from "../src/models/AnalyticsEvent";
import { Media } from "../src/models/Media";
import { Notification } from "../src/models/Notification";
import { Invoice } from "../src/models/Invoice";
import { createWebsiteFromTemplate, publishWebsite } from "../src/services/website-service";
import { createOrder } from "../src/services/order-service";
import { slugify } from "../src/lib/utils";

const DEMO_EMAIL = "demo@helabiz.lk";
const DEMO_PASSWORD = "helabiz123";

const CATEGORIES = [
  { name: "Dresses", image: "/placeholders/fashion-1.svg" },
  { name: "Tops", image: "/placeholders/fashion-2.svg" },
  { name: "Accessories", image: "/placeholders/photo-2.svg" },
];

const PRODUCTS = [
  { name: "Oversized Cotton T-Shirt", price: 4500, compareAtPrice: 6000, cost: 2100, stock: 24, category: "Tops", featured: true, images: ["/placeholders/fashion-1.svg", "/placeholders/fashion-2.svg"], short: "Heavyweight cotton, relaxed fit" },
  { name: "Linen Wrap Dress", price: 8900, cost: 4200, stock: 12, category: "Dresses", featured: true, images: ["/placeholders/fashion-2.svg"], short: "Breathable linen for Colombo heat" },
  { name: "Ribbed Knit Top", price: 3800, cost: 1700, stock: 31, category: "Tops", images: ["/placeholders/photo-1.svg"], short: "Soft stretch rib, everyday fit" },
  { name: "Batik Print Midi Dress", price: 11500, compareAtPrice: 13500, cost: 5600, stock: 8, category: "Dresses", featured: true, images: ["/placeholders/photo-3.svg"], short: "Hand-blocked batik, made in Kandy" },
  { name: "Canvas Tote Bag", price: 2200, cost: 900, stock: 46, category: "Accessories", images: ["/placeholders/photo-2.svg"], short: "Sturdy canvas with inner pocket" },
  { name: "Silk Scarf", price: 3400, cost: 1500, stock: 4, category: "Accessories", images: ["/placeholders/beauty-1.svg"], short: "Lightweight silk, hand-rolled edges" },
  { name: "Wide Leg Trousers", price: 7200, cost: 3400, stock: 17, category: "Tops", images: ["/placeholders/fashion-1.svg"], short: "High waist, flowing silhouette" },
  { name: "Cotton Shirt Dress", price: 9600, cost: 4400, stock: 0, category: "Dresses", images: ["/placeholders/photo-1.svg"], short: "Crisp poplin with a tie belt" },
];

const CUSTOMERS = [
  { name: "Tharushi Silva", phone: "0771234567", city: "Colombo", district: "Colombo", email: "tharushi@example.com" },
  { name: "Nimali Perera", phone: "0762345678", city: "Kandy", district: "Kandy" },
  { name: "Roshan Fernando", phone: "0713456789", city: "Negombo", district: "Gampaha" },
  { name: "Ayesha Jayawardena", phone: "0784567890", city: "Galle", district: "Galle" },
  { name: "Dilan Wickramasinghe", phone: "0705678901", city: "Maharagama", district: "Colombo" },
];

const EXPENSES = [
  { title: "Shop rent", category: "rent", amount: 45000, daysAgo: 4 },
  { title: "Staff salaries", category: "salary", amount: 78000, daysAgo: 4 },
  { title: "Instagram ads", category: "marketing", amount: 12500, daysAgo: 9 },
  { title: "Packaging boxes and tape", category: "packaging", amount: 8400, daysAgo: 12 },
  { title: "Courier charges", category: "delivery", amount: 15600, daysAgo: 6 },
  { title: "Fabric from supplier", category: "inventory", amount: 92000, daysAgo: 18 },
  { title: "Electricity", category: "utilities", amount: 9800, daysAgo: 15 },
  { title: "Three-wheeler for deliveries", category: "transport", amount: 4200, daysAgo: 2 },
  { title: "Instagram ads", category: "marketing", amount: 11000, daysAgo: 38 },
  { title: "Shop rent", category: "rent", amount: 45000, daysAgo: 35 },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(list: T[]): T {
  return list[randomInt(0, list.length - 1)];
}

async function main() {
  await connectDB();
  console.log("Connected. Seeding demo data…");

  const existingUser = await User.findOne({ email: DEMO_EMAIL }).lean();
  if (existingUser) {
    const businesses = await Business.find({ ownerId: existingUser._id }).select("_id").lean();
    const ids = businesses.map((b) => b._id);
    await Promise.all([
      Product.deleteMany({ businessId: { $in: ids } }),
      Category.deleteMany({ businessId: { $in: ids } }),
      Customer.deleteMany({ businessId: { $in: ids } }),
      Order.deleteMany({ businessId: { $in: ids } }),
      Expense.deleteMany({ businessId: { $in: ids } }),
      Invoice.deleteMany({ businessId: { $in: ids } }),
      InventoryMovement.deleteMany({ businessId: { $in: ids } }),
      AnalyticsEvent.deleteMany({ businessId: { $in: ids } }),
      Media.deleteMany({ businessId: { $in: ids } }),
      Notification.deleteMany({ businessId: { $in: ids } }),
      WebsitePage.deleteMany({ businessId: { $in: ids } }),
      Website.deleteMany({ businessId: { $in: ids } }),
      Subscription.deleteMany({ businessId: { $in: ids } }),
      BusinessMember.deleteMany({ businessId: { $in: ids } }),
      Business.deleteMany({ _id: { $in: ids } }),
    ]);
    await User.deleteOne({ _id: existingUser._id });
    console.log("Removed the previous demo account.");
  }

  const user = await User.create({
    name: "Kavindu Perera",
    email: DEMO_EMAIL,
    passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
    onboardedAt: new Date(),
  });

  const business = await Business.create({
    name: "Kavi Fashion",
    slug: "kavi-fashion",
    ownerId: user._id,
    type: "clothing",
    description: "Modern casual clothing for women, designed and made in Colombo.",
    phone: "0112345678",
    whatsapp: "0771234567",
    email: "hello@kavifashion.lk",
    address: "128 Galle Road",
    city: "Colombo 04",
    district: "Colombo",
    deliveryFee: 350,
    freeDeliveryOver: 10000,
    social: { facebook: "https://facebook.com/kavifashion", instagram: "https://instagram.com/kavifashion" },
    plan: "starter",
  });

  await BusinessMember.create({ businessId: business._id, userId: user._id, role: "owner", status: "active" });
  await Subscription.create({
    businessId: business._id,
    plan: "starter",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 864e5),
  });
  await User.findByIdAndUpdate(user._id, { lastBusinessId: business._id });

  const categories = await Category.insertMany(
    CATEGORIES.map((c, i) => ({
      businessId: business._id,
      name: c.name,
      slug: slugify(c.name),
      image: c.image,
      sortOrder: i,
    })),
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c._id]));

  const products = await Product.insertMany(
    PRODUCTS.map((p) => ({
      businessId: business._id,
      name: p.name,
      slug: slugify(p.name),
      shortDescription: p.short,
      description: `${p.short}.\n\nMade in small batches in our Colombo workshop. Machine wash cold, hang to dry.\n\nIsland-wide delivery in 2–4 working days.`,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      costPrice: p.cost,
      stock: p.stock,
      lowStockThreshold: 5,
      images: p.images,
      categoryId: categoryByName.get(p.category),
      featured: Boolean(p.featured),
      status: "active",
      sku: `KF-${slugify(p.name).slice(0, 8).toUpperCase()}`,
    })),
  );

  await InventoryMovement.insertMany(
    products.map((p) => ({
      businessId: business._id,
      productId: p._id,
      productName: p.name,
      type: "restock",
      quantity: p.stock,
      stockBefore: 0,
      stockAfter: p.stock,
      note: "Opening stock",
    })),
  );

  await Media.insertMany(
    [
      "fashion-1", "fashion-2", "photo-1", "photo-2", "photo-3", "beauty-1",
    ].map((name) => ({
      businessId: business._id,
      name: `${name}.svg`,
      url: `/placeholders/${name}.svg`,
      type: "image/svg+xml",
      size: 1200,
    })),
  );

  // Orders spread over the last 45 days, mostly from the website.
  const sellable = products.filter((p) => p.stock > 0);
  let orderCount = 0;
  for (let day = 45; day >= 0; day -= 1) {
    const ordersToday = day < 14 ? randomInt(0, 3) : randomInt(0, 2);
    for (let i = 0; i < ordersToday; i += 1) {
      const customer = pick(CUSTOMERS);
      const lineCount = randomInt(1, 3);
      const chosen = new Set<number>();
      while (chosen.size < lineCount) chosen.add(randomInt(0, sellable.length - 1));

      const items = [...chosen].map((index) => {
        const product = sellable[index];
        return {
          productId: String(product._id),
          name: product.name,
          image: product.images?.[0],
          price: product.price,
          costPrice: product.costPrice ?? 0,
          quantity: randomInt(1, 2),
        };
      });

      const statuses = ["delivered", "delivered", "delivered", "shipped", "confirmed", "pending", "cancelled"] as const;
      const status = day > 7 ? pick([...statuses]) : pick(["pending", "confirmed", "shipped", "delivered"] as const);

      const order = await createOrder({
        businessId: String(business._id),
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: "23/4 Temple Road",
          city: customer.city,
          district: customer.district,
        },
        items,
        deliveryFee: 350,
        discount: Math.random() > 0.8 ? 500 : 0,
        status,
        paymentStatus: status === "delivered" ? "paid" : "unpaid",
        paymentMethod: Math.random() > 0.3 ? "cod" : "bank_transfer",
        source: Math.random() > 0.35 ? "website" : pick(["whatsapp", "manual", "instagram"] as const),
      });

      const created = new Date(Date.now() - day * 864e5 - randomInt(0, 20) * 36e5);
      await Order.updateOne({ _id: order._id }, { $set: { createdAt: created, updatedAt: created } });
      orderCount += 1;
    }
  }

  await Expense.insertMany(
    EXPENSES.map((e) => ({
      businessId: business._id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: new Date(Date.now() - e.daysAgo * 864e5),
      paymentMethod: "bank",
    })),
  );

  // Website analytics events, so the analytics page has something real to show.
  const paths = ["/", "/shop", "/about", "/contact", "/products/linen-wrap-dress", "/products/oversized-cotton-t-shirt"];
  const events = [];
  for (let day = 30; day >= 0; day -= 1) {
    const visits = randomInt(12, 60);
    for (let i = 0; i < visits; i += 1) {
      const visitorId = `v-${day}-${randomInt(1, 40)}`;
      const createdAt = new Date(Date.now() - day * 864e5 - randomInt(0, 23) * 36e5);
      events.push({
        businessId: business._id,
        type: "page_view",
        path: pick(paths),
        visitorId,
        device: pick(["mobile", "mobile", "mobile", "desktop", "tablet"]),
        createdAt,
      });
      if (Math.random() > 0.55) {
        const product = pick(products);
        events.push({
          businessId: business._id,
          type: "product_view",
          path: `/products/${product.slug}`,
          productId: product._id,
          productName: product.name,
          visitorId,
          createdAt,
        });
        if (Math.random() > 0.6) {
          events.push({
            businessId: business._id,
            type: "add_to_cart",
            productId: product._id,
            productName: product.name,
            value: product.price,
            visitorId,
            createdAt,
          });
        }
      }
    }
  }
  await AnalyticsEvent.insertMany(events);

  const website = await createWebsiteFromTemplate(String(business._id), "modern-fashion");
  await publishWebsite(String(business._id), String(website._id));

  await Notification.create({
    businessId: business._id,
    type: "order",
    title: "Your website is live",
    body: "kavi-fashion.helabiz.lk is published and taking orders.",
    href: "/website",
  });

  console.log("");
  console.log("Demo data ready.");
  console.log(`  Sign in:   ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Business:  ${business.name}`);
  console.log(`  Products:  ${products.length}`);
  console.log(`  Orders:    ${orderCount}`);
  console.log(`  Analytics: ${events.length} events`);
  console.log(`  Website:   /site/${business.slug} (published)`);
  console.log("");

  await shutdownDB();
}

main().catch(async (error) => {
  console.error(error);
  await shutdownDB();
  process.exitCode = 1;
});

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Business } from "@/models/Business";
import { Product } from "@/models/Product";
import { Website } from "@/models/Website";
import { createOrder } from "@/services/order-service";
import { assertWithinLimit, LimitError } from "@/services/limits-service";
import { rateLimit } from "@/lib/rate-limit";
import { hasVariants, productSummary, variantPricing } from "@/lib/products";
import { currentShopper } from "@/services/shopper-service";

/**
 * Public checkout endpoint (spec §27, §28).
 *
 * The browser sends product ids and quantities only — never prices. Every line
 * is re-priced from the database here, so a tampered cart cannot change what an
 * order is worth. Stock, customer records and inventory movements are all
 * handled by `createOrder`, the same path the dashboard uses.
 */
const schema = z.object({
  businessSlug: z.string().min(1).max(80),
  customer: z.object({
    name: z.string().min(1, "Enter your name").max(120),
    phone: z
      .string()
      .min(9, "Enter a valid phone number")
      .max(20)
      .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    address: z.string().min(1, "Enter a delivery address").max(400),
    city: z.string().min(1, "Enter your city").max(80),
    district: z.string().max(80).optional().or(z.literal("")),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().regex(/^[a-f\d]{24}$/i),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1, "Your cart is empty")
    .max(50),
  paymentMethod: z.enum(["cod", "bank_transfer", "online"]).default("cod"),
  notes: z.string().max(600).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: first?.message ?? "Please check your details" }, { status: 400 });
  }

  const data = parsed.data;

  const limited = await rateLimit(`checkout:${data.customer.phone}`, { limit: 5, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  await connectDB();

  const business = await Business.findOne({ slug: data.businessSlug }).lean();
  if (!business) return NextResponse.json({ ok: false, error: "Shop not found" }, { status: 404 });

  const businessId = String(business._id);

  const website = await Website.findOne({ businessId, status: "published" }).select("settings").lean();
  if (!website) return NextResponse.json({ ok: false, error: "This shop is not open" }, { status: 404 });
  if (website.settings?.allowCheckout === false) {
    return NextResponse.json({ ok: false, error: "Online checkout is currently closed" }, { status: 403 });
  }

  // Re-price and re-check stock from the database.
  const products = await Product.find({
    _id: { $in: data.items.map((item) => item.productId) },
    businessId,
    status: "active",
  }).lean();

  const byId = new Map(products.map((product) => [String(product._id), product]));
  const lines = [];
  let subtotal = 0;

  for (const item of data.items) {
    const product = byId.get(item.productId);
    if (!product) {
      return NextResponse.json({ ok: false, error: "One of the items is no longer available" }, { status: 409 });
    }

    const variant = item.variantId ? product.variants?.find((v) => String(v._id) === item.variantId) : undefined;
    // A product with variants is only ever sold as one of them.
    if ((item.variantId || hasVariants(product)) && !variant) {
      return NextResponse.json({ ok: false, error: `That option of ${product.name} is unavailable` }, { status: 409 });
    }

    const pricing = variant ? variantPricing(product, variant) : productSummary(product);
    const available = pricing.stock;
    if (product.trackInventory && available < item.quantity) {
      return NextResponse.json(
        {
          ok: false,
          error:
            available > 0
              ? `Only ${available} of ${product.name} left in stock`
              : `${product.name} has just sold out`,
        },
        { status: 409 },
      );
    }

    const price = pricing.price;
    subtotal += price * item.quantity;

    lines.push({
      productId: String(product._id),
      variantId: item.variantId,
      name: product.name,
      variantName: variant?.name,
      image: product.images?.[0],
      price,
      costPrice: pricing.costPrice,
      quantity: item.quantity,
    });
  }

  const freeOver = business.freeDeliveryOver ?? 0;
  const deliveryFee = freeOver > 0 && subtotal >= freeOver ? 0 : (business.deliveryFee ?? 0);

  try {
    await assertWithinLimit(businessId, "orders");
  } catch (error) {
    if (error instanceof LimitError) {
      // Never show the shop's plan limits to its customers.
      return NextResponse.json(
        { ok: false, error: "This shop cannot take new orders right now. Please contact them directly." },
        { status: 503 },
      );
    }
    throw error;
  }

  // A signed-in customer's order goes on their account, whatever phone they typed.
  const shopper = website.settings?.customerAccounts === false ? null : await currentShopper(businessId);

  const order = await createOrder({
    businessId,
    customerId: shopper?.id,
    customer: {
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email || undefined,
      address: data.customer.address,
      city: data.customer.city,
      district: data.customer.district || undefined,
    },
    items: lines,
    deliveryFee,
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: data.paymentMethod,
    source: "website",
    notes: data.notes || undefined,
  });

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    total: order.total,
  });
}

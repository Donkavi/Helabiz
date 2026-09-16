import { z } from "zod";

const money = z.coerce.number().min(0, "Must be zero or more").max(100_000_000);
const optionalString = (max = 200) => z.string().max(max).optional().or(z.literal(""));

export const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required").max(140),
    slug: optionalString(80),
    description: optionalString(5000),
    shortDescription: optionalString(300),
    sku: optionalString(60),
    price: money,
    compareAtPrice: z.coerce.number().min(0).max(100_000_000).optional(),
    costPrice: money.default(0),
    stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
    lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(5),
    trackInventory: z.coerce.boolean().default(true),
    images: z.array(z.string()).max(12).default([]),
    categoryId: optionalString(60),
    tags: z.array(z.string().max(40)).max(20).default([]),
    status: z.enum(["active", "draft", "archived"]).default("active"),
    featured: z.coerce.boolean().default(false),
    variants: z
      .array(
        z.object({
          _id: z.string().optional(),
          name: z.string().min(1).max(80),
          sku: optionalString(60),
          price: z.coerce.number().min(0).optional(),
          stock: z.coerce.number().int().min(0).default(0),
        }),
      )
      .max(30)
      .default([]),
    seoTitle: optionalString(70),
    seoDescription: optionalString(180),
  })
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.price, {
    message: "The compare-at price should be higher than the selling price",
    path: ["compareAtPrice"],
  });

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(80),
  description: optionalString(400),
  image: optionalString(2000),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(120),
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: optionalString(400),
  city: optionalString(80),
  district: optionalString(80),
  notes: optionalString(1000),
  type: z.enum(["new", "regular", "vip", "inactive"]).default("new"),
});

export const orderItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  name: z.string().min(1).max(160),
  variantName: z.string().max(80).optional(),
  image: z.string().optional(),
  price: money,
  costPrice: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10_000),
});

export const orderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required").max(120),
  customerPhone: z
    .string()
    .min(9, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  customerEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: optionalString(400),
  city: optionalString(80),
  district: optionalString(80),
  items: z.array(orderItemSchema).min(1, "Add at least one product to the order"),
  discount: money.default(0),
  deliveryFee: money.default(0),
  status: z
    .enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"])
    .default("pending"),
  paymentStatus: z.enum(["unpaid", "paid", "partial", "refunded"]).default("unpaid"),
  paymentMethod: z.enum(["cod", "bank_transfer", "online", "cash", "card"]).default("cod"),
  source: z.enum(["website", "manual", "whatsapp", "instagram", "facebook", "walk_in"]).default("manual"),
  notes: optionalString(1000),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Give this expense a name").max(140),
  category: z.enum([
    "rent", "salary", "marketing", "packaging", "delivery", "inventory", "utilities", "transport", "other",
  ]),
  amount: z.coerce.number().min(0.01, "Enter an amount").max(100_000_000),
  date: z.coerce.date(),
  notes: optionalString(1000),
  paymentMethod: optionalString(40),
  recurring: z.coerce.boolean().default(false),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["restock", "adjustment", "damage", "return"]),
  quantity: z.coerce.number().int().refine((v) => v !== 0, "Enter a quantity"),
  note: optionalString(300),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(2, "Business name is required").max(80),
  description: optionalString(400),
  logo: optionalString(2_000_000),
  phone: optionalString(20),
  whatsapp: optionalString(20),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: optionalString(300),
  city: optionalString(80),
  district: optionalString(80),
  deliveryFee: money.default(0),
  freeDeliveryOver: money.default(0),
  facebook: optionalString(300),
  instagram: optionalString(300),
  tiktok: optionalString(300),
  youtube: optionalString(300),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;

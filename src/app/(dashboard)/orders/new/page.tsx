import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { variantPricing } from "@/lib/products";
import { OrderComposer } from "./order-composer";

export const metadata: Metadata = { title: "New order" };

export default async function NewOrderPage() {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const [products, customers] = await Promise.all([
    Product.find({ businessId, status: { $ne: "archived" } }).sort({ name: 1 }).limit(500).lean(),
    Customer.find({ businessId }).sort({ lastOrderAt: -1, name: 1 }).limit(200).lean(),
  ]);

  return (
    <OrderComposer
      defaultDeliveryFee={business.deliveryFee ?? 0}
      products={serialize(products).map((p) => ({
        id: String(p._id),
        name: p.name,
        price: p.price,
        costPrice: p.costPrice ?? 0,
        stock: p.stock ?? 0,
        trackInventory: p.trackInventory ?? true,
        image: p.images?.[0],
        sku: p.sku ?? undefined,
        variants: (p.variants ?? []).map((v) => ({
          id: String(v._id),
          name: v.name,
          ...variantPricing(p, v),
        })),
      }))}
      customers={serialize(customers).map((c) => ({
        id: String(c._id),
        name: c.name,
        phone: c.phone,
        address: c.address ?? undefined,
        city: c.city ?? undefined,
        district: c.district ?? undefined,
      }))}
    />
  );
}

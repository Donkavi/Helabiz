import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { Expense } from "@/models/Expense";
import { InventoryMovement } from "@/models/InventoryMovement";
import { Category } from "@/models/Category";
import { dailySeries, daysAgo } from "@/services/metrics-service";

/** RFC 4180 quoting — commas, quotes and newlines all survive a round trip. */
function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? "" : String(cell);
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\r\n");
}

function date(value: unknown) {
  return value ? new Date(value as string).toISOString().slice(0, 10) : "";
}

export async function GET(request: Request) {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "orders";
  const days = Math.min(Math.max(Number(url.searchParams.get("range") ?? 30), 1), 400);
  const from = daysAgo(days - 1);

  let rows: (string | number | null | undefined)[][] = [];

  switch (type) {
    case "orders": {
      const orders = await Order.find({ businessId, createdAt: { $gte: from } }).sort({ createdAt: -1 }).lean();
      rows = [
        ["Order", "Date", "Customer", "Phone", "City", "Items", "Subtotal", "Discount", "Delivery", "Total", "Cost", "Status", "Payment", "Source"],
        ...orders.map((order) => [
          order.orderNumber,
          date(order.createdAt),
          order.customer?.name,
          order.customer?.phone,
          order.customer?.city,
          order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
          order.subtotal ?? 0,
          order.discount ?? 0,
          order.deliveryFee ?? 0,
          order.total ?? 0,
          order.cost ?? 0,
          order.status,
          order.paymentStatus,
          order.source,
        ]),
      ];
      break;
    }

    case "products": {
      const [products, categories] = await Promise.all([
        Product.find({ businessId }).sort({ name: 1 }).lean(),
        Category.find({ businessId }).lean(),
      ]);
      const categoryName = new Map(categories.map((c) => [String(c._id), c.name]));
      rows = [
        ["Name", "SKU", "Category", "Price", "Compare at", "Cost", "Margin %", "Stock", "Sold", "Status", "Featured"],
        ...products.map((product) => [
          product.name,
          product.sku,
          product.categoryId ? categoryName.get(String(product.categoryId)) : "",
          product.price,
          product.compareAtPrice ?? "",
          product.costPrice ?? 0,
          product.price > 0 ? Math.round(((product.price - (product.costPrice ?? 0)) / product.price) * 100) : 0,
          product.stock ?? 0,
          product.sold ?? 0,
          product.status,
          product.featured ? "yes" : "no",
        ]),
      ];
      break;
    }

    case "customers": {
      const customers = await Customer.find({ businessId }).sort({ totalSpent: -1 }).lean();
      rows = [
        ["Name", "Phone", "Email", "City", "District", "Type", "Orders", "Total spent", "Last order", "Added"],
        ...customers.map((customer) => [
          customer.name,
          customer.phone,
          customer.email,
          customer.city,
          customer.district,
          customer.type,
          customer.totalOrders ?? 0,
          customer.totalSpent ?? 0,
          date(customer.lastOrderAt),
          date(customer.createdAt),
        ]),
      ];
      break;
    }

    case "expenses": {
      const expenses = await Expense.find({ businessId, date: { $gte: from } }).sort({ date: -1 }).lean();
      rows = [
        ["Date", "Title", "Category", "Amount", "Paid by", "Notes"],
        ...expenses.map((expense) => [
          date(expense.date),
          expense.title,
          expense.category,
          expense.amount,
          expense.paymentMethod,
          expense.notes,
        ]),
      ];
      break;
    }

    case "inventory": {
      const movements = await InventoryMovement.find({ businessId, createdAt: { $gte: from } })
        .sort({ createdAt: -1 })
        .lean();
      rows = [
        ["Date", "Product", "Type", "Quantity", "Stock before", "Stock after", "Reference", "Note"],
        ...movements.map((movement) => [
          date(movement.createdAt),
          movement.productName,
          movement.type,
          movement.quantity,
          movement.stockBefore,
          movement.stockAfter,
          movement.reference,
          movement.note,
        ]),
      ];
      break;
    }

    case "sales": {
      const series = await dailySeries(businessId, days);
      rows = [
        ["Date", "Orders", "Sales", "Expenses", "Profit"],
        ...series.map((day) => [day.date, day.orders, day.revenue, day.expenses, day.profit]),
      ];
      break;
    }

    default:
      return new Response("Unknown report type", { status: 400 });
  }

  const filename = `${business.slug}-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(`﻿${toCsv(rows)}`, {
    headers: {
      // The BOM makes Excel open UTF-8 correctly on Windows.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

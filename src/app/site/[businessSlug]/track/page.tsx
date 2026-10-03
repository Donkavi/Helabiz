import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Package, Search } from "lucide-react";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { loadPublishedSite } from "@/lib/website/load-site";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { normalizePhone } from "@/lib/whatsapp";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderJourney } from "@/components/website/account/order-journey";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The tracking page from the "Order tracking" add-on.
 *
 * An order number alone is guessable, so it is checked against the phone
 * number on the order: someone who has both is the customer or was told by
 * them. A wrong pair gives the same answer as a missing order, which is what
 * stops the form being used to probe for valid order numbers.
 */
export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ order?: string; phone?: string }>;
}) {
  const { businessSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();
  // Not paid for, so it does not exist as far as the public is concerned.
  if (!site.addons.includes("order_tracking")) notFound();

  const query = await searchParams;
  const orderNumber = query.order?.trim() ?? "";
  const phone = query.phone?.trim() ?? "";
  const searched = Boolean(orderNumber && phone);

  let found: Record<string, unknown> | null = null;

  if (searched) {
    await connectDB();
    const order = await Order.findOne({
      businessId: site.businessId,
      orderNumber: new RegExp(`^${orderNumber.replace(/[^a-z0-9-]/gi, "")}$`, "i"),
    }).lean();

    if (order) {
      const customer = order.customerId
        ? await Customer.findById(order.customerId).select("phone").lean()
        : null;
      const given = normalizePhone(phone);
      const onOrder = normalizePhone(customer?.phone ?? "");
      if (given && given === onOrder) found = serialize(order) as Record<string, unknown>;
    }
  }

  return (
    <WebsiteRenderer sections={[]} header={site.header} footer={site.footer} ctx={site.ctx} mode="public">
      <div className="w-in" style={{ paddingBlock: 56, maxWidth: 620 }}>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>Track your order</h1>
        <p style={{ marginTop: 8, opacity: 0.7, lineHeight: 1.6 }}>
          Enter your order number and the phone number you gave us.
        </p>

        <form method="get" style={{ marginTop: 24, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Order number
            <input
              name="order"
              defaultValue={orderNumber}
              required
              placeholder="HB-1042"
              style={{
                padding: "11px 13px",
                borderRadius: 10,
                border: "1px solid rgba(128,128,128,.35)",
                background: "transparent",
                color: "inherit",
                font: "inherit",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Phone number
            <input
              name="phone"
              defaultValue={phone}
              required
              inputMode="tel"
              placeholder="077 123 4567"
              style={{
                padding: "11px 13px",
                borderRadius: 10,
                border: "1px solid rgba(128,128,128,.35)",
                background: "transparent",
                color: "inherit",
                font: "inherit",
              }}
            />
          </label>

          <button
            type="submit"
            className="w-btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Search size={16} />
            Find my order
          </button>
        </form>

        {searched && !found && (
          <p
            role="status"
            style={{
              marginTop: 24,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(128,128,128,.3)",
              lineHeight: 1.6,
            }}
          >
            We could not find an order with that number and phone number. Check both and try again.
          </p>
        )}

        {found && (
          <div
            style={{
              marginTop: 28,
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(128,128,128,.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Package size={18} />
              <strong style={{ fontSize: 17 }}>Order {String(found.orderNumber)}</strong>
            </div>
            <p style={{ marginTop: 4, fontSize: 13.5, opacity: 0.7 }}>
              Placed {formatDate(String(found.createdAt), "long")} ·{" "}
              {formatCurrency(Number(found.total ?? 0), { decimals: false })}
            </p>

            <OrderJourney status={String(found.status ?? "")} />
          </div>
        )}
      </div>
    </WebsiteRenderer>
  );
}

import type { Metadata } from "next";
import { ChevronRight, MapPin, MessageCircle, Package, Pencil, ShoppingBag } from "lucide-react";
import { AccountPage, requireShopper, siteChatEnabled } from "@/components/website/account/account-shell";
import { SignOutButton } from "@/components/website/account/account-forms";
import { SiteImage, SiteLink } from "@/components/website/primitives";
import { shopperOrders } from "@/services/shopper-service";
import { unreadForCustomer } from "@/services/shop-chat-service";
import { statusLabel } from "@/lib/website/order-journey";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

/** Off-journey statuses read as a warning; everything else in the shop's colour. */
function statusTone(status: string) {
  if (status === "cancelled" || status === "returned") {
    return { background: "rgba(180,52,31,.1)", color: "#b4341f" };
  }
  if (status === "delivered") {
    return { background: "color-mix(in srgb,var(--w-text) 8%,transparent)", color: "inherit" };
  }
  return { background: "color-mix(in srgb,var(--w-primary) 12%,transparent)", color: "var(--w-primary)" };
}

export default async function AccountHomePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const { site, shopper } = await requireShopper(businessSlug, "/account");
  const orders = await shopperOrders(site.businessId, shopper.id);
  const firstName = shopper.name.split(" ")[0] || "there";
  const address = [shopper.address, shopper.city, shopper.district].filter(Boolean).join(", ");
  const chat = siteChatEnabled(site);
  const unread = chat ? await unreadForCustomer(site.businessId, shopper.id) : 0;

  return (
    <AccountPage site={site}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
            Hello, {firstName}
          </h1>
          <p className="w-muted" style={{ marginTop: 6, fontSize: 14.5 }}>
            Your orders and details at {site.ctx.business.name}.
          </p>
        </div>
        <SignOutButton ctx={site.ctx} businessSlug={businessSlug} />
      </div>

      {chat && (
        <SiteLink ctx={site.ctx} href="/account/messages">
          <span
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              borderRadius: "var(--w-radius)",
              background: unread
                ? "color-mix(in srgb,var(--w-primary) 10%,var(--w-surface))"
                : "var(--w-surface)",
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "color-mix(in srgb,var(--w-primary) 14%,transparent)",
                color: "var(--w-primary)",
              }}
            >
              <MessageCircle size={19} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: "block", fontSize: 15 }}>Messages</strong>
              <span className="w-muted" style={{ display: "block", marginTop: 2, fontSize: 13 }}>
                {unread
                  ? `${unread} new ${unread === 1 ? "reply" : "replies"} from ${site.ctx.business.name}`
                  : `Chat with ${site.ctx.business.name}`}
              </span>
            </span>
            {unread > 0 && (
              <span
                style={{
                  minWidth: 22,
                  height: 22,
                  padding: "0 7px",
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--w-primary)",
                  color: "var(--w-btn-on-primary,#fff)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            <ChevronRight size={16} style={{ opacity: 0.45, flexShrink: 0 }} />
          </span>
        </SiteLink>
      )}

      <div
        style={{
          marginTop: 32,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Orders */}
        <section style={{ flex: "2 1 420px", minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>
            My orders {orders.length > 0 && <span className="w-muted">({orders.length})</span>}
          </h2>

          {orders.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                borderRadius: "var(--w-radius)",
                background: "var(--w-surface)",
              }}
            >
              <ShoppingBag size={28} style={{ color: "var(--w-muted)" }} />
              <p style={{ marginTop: 12, fontWeight: 600 }}>No orders yet</p>
              <p className="w-muted" style={{ marginTop: 4, fontSize: 14 }}>
                When you order, it will show up here so you can follow it.
              </p>
              <div style={{ marginTop: 18 }}>
                <SiteLink ctx={site.ctx} href="/shop" className="w-btn w-btn--solid">
                  Start shopping
                </SiteLink>
              </div>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {orders.map((order) => (
                <li key={order.orderNumber}>
                  <SiteLink ctx={site.ctx} href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: 14,
                        borderRadius: "var(--w-radius)",
                        background: "var(--w-surface)",
                      }}
                    >
                      <span
                        style={{
                          width: 52,
                          height: 52,
                          flexShrink: 0,
                          borderRadius: "calc(var(--w-radius) * .6)",
                          overflow: "hidden",
                          background: "var(--w-bg)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {order.image ? (
                          <SiteImage src={order.image} alt="" className="w-img" />
                        ) : (
                          <Package size={20} style={{ color: "var(--w-muted)" }} />
                        )}
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 14.5 }}>{order.orderNumber}</strong>
                          <span
                            style={{
                              ...statusTone(order.status),
                              fontSize: 11.5,
                              fontWeight: 600,
                              padding: "3px 9px",
                              borderRadius: 999,
                            }}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </span>
                        <span
                          className="w-muted"
                          style={{
                            display: "block",
                            marginTop: 3,
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(order.createdAt, "long")} · {order.firstItem}
                          {order.itemCount > 1 && ` and ${order.itemCount - 1} more`}
                        </span>
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap" }}>
                        {formatCurrency(order.total, { decimals: false })}
                      </span>
                      <ChevronRight size={16} style={{ opacity: 0.45, flexShrink: 0 }} />
                    </span>
                  </SiteLink>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Profile */}
        <aside style={{ flex: "1 1 260px", padding: 22, borderRadius: "var(--w-radius)", background: "var(--w-surface)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>My details</h2>
            <SiteLink ctx={site.ctx} href="/account/profile">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--w-primary)",
                }}
              >
                <Pencil size={13} />
                Edit
              </span>
            </SiteLink>
          </div>
          <dl style={{ marginTop: 14, display: "grid", gap: 12, fontSize: 14 }}>
            <Detail label="Name" value={shopper.name} />
            <Detail label="Phone" value={shopper.phone} />
            <Detail label="Email" value={shopper.email} />
            <div>
              <dt className="w-muted" style={{ fontSize: 12.5 }}>
                Delivery address
              </dt>
              <dd style={{ margin: "2px 0 0", lineHeight: 1.55 }}>
                {address || (
                  <SiteLink ctx={site.ctx} href="/account/profile">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--w-primary)" }}>
                      <MapPin size={13} />
                      Add an address for faster checkout
                    </span>
                  </SiteLink>
                )}
              </dd>
            </div>
          </dl>
          {shopper.memberSince && (
            <p className="w-muted" style={{ marginTop: 16, fontSize: 12.5 }}>
              Member since {formatDate(shopper.memberSince, "long")}
            </p>
          )}
        </aside>
      </div>
    </AccountPage>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="w-muted" style={{ fontSize: 12.5 }}>
        {label}
      </dt>
      <dd style={{ margin: "2px 0 0", wordBreak: "break-word" }}>{value || "—"}</dd>
    </div>
  );
}

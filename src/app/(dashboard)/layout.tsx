import { listUserBusinesses, requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Notification } from "@/models/Notification";
import { Website } from "@/models/Website";
import { getPlan } from "@/lib/plans";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { siteUrlFor } from "@/lib/website/urls";
import { getSuperAdmin } from "@/lib/permissions/admin";
import { getLang } from "@/lib/i18n/server";
import { LangProvider } from "@/lib/i18n/provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, business, businessId } = await requireBusiness();
  const lang = await getLang();
  const admin = await getSuperAdmin();
  await connectDB();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [businesses, ordersThisMonth, notifications, website] = await Promise.all([
    listUserBusinesses(user.id),
    Order.countDocuments({ businessId, createdAt: { $gte: startOfMonth } }),
    Notification.find({ businessId, read: false }).sort({ createdAt: -1 }).limit(8).lean(),
    Website.findOne({ businessId }).select("subdomain status").lean(),
  ]);

  const plan = getPlan(business.plan);
  const usage =
    plan.limits.ordersPerMonth === Number.POSITIVE_INFINITY
      ? undefined
      : { used: ordersThisMonth, limit: plan.limits.ordersPerMonth };

  const options = businesses.map((b) => ({
    id: b._id,
    name: b.name,
    slug: b.slug,
    plan: b.plan ?? "free",
    role: b.role,
    logo: b.logo ?? undefined,
  }));

  const siteUrl = website?.status === "published" ? siteUrlFor(business.slug) : null;

  return (
    <LangProvider lang={lang}>
    <div className="flex min-h-dvh bg-background" lang={lang}>
      <aside className="hidden w-[248px] shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarContent
            businesses={options}
            activeId={businessId}
            plan={business.plan ?? "free"}
            usage={usage}
            siteUrl={siteUrl}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ name: user.name, email: user.email, image: user.image }}
          isSuperAdmin={Boolean(admin)}
          businesses={options}
          activeId={businessId}
          plan={business.plan ?? "free"}
          usage={usage}
          siteUrl={siteUrl}
          notifications={serialize(notifications).map((n) => ({
            id: String(n._id),
            title: n.title,
            body: n.body ?? undefined,
            href: n.href ?? undefined,
            createdAt: String(n.createdAt),
          }))}
        />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
    </LangProvider>
  );
}

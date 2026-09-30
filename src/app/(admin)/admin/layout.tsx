import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, LayoutDashboard, Receipt, ScrollText, ShieldCheck, Users } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { Badge } from "@/components/ui/badge";
import { LangProvider } from "@/lib/i18n/provider";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Helabiz admin" } };

// Every figure on these screens is a live count across the whole platform.
export const dynamic = "force-dynamic";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/payments", label: "Payments", icon: Receipt },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The gate for the screens. Each action re-checks it for itself.
  const admin = await requireSuperAdmin();

  return (
    // English only: this is an internal tool, not a customer surface.
    <LangProvider lang="en">
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-5 lg:px-8">
          <span className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4.5 text-primary" />
            Helabiz
            <Badge variant="soft">Platform admin</Badge>
          </span>

          <AdminNav links={ADMIN_LINKS.map(({ href, label, exact }) => ({ href, label, exact }))} />

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[12.5px] text-muted-foreground sm:block">{admin.email}</span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft className="size-3.5" />
              My business
            </Link>
          </div>
        </div>
      </header>

      {admin.viaBootstrap && (
        <p className="border-b border-warning/25 bg-warning/10 px-5 py-2 text-center text-[12.5px] text-warning lg:px-8">
          You are here through <code className="font-mono">SUPER_ADMIN_EMAILS</code>, not a stored role. Promote your
          account on the Users screen so access does not depend on an environment variable.
        </p>
      )}

      <main className="mx-auto w-full max-w-[1320px] px-5 py-8 lg:px-8">{children}</main>
    </div>
    </LangProvider>
  );
}

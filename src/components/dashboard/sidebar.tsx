"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS, isActive } from "./nav-config";
import { BusinessSwitcher, type BusinessOption } from "./business-switcher";
import { cn } from "@/lib/utils";

export function SidebarContent({
  businesses,
  activeId,
  plan,
  usage,
  siteUrl,
  onNavigate,
}: {
  businesses: BusinessOption[];
  activeId: string;
  plan: string;
  usage?: { label: string; used: number; limit: number };
  siteUrl?: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-15 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" onClick={onNavigate} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
      </div>

      <div className="border-b border-sidebar-border p-3">
        <BusinessSwitcher businesses={businesses} activeId={activeId} />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4" aria-label="Dashboard">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-2.5 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            View live site
          </a>
        )}

        {plan === "free" && (
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <p className="text-[13px] font-semibold">Free plan</p>
            </div>
            {usage && (
              <>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  {usage.used} of {usage.limit} {usage.label} this month
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (usage.used / Math.max(usage.limit, 1)) * 100)}%` }}
                  />
                </div>
              </>
            )}
            <Button size="sm" className="mt-3 w-full" asChild>
              <Link href="/settings/billing" onClick={onNavigate}>
                Upgrade plan
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Store, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/settings", label: "Business", icon: Store, exact: true },
  { href: "/settings/account", label: "Your account", icon: UserRound },
  { href: "/settings/team", label: "Staff accounts", icon: Users },
  { href: "/settings/billing", label: "Plan & billing", icon: CreditCard },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col" aria-label="Settings">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <link.icon className={cn("size-4", active && "text-primary")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

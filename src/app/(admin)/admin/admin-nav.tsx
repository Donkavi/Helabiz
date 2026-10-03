"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The admin tabs. A client component only so it can mark the current one.
 * A `count` shows as a badge: work waiting for the team on that screen.
 */
export function AdminNav({
  links,
}: {
  links: { href: string; label: string; exact?: boolean; count?: number }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Admin">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors",
              active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
            {link.count ? (
              <span className="min-w-[18px] rounded-full bg-primary px-1.5 text-center text-[11px] leading-[18px] font-semibold text-primary-foreground tabular-nums">
                {link.count > 99 ? "99+" : link.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

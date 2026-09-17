"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/marketing/language-toggle";
import type { Lang } from "@/lib/i18n";
import type { MarketingCopy } from "@/lib/i18n/marketing";
import { cn } from "@/lib/utils";

export function MarketingNav({ lang, t }: { lang: Lang; t: MarketingCopy["nav"] }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 lg:px-8">
        <Link href="/" className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {t.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle current={lang} />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">{t.signIn}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">{t.startFree}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle current={lang} />
          <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
          aria-label={open ? t.closeMenu : t.openMenu}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 pb-5 pt-3 lg:hidden animate-slide-down">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile">
            {t.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href="/sign-in">{t.signIn}</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">{t.startFree}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#website-builder", label: "Website builder" },
      { href: "/#business", label: "Business management" },
      { href: "/templates", label: "Templates" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Built for",
    links: [
      { href: "/templates?category=Fashion", label: "Clothing stores" },
      { href: "/templates?category=Bakery", label: "Bakeries" },
      { href: "/templates?category=Beauty", label: "Salons & beauty" },
      { href: "/templates?category=Restaurant", label: "Restaurants" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: "/sign-up", label: "Start free" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              The business platform built for Sri Lankan small businesses. Run your shop and build your website in one
              place.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Helabiz. Made in Sri Lanka.</p>
          <p>Prices in Sri Lankan Rupees (LKR).</p>
        </div>
      </div>
    </footer>
  );
}

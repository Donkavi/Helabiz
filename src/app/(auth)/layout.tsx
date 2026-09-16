import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/logo";

const POINTS = [
  "Drag-and-drop website builder with 8 designed templates",
  "Orders, products, customers and inventory in one place",
  "Website orders update your stock automatically",
  "Free forever plan — no card needed to start",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,46%)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="text-center text-[12.5px] text-muted-foreground">
          © {new Date().getFullYear()} Helabiz · Made in Sri Lanka
        </p>
      </div>

      {/* Brand panel — decorative, hidden on small screens. */}
      <aside className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden />
        <div className="absolute -right-24 top-1/4 size-96 rounded-full bg-primary/8 blur-3xl" aria-hidden />
        <div className="relative flex h-full flex-col justify-center px-14">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">Helabiz</p>
          <h2 className="mt-4 max-w-sm text-[30px] font-semibold leading-[1.15] tracking-[-0.03em]">
            Your business. Your website. One simple platform.
          </h2>
          <ul className="mt-9 space-y-3.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[14px] text-muted-foreground">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary-muted">
                  <Check className="size-2.5 text-primary" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

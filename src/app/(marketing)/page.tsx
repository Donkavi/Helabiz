import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CreditCard,
  FileText,
  Globe,
  Layers,
  MessageCircle,
  MousePointerClick,
  Package,
  Palette,
  Receipt,
  Rocket,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuilderMockup } from "@/components/marketing/builder-mockup";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/misc";
import { TEMPLATES } from "@/lib/website/templates";
import { cn } from "@/lib/utils";

const PROBLEMS = [
  {
    icon: MessageCircle,
    title: "Orders lost in chat",
    body: "Sales arrive across WhatsApp, Instagram and Facebook, then disappear into a scroll of messages.",
  },
  {
    icon: Receipt,
    title: "Numbers in a notebook",
    body: "You are guessing at profit because sales, costs and expenses live in three different places.",
  },
  {
    icon: Globe,
    title: "No real website",
    body: "Customers ask for a link and you send a photo album. Quotes from developers start at Rs. 80,000.",
  },
];

const BUILDER_FEATURES = [
  { icon: MousePointerClick, title: "Drag and drop", body: "Pick a section, drop it where you want it. No code, no theme files." },
  { icon: Palette, title: "Change anything", body: "Colours, fonts, spacing, images and buttons — every section has real settings." },
  { icon: Smartphone, title: "Mobile ready", body: "Design for desktop, tablet and phone with a single switch. Published sites are responsive." },
  { icon: Package, title: "Your real products", body: "Product sections read straight from your catalogue. Add a product once, it appears everywhere." },
];

const BUSINESS_FEATURES = [
  { icon: ShoppingBag, title: "Orders", body: "Every website and manual order in one list, with status tracking and WhatsApp replies." },
  { icon: Boxes, title: "Inventory", body: "Stock drops automatically when an order comes in, with a movement log you can audit." },
  { icon: Users, title: "Customers", body: "Website buyers are added to your customer list with their order history and spend." },
  { icon: Wallet, title: "Expenses", body: "Record rent, salaries, packaging and delivery so profit is a real number." },
  { icon: FileText, title: "Invoices", body: "Generate a clean, printable invoice from any order in two clicks." },
  { icon: BarChart3, title: "Reports", body: "Sales, profit, top products and website performance — exportable to CSV." },
];

const STEPS = [
  { n: "01", title: "Create your business", body: "Name it, tell us what you sell, and you are in. Takes about a minute." },
  { n: "02", title: "Add your products", body: "Name, price, photos, stock. Or import what you already have." },
  { n: "03", title: "Pick a template", body: "Eight designed templates for Sri Lankan businesses, or start from a blank page." },
  { n: "04", title: "Customise and publish", body: "Drag sections around, change the colours, hit Publish. You are live on a helabiz.lk address." },
];

const TESTIMONIALS = [
  {
    quote:
      "I was posting clothes on Instagram and losing track of who ordered what. Now customers order from my own site and everything lands in one place.",
    name: "Tharushi Silva",
    role: "Kavi Fashion, Colombo",
  },
  {
    quote:
      "The website took me one evening. My customers order cakes without messaging me at midnight, and I finally know what my profit is.",
    name: "Nimali Perera",
    role: "Sweet Crumb Bakery, Kandy",
  },
  {
    quote:
      "Stock used to be a guess. Now every website order reduces inventory and I get a warning before something runs out.",
    name: "Roshan Fernando",
    role: "TechPoint, Negombo",
  },
];

const FAQS = [
  {
    q: "Do I need to know how to build websites?",
    a: "No. You pick a template, drag sections into place and type over the text. Everything is edited visually — there is nothing to install and no code to write.",
  },
  {
    q: "What web address will my site have?",
    a: "Every business gets a free address like yourshop.helabiz.lk as soon as you publish. On the Business plan you can point your own domain at it.",
  },
  {
    q: "Do I have to add my products twice?",
    a: "Never. Products you add in the dashboard appear immediately in the website builder's product sections, and website orders flow back into your orders, customers and inventory.",
  },
  {
    q: "How do customers pay?",
    a: "Cash on delivery and bank transfer are ready now, which is how most Sri Lankan customers prefer to pay. The checkout is built so local card gateways can be added without changing your store.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. The Free plan handles 20 orders and 50 products a month with a real published website, and it does not expire. Upgrade when you outgrow it.",
  },
  {
    q: "Does my website work on phones?",
    a: "Yes. Published sites are fully responsive, and you can preview and adjust the tablet and mobile layouts from inside the builder before publishing.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.55] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-border/80 bg-card px-3 py-1 text-[12px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Built for Sri Lankan small businesses
            </Badge>

            <h1 className="text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-6xl">
              Your business.
              <br />
              Your website.
              <br />
              <span className="text-primary">One simple platform.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed text-muted-foreground text-pretty">
              Manage your products, orders, customers and profits — and build your own professional website without
              writing code.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="xl" asChild className="w-full sm:w-auto">
                <Link href="/sign-up">
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/templates">
                  <Sparkles className="size-4" />
                  Create a website
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-[13px] text-muted-foreground">
              Free forever plan · No card required · Live in under an hour
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="absolute -inset-x-6 -top-6 bottom-10 rounded-[2rem] bg-gradient-to-b from-primary/8 to-transparent blur-2xl" aria-hidden />
            <BuilderMockup className="relative animate-fade-up" />
          </div>
        </div>
      </section>

      {/* ── Problem ────────────────────────────────────────────────────── */}
      <Section>
        <SectionIntro
          eyebrow="The problem"
          title="Selling through chat stops working"
          body="It gets you started, but it does not scale. Somewhere between the tenth and hundredth order, the messages win."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/8 text-destructive">
                <item.icon className="size-4.5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Solution ───────────────────────────────────────────────────── */}
      <Section className="border-y border-border bg-card/40">
        <SectionIntro
          eyebrow="The solution"
          title="One platform, two halves that talk to each other"
          body="A website your customers order from, and a dashboard that keeps the business behind it in order. Same products, same customers, same numbers."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <HalfCard
            icon={Globe}
            kicker="Front of house"
            title="A professional website"
            body="Drag-and-drop pages, real product listings, a cart and a Sri Lankan-friendly checkout — published to your own address."
            points={["Drag-and-drop builder", "8 designed templates", "Cart & checkout", "SEO and sitemaps"]}
            href="#website-builder"
          />
          <HalfCard
            icon={Store}
            kicker="Back of house"
            title="A business that runs itself"
            body="Orders land in one list, stock adjusts automatically, customers build up a history, and profit is calculated for you."
            points={["Orders & inventory", "Customers & expenses", "Invoices & reports", "WhatsApp messaging"]}
            href="#business"
            tone="gold"
          />
        </div>
      </Section>

      {/* ── Website builder ────────────────────────────────────────────── */}
      <Section id="website-builder">
        <SectionIntro
          eyebrow="Website builder"
          title="Build it the way you picture it"
          body="Everything on your website is a section. Drag one in, drop it where it belongs, and edit it in place."
        />

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 lg:order-1">
            <ol className="space-y-1">
              {["Drag", "Drop", "Customise", "Publish"].map((label, i) => (
                <li key={label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl border text-[13px] font-semibold",
                        i === 3
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    {i < 3 && <span className="my-1 h-7 w-px bg-border" />}
                  </div>
                  <div className={cn(i < 3 && "pb-6")}>
                    <p className="text-[15px] font-semibold">{label}</p>
                    <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                      {
                        [
                          "Choose from 40+ sections across layout, content, marketing, media and commerce.",
                          "A clear line shows exactly where the section will land before you let go.",
                          "Change text, colour, spacing, images and layout from the settings panel.",
                          "Your draft stays private until you publish. Then it is live on the web.",
                        ][i]
                      }
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="order-1 grid grid-cols-2 gap-3 lg:order-2">
            {BUILDER_FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5">
                <f.icon className="size-4.5 text-primary" />
                <h3 className="mt-3 text-[14px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section showcase */}
        <div className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sections included</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Hero", "Image gallery", "Image slider", "Product grid", "Featured product", "Testimonials",
              "Call to action", "Features", "Statistics", "FAQ", "Pricing cards", "About us", "Services",
              "Team", "Contact form", "Business hours", "Location", "Social links", "Announcement bar",
              "Video", "Columns", "Rich text", "Categories", "Footer",
            ].map((label) => (
              <span
                key={label}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-muted hover:text-primary"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Business management ────────────────────────────────────────── */}
      <Section id="business" className="border-y border-border bg-card/40">
        <SectionIntro
          eyebrow="Business management"
          title="The half your customers never see"
          body="Every website order becomes a real order, a real customer and a real stock movement — automatically."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted text-primary transition-transform duration-200 group-hover:scale-105">
                <f.icon className="size-4.5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3 sm:p-8">
          {[
            { icon: TrendingUp, stat: "One catalogue", body: "Add a product once — it appears on your website instantly." },
            { icon: Layers, stat: "One order list", body: "Website, WhatsApp and walk-in orders side by side." },
            { icon: CreditCard, stat: "One profit figure", body: "Sales minus cost of goods minus expenses. Calculated for you." },
          ].map((item) => (
            <div key={item.stat} className="flex gap-3">
              <item.icon className="mt-0.5 size-4.5 shrink-0 text-primary" />
              <div>
                <p className="text-[14px] font-semibold">{item.stat}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Templates ──────────────────────────────────────────────────── */}
      <Section id="templates">
        <SectionIntro
          eyebrow="Templates"
          title="Start from a design, not a blank page"
          body="Each template arrives with pages, sections, fonts and colours already in place. Change what you like."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.slice(0, 8).map((template) => (
            <Link
              key={template.id}
              href={`/templates#${template.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div
                className="relative aspect-4/3 overflow-hidden"
                style={{ background: `linear-gradient(140deg, ${template.theme.primary}, ${template.theme.secondary})` }}
              >
                <div className="absolute inset-0 flex flex-col justify-end gap-1.5 p-4">
                  <span className="h-1.5 w-16 rounded-full bg-white/85" />
                  <span className="h-1.5 w-24 rounded-full bg-white/60" />
                  <div className="mt-1.5 flex gap-1.5">
                    <span className="h-4 w-12 rounded-[4px] bg-white/85" />
                    <span className="h-4 w-12 rounded-[4px] border border-white/60" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[14px] font-semibold group-hover:text-primary">{template.name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{template.category}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/templates">
              Browse all templates
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <Section className="border-y border-border bg-card/40">
        <SectionIntro eyebrow="How it works" title="From first product to first order" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <span className="text-[13px] font-mono font-semibold text-primary">{step.n}</span>
              <h3 className="mt-2 text-[15px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <Section id="pricing">
        <SectionIntro
          eyebrow="Pricing"
          title="Start free. Upgrade when it pays for itself."
          body="Prices in Sri Lankan Rupees. Cancel any time — your website stays published on the free plan."
        />
        <div className="mt-12">
          <PricingTable />
        </div>
      </Section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <Section className="border-y border-border bg-card/40">
        <SectionIntro eyebrow="Customers" title="Shops already running on Helabiz" />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <blockquote className="flex-1 text-[14.5px] leading-relaxed text-foreground">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary-muted text-[12px] font-semibold text-primary">
                  {t.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">{t.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] sm:text-[34px]">
              Questions we get asked
            </h2>
            <p className="mt-3 text-[15px] text-muted-foreground">
              Still unsure? Create a free account — you can see the whole builder before you decide.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
            <div className="relative">
              <Rocket className="mx-auto size-7 text-primary" />
              <h2 className="mt-5 text-[30px] font-semibold tracking-[-0.03em] sm:text-[38px]">
                I can build my business website myself.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15.5px] text-muted-foreground text-pretty">
                That is the whole idea. Create your account, pick a template and be online before the end of the day.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="xl" asChild className="w-full sm:w-auto">
                  <Link href="/sign-up">
                    Start free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Local layout helpers ─────────────────────────────────────────────── */

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">{children}</div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.028em] sm:text-[36px]">{title}</h2>
      {body && <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground text-pretty">{body}</p>}
    </div>
  );
}

function HalfCard({
  icon: Icon,
  kicker,
  title,
  body,
  points,
  href,
  tone = "primary",
}: {
  icon: typeof Globe;
  kicker: string;
  title: string;
  body: string;
  points: string[];
  href: string;
  tone?: "primary" | "gold";
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-xl",
          tone === "gold" ? "bg-gold/12 text-gold" : "bg-primary-muted text-primary",
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{kicker}</p>
      <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-[13.5px] text-foreground">
            <Check className={cn("size-3.5 shrink-0", tone === "gold" ? "text-gold" : "text-primary")} />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary hover:underline"
      >
        Learn more <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

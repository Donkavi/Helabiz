import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  ExternalLink,
  Globe,
  LayoutTemplate,
  PanelsTopLeft,
  Rocket,
  Settings,
  Sparkles,
} from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB, serialize } from "@/lib/db/mongoose";
import { Website } from "@/models/Website";
import { WebsitePage } from "@/models/WebsitePage";
import { Product } from "@/models/Product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { websiteMetrics, daysAgo } from "@/services/metrics-service";
import { formatNumber, relativeTime } from "@/lib/utils";
import { siteUrlFor, siteDisplayUrl } from "@/lib/website/urls";
import { getTheme } from "@/lib/website/themes";
import { TemplateChooser } from "./template-chooser";
import { PublishControls } from "./publish-controls";

export const metadata: Metadata = { title: "Website" };

export default async function WebsiteOverviewPage() {
  const { business, businessId } = await requireBusiness();
  await connectDB();

  const website = await Website.findOne({ businessId }).lean();

  if (!website) {
    const productCount = await Product.countDocuments({ businessId, status: { $ne: "archived" } });
    return (
      <div className="space-y-6">
        <PageHeader
          title="Website"
          description="Build a professional website for your business — no code, no developer."
        />
        <TemplateChooser productCount={productCount} />
      </div>
    );
  }

  const [pages, metrics, homePage] = await Promise.all([
    WebsitePage.find({ websiteId: website._id, businessId }).sort({ sortOrder: 1 }).lean(),
    websiteMetrics(businessId, daysAgo(30)),
    WebsitePage.findOne({ websiteId: website._id, isHome: true }).select("_id").lean(),
  ]);

  const plain = serialize(website);
  const theme = getTheme(plain.themeId);
  const liveUrl = siteUrlFor(business.slug);
  const published = plain.status === "published";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website"
        description="Your online shop front. Edit it visually and publish when you are happy."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="size-4" />
                Preview
              </a>
            </Button>
            {homePage && (
              <Button asChild>
                <Link href={`/website/builder/${homePage._id}`}>
                  <Sparkles className="size-4" />
                  Open builder
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Status card */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 py-5">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: plain.theme?.primary ?? theme.tokens.primary, color: "#fff" }}
          >
            <Globe className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold">{plain.name}</h2>
              <Badge variant={published ? "success" : "muted"}>{published ? "Published" : "Draft"}</Badge>
              {published && plain.hasUnpublishedChanges && <Badge variant="warning">Unpublished changes</Badge>}
            </div>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              {siteDisplayUrl(plain.subdomain)}
              <ExternalLink className="size-3" />
            </a>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              {published
                ? `Published ${relativeTime(plain.publishedAt as unknown as string)}`
                : "Not visible to the public yet"}
              {plain.lastEditedAt && ` · edited ${relativeTime(plain.lastEditedAt as unknown as string)}`}
            </p>
          </div>

          <PublishControls published={published} hasChanges={Boolean(plain.hasUnpublishedChanges)} liveUrl={liveUrl} />
        </CardContent>
      </Card>

      {/* Traffic */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitors" value={formatNumber(metrics.visitors)} sublabel="last 30 days" icon={Eye} />
        <StatCard label="Page views" value={formatNumber(metrics.pageViews)} sublabel="last 30 days" />
        <StatCard
          label="Website orders"
          value={formatNumber(metrics.orders)}
          sublabel="last 30 days"
          icon={Rocket}
          tone="primary"
          href="/orders?source=website"
        />
        <StatCard
          label="Conversion"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          sublabel="visitors who ordered"
          href="/website/analytics"
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          href="/website/pages"
          icon={PanelsTopLeft}
          title="Pages"
          body={`${pages.length} page${pages.length === 1 ? "" : "s"} — add, rename or reorder them.`}
        />
        <QuickLink
          href="/website/themes"
          icon={LayoutTemplate}
          title="Themes"
          body={`Currently using ${theme.name}. Swap colours and fonts in one click.`}
        />
        <QuickLink
          href="/website/analytics"
          icon={Sparkles}
          title="Analytics"
          body="See what people view, what they add to the cart and what they buy."
        />
        <QuickLink
          href="/website/settings"
          icon={Settings}
          title="Settings"
          body="Web address, SEO, cart and checkout options."
        />
      </div>

      {/* Pages list */}
      <Card>
        <CardHeader className="flex-row items-center">
          <CardTitle>Your pages</CardTitle>
          <Button variant="ghost" size="sm" className="ml-auto" asChild>
            <Link href="/website/pages">
              Manage
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y divide-border">
            {serialize(pages).map((page) => (
              <li key={String(page._id)}>
                <Link
                  href={`/website/builder/${page._id}`}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <PanelsTopLeft className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{page.title}</span>
                    <span className="block truncate font-mono text-[12px] text-muted-foreground">
                      /{page.isHome ? "" : page.slug}
                    </span>
                  </span>
                  {page.isHome && <Badge variant="soft">Home</Badge>}
                  {page.hidden && <Badge variant="muted">Hidden</Badge>}
                  <span className="text-[12px] text-muted-foreground">
                    {Array.isArray(page.sections) ? page.sections.length : 0} sections
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof Globe;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary">
        <Icon className="size-4" />
      </span>
      <h3 className="mt-3.5 text-[14.5px] font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
    </Link>
  );
}

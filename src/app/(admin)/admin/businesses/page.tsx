import Link from "next/link";
import { Search } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { listBusinesses } from "@/services/admin-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, relativeTime } from "@/lib/utils";
import { Pagination } from "../pagination";

export const metadata = { title: "Businesses" };

const PLANS = ["all", "free", "starter", "business"];
const STATUSES = ["all", "active", "suspended"];

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const query = {
    search: params.q,
    plan: params.plan ?? "all",
    status: params.status ?? "all",
    page: Number(params.page) || 1,
  };
  const { rows, total, page, pages } = await listBusinesses(query);

  // Filters are links rather than a client form: the list is server rendered,
  // so the URL is the state and the back button works.
  const linkTo = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, plan: query.plan, status: query.status, ...patch };
    if (merged.q) next.set("q", merged.q);
    if (merged.plan && merged.plan !== "all") next.set("plan", merged.plan);
    if (merged.status && merged.status !== "all") next.set("status", merged.status);
    const qs = next.toString();
    return `/admin/businesses${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description={`${formatNumber(total)} on the platform.`}
      />

      <Card>
        <CardContent className="space-y-4 py-5">
          <form method="get" className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name, slug, email or phone"
              aria-label="Search businesses"
              className="pl-9"
            />
            {query.plan !== "all" && <input type="hidden" name="plan" value={query.plan} />}
            {query.status !== "all" && <input type="hidden" name="status" value={query.status} />}
          </form>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Plan</span>
              {PLANS.map((plan) => (
                <Link
                  key={plan}
                  href={linkTo({ plan })}
                  className={
                    query.plan === plan
                      ? "rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground"
                      : "rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                >
                  {plan}
                </Link>
              ))}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Status</span>
              {STATUSES.map((status) => (
                <Link
                  key={status}
                  href={linkTo({ status })}
                  className={
                    query.status === status
                      ? "rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground"
                      : "rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                >
                  {status}
                </Link>
              ))}
            </span>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              compact
              title="Nothing matches"
              description="Try a different search, or clear the filters."
            />
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} className="cursor-pointer">
                        <TableCell>
                          <Link href={`/admin/businesses/${row.id}`} className="block">
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{row.name}</span>
                              {row.status === "suspended" && <Badge variant="destructive">suspended</Badge>}
                            </span>
                            <span className="block font-mono text-[12px] text-muted-foreground">/{row.slug}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="block text-[13px]">{row.ownerName}</span>
                          <span className="block text-[12px] text-muted-foreground">{row.ownerEmail}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.plan === "free" ? "muted" : "default"}>{row.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.websiteStatus === "published" ? "success" : "muted"}>
                            {row.websiteStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(row.orders)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(row.products)}</TableCell>
                        <TableCell className="text-right text-[12.5px] text-muted-foreground">
                          {relativeTime(row.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination page={page} pages={pages} basePath={linkTo({})} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

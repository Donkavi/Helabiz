import Link from "next/link";
import { Search } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import { listUsers } from "@/services/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, relativeTime } from "@/lib/utils";
import { Pagination } from "../pagination";
import { RoleToggle } from "./role-toggle";

export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const admin = await requireSuperAdmin();
  const params = await searchParams;

  const role = params.role ?? "all";
  const { rows, total, page, pages } = await listUsers({
    search: params.q,
    role,
    page: Number(params.page) || 1,
  });

  const linkTo = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, role, ...patch };
    if (merged.q) next.set("q", merged.q);
    if (merged.role && merged.role !== "all") next.set("role", merged.role);
    const qs = next.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`${formatNumber(total)} accounts.`} />

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <form method="get" className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Name, email or phone"
                aria-label="Search users"
                className="pl-9"
              />
              {role !== "all" && <input type="hidden" name="role" value={role} />}
            </form>

            <span className="flex items-center gap-1.5 text-[13px]">
              {["all", "admin"].map((value) => (
                <Link
                  key={value}
                  href={linkTo({ role: value })}
                  className={
                    role === value
                      ? "rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground"
                      : "rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                >
                  {value === "all" ? "Everyone" : "Administrators"}
                </Link>
              ))}
            </span>
          </div>

          {rows.length === 0 ? (
            <EmptyState compact title="Nothing matches" description="Try a different search." />
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Businesses</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                      <TableHead className="text-right">Platform access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <span className="block text-[13.5px] font-medium">
                            {row.name}
                            {row.id === admin.id && (
                              <span className="ml-2 text-[12px] font-normal text-muted-foreground">(you)</span>
                            )}
                          </span>
                          <span className="block text-[12px] text-muted-foreground">{row.email}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(row.businesses)}</TableCell>
                        <TableCell className="text-right text-[12.5px] text-muted-foreground">
                          {relativeTime(row.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <RoleToggle
                            userId={row.id}
                            name={row.name}
                            role={row.platformRole}
                            isSelf={row.id === admin.id}
                          />
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

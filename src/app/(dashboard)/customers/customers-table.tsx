"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, initials, relativeTime } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { CustomerDialog, type CustomerValues } from "./customer-dialog";
import { deleteCustomerAction } from "./actions";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  type: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
};

const TYPE_VARIANT: Record<string, "default" | "success" | "muted" | "soft"> = {
  vip: "default",
  regular: "success",
  new: "soft",
  inactive: "muted",
};

export function CustomersTable({ customers, initialQuery }: { customers: CustomerRow[]; initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [editing, setEditing] = React.useState<CustomerValues | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(query ? `/customers?q=${encodeURIComponent(query)}` : "/customers", { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, router]);

  const visible = customers.filter((c) =>
    `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or email"
          className="pl-9"
          aria-label="Search customers"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState compact icon={Search} title="No customers match that search" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="flex items-center gap-3 group">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[11px] font-semibold text-primary">
                        {initials(customer.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium group-hover:text-primary">
                          {customer.name}
                        </span>
                        <span className="block text-[12px] text-muted-foreground">{customer.phone}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{customer.city || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[customer.type] ?? "muted"} className="capitalize">
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[13.5px] tabular-nums">{customer.totalOrders}</TableCell>
                  <TableCell className="text-right text-[13.5px] font-semibold tabular-nums">
                    {formatCurrency(customer.totalSpent, { decimals: false })}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {customer.lastOrderAt ? relativeTime(customer.lastOrderAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${customer.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => router.push(`/customers/${customer.id}`)}>
                          View history
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setEditing({
                              id: customer.id,
                              name: customer.name,
                              phone: customer.phone,
                              email: customer.email,
                              address: "",
                              city: customer.city,
                              district: "",
                              notes: "",
                              type: customer.type,
                            })
                          }
                        >
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={whatsappLink(customer.phone, `Hello ${customer.name},`)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle /> Message on WhatsApp
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={pending}
                          onSelect={() =>
                            startTransition(async () => {
                              await deleteCustomerAction(customer.id);
                              toast.success("Customer deleted");
                              router.refresh();
                            })
                          }
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <CustomerDialog
          key={editing.id}
          customer={editing}
          open
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </div>
  );
}

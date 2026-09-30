"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ImageOff, MoreHorizontal, Pencil, RotateCcw, Search, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { deleteProductAction, restoreProductAction, toggleFeaturedAction } from "./actions";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  /** For a product with variants: the cheapest variant's price, cost and compare-at, and total stock. */
  price: number;
  maxPrice: number;
  compareAtPrice?: number;
  costPrice: number;
  stock: number;
  variantCount: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  image?: string;
  status: string;
  featured: boolean;
  categoryId?: string;
  sold: number;
};

export function ProductsTable({
  products,
  categories,
  initialQuery,
  initialStatus,
  initialCategory,
}: {
  products: ProductRow[];
  categories: { id: string; name: string; slug: string }[];
  initialQuery: string;
  initialStatus: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [status, setStatus] = React.useState(initialStatus);
  const [category, setCategory] = React.useState(initialCategory);
  const [pending, startTransition] = React.useTransition();

  // Filtering is client-side over the loaded page so typing feels instant; the
  // URL is kept in sync so the filter survives a refresh or share.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status !== "active") params.set("status", status);
      if (category !== "all") params.set("category", category);
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, status, category, router]);

  const visible = products.filter((p) => {
    if (query && !`${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== "all" && p.categoryId !== category) return false;
    return true;
  });

  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name;

  const run = (fn: () => Promise<unknown>, message: string) => {
    startTransition(async () => {
      await fn();
      toast.success(message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name or SKU"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          compact
          icon={Search}
          title="No products match those filters"
          description="Try a different search term or clear the filters."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("active");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((product) => {
                const margin = product.price > 0 ? ((product.price - product.costPrice) / product.price) * 100 : 0;
                const low = product.trackInventory && product.stock <= product.lowStockThreshold;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link href={`/products/${product.id}`} className="flex items-center gap-3 group">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt="" className="size-full object-cover" loading="lazy" />
                          ) : (
                            <ImageOff className="size-3.5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[13.5px] font-medium group-hover:text-primary">
                              {product.name}
                            </span>
                            {product.featured && <Star className="size-3 shrink-0 fill-gold text-gold" />}
                          </span>
                          {(product.sku || product.variantCount > 0) && (
                            <span className="block text-[12px] text-muted-foreground">
                              {[product.sku, product.variantCount > 0 && `${product.variantCount} variants`]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {categoryName(product.categoryId) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[13.5px] font-medium tabular-nums">
                        {formatCurrency(product.price, { decimals: false })}
                        {product.maxPrice > product.price &&
                          ` – ${formatCurrency(product.maxPrice, { decimals: false })}`}
                      </span>
                      {product.compareAtPrice && (
                        <span className="block text-[12px] text-muted-foreground line-through tabular-nums">
                          {formatCurrency(product.compareAtPrice, { decimals: false })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums text-muted-foreground">
                      {product.costPrice > 0 ? `${margin.toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.trackInventory ? (
                        <Badge variant={product.stock <= 0 ? "destructive" : low ? "warning" : "muted"}>
                          {product.stock}
                        </Badge>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">Not tracked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "active" ? "success" : product.status === "draft" ? "muted" : "secondary"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/products/${product.id}`)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={pending}
                            onSelect={() =>
                              run(
                                () => toggleFeaturedAction(product.id, !product.featured),
                                product.featured ? "Removed from featured" : "Marked as featured",
                              )
                            }
                          >
                            {product.featured ? <StarOff /> : <Star />}
                            {product.featured ? "Unfeature" : "Feature on website"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.status === "archived" ? (
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() => run(() => restoreProductAction(product.id), "Product restored")}
                            >
                              <RotateCcw /> Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={pending}
                              onSelect={() => run(() => deleteProductAction(product.id), "Product archived")}
                            >
                              <Archive /> Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-[12.5px] text-muted-foreground">
        Showing {visible.length} of {products.length} products
      </p>
    </div>
  );
}

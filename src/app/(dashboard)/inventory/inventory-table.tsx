"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImageOff, PackagePlus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { adjustStockAction } from "../products/actions";

type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  image?: string;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  price: number;
};

export function InventoryTable({ products }: { products: InventoryRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [adjusting, setAdjusting] = React.useState<InventoryRow | null>(null);

  const visible = products.filter((product) => {
    if (query && !`${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "low") return product.stock > 0 && product.stock <= product.lowStockThreshold;
    if (filter === "out") return product.stock <= 0;
    return true;
  });

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Stock levels</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="pl-9"
              aria-label="Search inventory"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="low">Running low</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Product</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-24 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((product) => {
              const low = product.stock > 0 && product.stock <= product.lowStockThreshold;
              return (
                <TableRow key={product.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt="" className="size-full object-cover" loading="lazy" />
                        ) : (
                          <ImageOff className="size-3.5 text-muted-foreground" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{product.name}</p>
                        {product.sku && <p className="text-[12px] text-muted-foreground">{product.sku}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={product.stock <= 0 ? "destructive" : low ? "warning" : "muted"}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums text-muted-foreground">
                    {formatCurrency(product.stock * product.costPrice, { decimals: false })}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button size="sm" variant="outline" onClick={() => setAdjusting(product)}>
                      <PackagePlus className="size-3.5" />
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {visible.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">No products match those filters.</p>
        )}
      </CardContent>

      <AdjustDialog
        key={adjusting?.id ?? "none"}
        product={adjusting}
        onClose={() => setAdjusting(null)}
        onDone={() => {
          setAdjusting(null);
          router.refresh();
        }}
      />
    </Card>
  );
}

function AdjustDialog({
  product,
  onClose,
  onDone,
}: {
  product: InventoryRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = React.useState("restock");
  const [quantity, setQuantity] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (!product) return null;

  const delta = type === "damage" ? -Math.abs(Number(quantity) || 0) : Number(quantity) || 0;
  const after = Math.max(0, product.stock + delta);

  const submit = () => {
    const data = new FormData();
    data.set("productId", product.id);
    data.set("type", type);
    data.set("quantity", quantity);
    data.set("note", note);

    startTransition(async () => {
      const result = await adjustStockAction(null, data);
      if (result?.ok === false) {
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Could not adjust stock");
        return;
      }
      toast.success("Stock updated");
      onDone();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {product.name} · currently {product.stock} in stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-type">Reason</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="adjust-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restocked — new stock arrived</SelectItem>
                <SelectItem value="adjustment">Correction — recount</SelectItem>
                <SelectItem value="return">Customer return</SelectItem>
                <SelectItem value="damage">Damaged or lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-qty">Quantity</Label>
            <Input
              id="adjust-qty"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Use a negative number to reduce"
            />
            <p className="text-[12.5px] text-muted-foreground">
              New stock level will be <span className="font-medium text-foreground">{after}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-note">Note</Label>
            <Textarea
              id="adjust-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Delivery from supplier, stocktake correction…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending}>
            Save adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

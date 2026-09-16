"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageOff, Minus, Plus, Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";
import { ORDER_STATUS_OPTIONS, PAYMENT_METHOD_LABELS, SOURCE_LABELS } from "@/components/dashboard/order-status-badge";
import { createOrderAction } from "../actions";

type CatalogueProduct = {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  trackInventory: boolean;
  image?: string;
  sku?: string;
  variants: { id: string; name: string; price?: number; stock: number }[];
};

type Line = {
  key: string;
  productId?: string;
  variantId?: string;
  name: string;
  variantName?: string;
  image?: string;
  price: number;
  costPrice: number;
  quantity: number;
  stock?: number;
};

export function OrderComposer({
  products,
  customers,
  defaultDeliveryFee,
}: {
  products: CatalogueProduct[];
  customers: { id: string; name: string; phone: string; address?: string; city?: string; district?: string }[];
  defaultDeliveryFee: number;
}) {
  const router = useRouter();
  const [lines, setLines] = React.useState<Line[]>([]);
  const [search, setSearch] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [customer, setCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
  });
  const [meta, setMeta] = React.useState({
    discount: "0",
    deliveryFee: String(defaultDeliveryFee),
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "cod",
    source: "manual",
    notes: "",
  });

  const filtered = products
    .filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 40);

  const addLine = (product: CatalogueProduct, variant?: CatalogueProduct["variants"][number]) => {
    const key = `${product.id}:${variant?.id ?? ""}`;
    setLines((current) => {
      const existing = current.find((l) => l.key === key);
      if (existing) return current.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...current,
        {
          key,
          productId: product.id,
          variantId: variant?.id,
          name: product.name,
          variantName: variant?.name,
          image: product.image,
          price: variant?.price ?? product.price,
          costPrice: product.costPrice,
          quantity: 1,
          stock: product.trackInventory ? (variant?.stock ?? product.stock) : undefined,
        },
      ];
    });
  };

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const discount = Math.min(Number(meta.discount) || 0, subtotal);
  const deliveryFee = Number(meta.deliveryFee) || 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const pickCustomer = (id: string) => {
    const found = customers.find((c) => c.id === id);
    if (!found) return;
    setCustomer({
      name: found.name,
      phone: found.phone,
      email: "",
      address: found.address ?? "",
      city: found.city ?? "",
      district: found.district ?? "",
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    if (!lines.length) {
      toast.error("Add at least one product to the order");
      return;
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      address: customer.address,
      city: customer.city,
      district: customer.district,
      items: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        variantName: l.variantName,
        image: l.image,
        price: l.price,
        costPrice: l.costPrice,
        quantity: l.quantity,
      })),
      discount,
      deliveryFee,
      status: meta.status,
      paymentStatus: meta.paymentStatus,
      paymentMethod: meta.paymentMethod,
      source: meta.source,
      notes: meta.notes,
    };

    const data = new FormData();
    data.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      const result = await createOrderAction(null, data);
      if (result?.ok === false) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Could not create the order");
        return;
      }
      toast.success("Order created");
      router.push(result?.data ? `/orders/${result.data.id}` : "/orders");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon-sm" asChild>
            <Link href="/orders" aria-label="Back to orders">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">New order</h1>
            <p className="text-[13px] text-muted-foreground">
              Record an order that came in by phone, WhatsApp or in person.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/orders">Cancel</Link>
          </Button>
          <Button type="submit" loading={pending} disabled={!lines.length}>
            Create order
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your products"
                  className="pl-9"
                  aria-label="Search products"
                />
              </div>

              {search && (
                <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin rounded-lg border border-border p-1.5">
                  {filtered.length === 0 && (
                    <p className="px-2 py-4 text-center text-[13px] text-muted-foreground">No products found.</p>
                  )}
                  {filtered.map((product) =>
                    product.variants.length ? (
                      <div key={product.id} className="rounded-lg p-2">
                        <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {product.name}
                        </p>
                        <div className="grid gap-1">
                          {product.variants.map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => addLine(product, variant)}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent"
                            >
                              <span className="flex-1">{variant.name}</span>
                              <span className="text-muted-foreground">{variant.stock} left</span>
                              <span className="font-medium">
                                {formatCurrency(variant.price ?? product.price, { decimals: false })}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addLine(product)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageOff className="size-3.5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{product.name}</span>
                          <span className="block text-[12px] text-muted-foreground">
                            {product.trackInventory ? `${product.stock} in stock` : "Stock not tracked"}
                          </span>
                        </span>
                        <span className="text-[13.5px] font-semibold">
                          {formatCurrency(product.price, { decimals: false })}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              )}

              {lines.length === 0 ? (
                <EmptyState
                  compact
                  icon={Search}
                  title="No products added yet"
                  description="Search above to add products to this order."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {lines.map((line) => (
                    <li key={line.key} className="flex items-center gap-3 py-3">
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                        {line.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={line.image} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageOff className="size-3.5 text-muted-foreground" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">
                          {line.name}
                          {line.variantName && <span className="text-muted-foreground"> · {line.variantName}</span>}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {formatCurrency(line.price, { decimals: false })} each
                          {line.stock !== undefined && line.quantity > line.stock && (
                            <span className="text-destructive"> · only {line.stock} in stock</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() =>
                            setLines((current) =>
                              current
                                .map((l) => (l.key === line.key ? { ...l, quantity: l.quantity - 1 } : l))
                                .filter((l) => l.quantity > 0),
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center text-[13.5px] font-medium tabular-nums">{line.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() =>
                            setLines((current) =>
                              current.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + 1 } : l)),
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus />
                        </Button>
                      </div>
                      <p className="w-24 shrink-0 text-right text-[13.5px] font-semibold tabular-nums">
                        {formatCurrency(line.price * line.quantity, { decimals: false })}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {customers.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Existing customer</Label>
                  <Select onValueChange={pickCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a saved customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.slice(0, 100).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} · {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">Name *</Label>
                  <Input
                    id="customerName"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    required
                    aria-invalid={!!errors.customerName}
                  />
                  {errors.customerName && <p className="text-[12.5px] text-destructive">{errors.customerName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone">Phone *</Label>
                  <Input
                    id="customerPhone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="077 123 4567"
                    required
                    aria-invalid={!!errors.customerPhone}
                  />
                  {errors.customerPhone && <p className="text-[12.5px] text-destructive">{errors.customerPhone}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Delivery address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="district">District</Label>
                  <Select value={customer.district} onValueChange={(v) => setCustomer({ ...customer, district: v })}>
                    <SelectTrigger id="district">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {SRI_LANKA_DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2 text-[13.5px]">
                <Row label="Subtotal" value={formatCurrency(subtotal, { decimals: false })} />
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="discount" className="text-muted-foreground">
                    Discount
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    value={meta.discount}
                    onChange={(e) => setMeta({ ...meta, discount: e.target.value })}
                    className="h-8 w-28 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="deliveryFee" className="text-muted-foreground">
                    Delivery
                  </Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    min={0}
                    value={meta.deliveryFee}
                    onChange={(e) => setMeta({ ...meta, deliveryFee: e.target.value })}
                    className="h-8 w-28 text-right"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between text-[16px] font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(total, { decimals: false })}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SelectField
                  label="Order status"
                  value={meta.status}
                  onChange={(v) => setMeta({ ...meta, status: v })}
                  options={ORDER_STATUS_OPTIONS}
                />
                <SelectField
                  label="Payment"
                  value={meta.paymentStatus}
                  onChange={(v) => setMeta({ ...meta, paymentStatus: v })}
                  options={[
                    { value: "unpaid", label: "Unpaid" },
                    { value: "paid", label: "Paid" },
                    { value: "partial", label: "Partly paid" },
                  ]}
                />
                <SelectField
                  label="Payment method"
                  value={meta.paymentMethod}
                  onChange={(v) => setMeta({ ...meta, paymentMethod: v })}
                  options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <SelectField
                  label="Where did it come from?"
                  value={meta.source}
                  onChange={(v) => setMeta({ ...meta, source: v })}
                  options={Object.entries(SOURCE_LABELS)
                    .filter(([value]) => value !== "website")
                    .map(([value, label]) => ({ value, label }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={meta.notes}
                  onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
                  placeholder="Deliver after 5pm, call before arriving…"
                />
              </div>

              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[12.5px] text-muted-foreground">
                <UserRound className="mt-px size-3.5 shrink-0" />
                Saving this order adds the customer to your customer list and reduces stock automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

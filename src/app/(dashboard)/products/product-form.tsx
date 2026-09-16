"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch, Separator } from "@/components/ui/misc";
import { MediaPicker } from "@/components/dashboard/media-picker";
import { formatCurrency, slugify } from "@/lib/utils";
import { saveProductAction } from "./actions";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number | string;
  compareAtPrice: number | string;
  costPrice: number | string;
  stock: number | string;
  lowStockThreshold: number | string;
  trackInventory: boolean;
  images: string[];
  categoryId: string;
  tags: string[];
  status: string;
  featured: boolean;
  variants: { _id?: string; name: string; sku: string; price: number | string; stock: number | string }[];
  seoTitle: string;
  seoDescription: string;
};

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  stock: 0,
  lowStockThreshold: 5,
  trackInventory: true,
  images: [],
  categoryId: "",
  tags: [],
  status: "active",
  featured: false,
  variants: [],
  seoTitle: "",
  seoDescription: "",
};

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<ProductFormValues>(initial);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [tagDraft, setTagDraft] = React.useState("");

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const price = Number(values.price) || 0;
  const cost = Number(values.costPrice) || 0;
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const payload = {
      ...values,
      slug: values.slug || slugify(values.name),
      price: Number(values.price) || 0,
      compareAtPrice: values.compareAtPrice === "" ? undefined : Number(values.compareAtPrice),
      costPrice: Number(values.costPrice) || 0,
      stock: Number(values.stock) || 0,
      lowStockThreshold: Number(values.lowStockThreshold) || 0,
      variants: values.variants.map((v) => ({
        ...v,
        price: v.price === "" ? undefined : Number(v.price),
        stock: Number(v.stock) || 0,
      })),
    };

    const data = new FormData();
    if (values.id) data.set("id", values.id);
    data.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      const result = await saveProductAction(null, data);
      if (result?.ok === false) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Could not save the product");
        return;
      }
      toast.success(values.id ? "Product updated" : "Product added");
      router.push("/products");
      router.refresh();
    });
  };

  const addTag = () => {
    const tag = tagDraft.trim();
    if (!tag || values.tags.includes(tag)) return;
    set("tags", [...values.tags, tag]);
    setTagDraft("");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon-sm" asChild>
            <Link href="/products" aria-label="Back to products">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">
              {values.id ? "Edit product" : "Add product"}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {values.id ? values.name : "It will be ready to sell on your website straight away."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" loading={pending}>
            {values.id ? "Save changes" : "Add product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Field label="Product name" error={errors.name} required>
                <Input
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Oversized cotton t-shirt"
                  required
                  aria-invalid={!!errors.name}
                />
              </Field>

              <Field label="Short description" hint="One line shown on product cards and in search results.">
                <Input
                  value={values.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  placeholder="Heavyweight cotton, relaxed fit"
                  maxLength={300}
                />
              </Field>

              <Field label="Full description">
                <Textarea
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={6}
                  placeholder="Tell customers about the fabric, sizing, care instructions and anything else they ask you about."
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <p className="text-[12.5px] text-muted-foreground">
                The first image is used on product cards. Drag to reorder.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {values.images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData("text/plain"));
                      if (Number.isNaN(from) || from === index) return;
                      const next = [...values.images];
                      const [moved] = next.splice(from, 1);
                      next.splice(index, 0, moved);
                      set("images", next);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                    {index === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-semibold text-background">
                        Main
                      </span>
                    )}
                    <span className="absolute left-1.5 bottom-1.5 text-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                      <GripVertical className="size-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={() => set("images", values.images.filter((_, i) => i !== index))}
                      className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ImagePlus className="size-4" />
                  <span className="text-[12px] font-medium">Add images</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <p className="text-[12.5px] text-muted-foreground">
                Optional. Use for sizes, colours or flavours that have their own stock.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {values.variants.map((variant, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
                  <Input
                    value={variant.name}
                    onChange={(e) =>
                      set("variants", values.variants.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)))
                    }
                    placeholder="Medium / Black"
                    aria-label="Variant name"
                  />
                  <Input
                    value={variant.sku}
                    onChange={(e) =>
                      set("variants", values.variants.map((v, i) => (i === index ? { ...v, sku: e.target.value } : v)))
                    }
                    placeholder="SKU"
                    aria-label="Variant SKU"
                  />
                  <Input
                    value={variant.price}
                    onChange={(e) =>
                      set("variants", values.variants.map((v, i) => (i === index ? { ...v, price: e.target.value } : v)))
                    }
                    type="number"
                    min={0}
                    placeholder="Price"
                    aria-label="Variant price"
                  />
                  <Input
                    value={variant.stock}
                    onChange={(e) =>
                      set("variants", values.variants.map((v, i) => (i === index ? { ...v, stock: e.target.value } : v)))
                    }
                    type="number"
                    min={0}
                    placeholder="Stock"
                    aria-label="Variant stock"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => set("variants", values.variants.filter((_, i) => i !== index))}
                    aria-label="Remove variant"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("variants", [...values.variants, { name: "", sku: "", price: "", stock: 0 }])}
              >
                <Plus className="size-3.5" />
                Add variant
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search engine listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Field label="Page title" hint="Shown as the headline in Google results.">
                <Input
                  value={values.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  maxLength={70}
                  placeholder={values.name}
                />
              </Field>
              <Field label="Meta description">
                <Textarea
                  value={values.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  rows={3}
                  maxLength={180}
                  placeholder={values.shortDescription || "A short summary for search engines."}
                />
              </Field>
              <Field label="URL slug" hint={`Your product page: /products/${values.slug || slugify(values.name) || "…"}`}>
                <Input
                  value={values.slug}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder={slugify(values.name)}
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Field label="Selling price" error={errors.price} required>
                <Input
                  value={values.price}
                  onChange={(e) => set("price", e.target.value)}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="4500"
                  required
                  aria-invalid={!!errors.price}
                />
              </Field>
              <Field label="Compare-at price" error={errors.compareAtPrice} hint="Shows a struck-through 'was' price.">
                <Input
                  value={values.compareAtPrice}
                  onChange={(e) => set("compareAtPrice", e.target.value)}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="6000"
                  aria-invalid={!!errors.compareAtPrice}
                />
              </Field>
              <Field label="Cost price" hint="What you pay. Used to work out profit — never shown to customers.">
                <Input
                  value={values.costPrice}
                  onChange={(e) => set("costPrice", e.target.value)}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="2200"
                />
              </Field>

              {price > 0 && cost > 0 && (
                <div className="rounded-lg bg-muted/60 p-3 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit per sale</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(price - cost, { decimals: false })}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Margin</span>
                    <span className="font-semibold tabular-nums">{margin.toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13.5px] font-medium">Track stock</p>
                  <p className="text-[12.5px] text-muted-foreground">Website orders reduce it automatically.</p>
                </div>
                <Switch checked={values.trackInventory} onCheckedChange={(v) => set("trackInventory", v)} />
              </div>

              {values.trackInventory && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Stock on hand">
                      <Input
                        value={values.stock}
                        onChange={(e) => set("stock", e.target.value)}
                        type="number"
                        min={0}
                      />
                    </Field>
                    <Field label="Low stock at">
                      <Input
                        value={values.lowStockThreshold}
                        onChange={(e) => set("lowStockThreshold", e.target.value)}
                        type="number"
                        min={0}
                      />
                    </Field>
                  </div>
                </>
              )}

              <Field label="SKU">
                <Input value={values.sku} onChange={(e) => set("sku", e.target.value)} placeholder="TSH-BLK-M" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Field label="Status">
                <Select value={values.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active — visible on your website</SelectItem>
                    <SelectItem value="draft">Draft — hidden</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Category">
                <Select value={values.categoryId || "none"} onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13.5px] font-medium">Featured</p>
                  <p className="text-[12.5px] text-muted-foreground">Show in featured sections on your website.</p>
                </div>
                <Switch checked={values.featured} onCheckedChange={(v) => set("featured", v)} />
              </div>

              <Field label="Tags">
                <div className="flex gap-2">
                  <Input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Add tag">
                    <Plus />
                  </Button>
                </div>
                {values.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {values.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[12px] font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => set("tags", values.tags.filter((t) => t !== tag))}
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        onSelect={(urls) => set("images", [...values.images, ...urls].slice(0, 12))}
        title="Product images"
      />
    </form>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div id={id}>{children}</div>
      {error ? (
        <p className="text-[12.5px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

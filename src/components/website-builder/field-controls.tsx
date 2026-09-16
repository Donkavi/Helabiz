"use client";

import * as React from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/lib/website/fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch, Slider, Popover, PopoverContent, PopoverTrigger } from "@/components/ui/misc";
import { ImageField } from "@/components/dashboard/media-picker";
import { ICON_KEYS } from "@/lib/website/icons";
import { Glyph } from "@/components/website/glyph";
import { cn } from "@/lib/utils";

export type FieldContext = {
  products: { id: string; name: string; price: number; image?: string }[];
  categories: { id: string; name: string }[];
  pages: { title: string; slug: string }[];
};

/* ── Small shared controls ────────────────────────────────────────────── */

export function ControlRow({
  label,
  children,
  hint,
  action,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[12px] text-muted-foreground">{label}</Label>
        {action}
      </div>
      {children}
      {hint && <p className="text-[11.5px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-all",
            value === option.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const SWATCHES = [
  "#111111", "#ffffff", "#0f766e", "#2563eb", "#b4341f", "#c2762b",
  "#a8577a", "#7c3aed", "#f6f4f1", "#f1f5f9", "#1e293b", "transparent",
];

export function ColorControl({
  value,
  onChange,
  allowClear,
}: {
  value?: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
}) {
  const display = value && value !== "transparent" ? value : "#ffffff";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-card px-2 text-left text-[12.5px] transition-colors hover:bg-accent"
        >
          <span
            className="size-4 shrink-0 rounded border border-border"
            style={{
              background:
                !value || value === "transparent"
                  ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/8px 8px"
                  : value,
            }}
          />
          <span className="flex-1 truncate font-mono">{value || "Not set"}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="grid grid-cols-6 gap-1.5">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => onChange(swatch)}
              aria-label={swatch}
              className={cn(
                "size-7 rounded-md border border-border transition-transform hover:scale-105",
                value === swatch && "ring-2 ring-primary ring-offset-1 ring-offset-popover",
              )}
              style={{
                background:
                  swatch === "transparent"
                    ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/8px 8px"
                    : swatch,
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            value={display}
            onChange={(e) => onChange(e.target.value)}
            className="size-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
            aria-label="Pick a custom colour"
          />
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="h-8 font-mono text-[12px]"
          />
        </div>
        {allowClear && (
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => onChange("")}>
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function SliderControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        className="flex-1"
      />
      <span className="w-14 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
        {value}
        {unit ?? ""}
      </span>
    </div>
  );
}

function IconPicker({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-card px-2 text-left text-[12.5px] transition-colors hover:bg-accent"
        >
          <Glyph name={value} className="size-3.5 text-primary" />
          <span className="flex-1 truncate">{value || "Choose an icon"}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto scrollbar-thin">
          {ICON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              title={key}
              aria-label={key}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-accent",
                value === key && "bg-primary-muted text-primary",
              )}
            >
              <Glyph name={key} className="size-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Repeater ─────────────────────────────────────────────────────────── */

function Repeater({
  field,
  items,
  onChange,
  ctx,
}: {
  field: Extract<Field, { type: "repeater" }>;
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
  ctx: FieldContext;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const update = (index: number, patch: Record<string, unknown>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const title = String(item[field.titleKey ?? "title"] ?? "") || `${field.itemLabel} ${index + 1}`;
        const open = openIndex === index;
        return (
          <div
            key={index}
            className={cn(
              "overflow-hidden rounded-lg border border-border bg-card transition-colors",
              dragIndex === index && "opacity-50",
            )}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex === null || dragIndex === index) return;
              const next = [...items];
              const [moved] = next.splice(dragIndex, 1);
              next.splice(index, 0, moved);
              onChange(next);
              setDragIndex(null);
            }}
          >
            <div className="flex items-center gap-1 px-1.5 py-1.5">
              <GripVertical className="size-3 shrink-0 cursor-grab text-muted-foreground" />
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="min-w-0 flex-1 truncate text-left text-[12.5px] font-medium"
                aria-expanded={open}
              >
                {title}
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${title}`}
              >
                <Trash2 className="size-3" />
              </button>
              <ChevronDown
                className={cn("size-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
              />
            </div>

            {open && (
              <div className="space-y-3 border-t border-border p-3">
                {field.fields.map((sub) => (
                  <FieldControl
                    key={sub.key}
                    field={sub}
                    value={item[sub.key]}
                    onChange={(value) => update(index, { [sub.key]: value })}
                    ctx={ctx}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {(!field.max || items.length < field.max) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            onChange([...items, structuredClone(field.defaultItem)]);
            setOpenIndex(items.length);
          }}
        >
          <Plus className="size-3.5" />
          {field.addLabel ?? `Add ${field.itemLabel.toLowerCase()}`}
        </Button>
      )}
    </div>
  );
}

/* ── The dispatcher ───────────────────────────────────────────────────── */

export function FieldControl({
  field,
  value,
  onChange,
  ctx,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  ctx: FieldContext;
}) {
  switch (field.type) {
    case "text":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="h-8 text-[12.5px]"
          />
        </ControlRow>
      );

    case "url":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <div className="space-y-1.5">
            <Input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder ?? "/shop"}
              className="h-8 text-[12.5px]"
            />
            {ctx.pages.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ctx.pages.map((page) => (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => onChange(page.slug === "home" ? "/" : `/${page.slug}`)}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-primary-muted hover:text-primary"
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ControlRow>
      );

    case "textarea":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows ?? 3}
            placeholder={field.placeholder}
            className="text-[12.5px]"
          />
        </ControlRow>
      );

    case "richtext":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className="text-[12.5px]"
          />
        </ControlRow>
      );

    case "number":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Input
            type="number"
            value={Number(value ?? 0)}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-8 text-[12.5px]"
          />
        </ControlRow>
      );

    case "switch":
      return (
        <div className="flex items-center justify-between gap-3 py-0.5">
          <Label className="text-[12.5px] font-normal">{field.label}</Label>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        </div>
      );

    case "color":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <ColorControl value={value as string} onChange={onChange} allowClear />
        </ControlRow>
      );

    case "image":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <ImageField value={value as string} onChange={onChange} label={field.label} />
        </ControlRow>
      );

    case "select":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Select value={String(value ?? field.options[0]?.value ?? "")} onValueChange={onChange}>
            <SelectTrigger size="sm" className="text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlRow>
      );

    case "segmented":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <SegmentedControl
            value={String(value ?? field.options[0]?.value ?? "")}
            onChange={(next) => onChange(/^\d+$/.test(next) ? Number(next) : next)}
            options={field.options}
          />
        </ControlRow>
      );

    case "slider":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <SliderControl
            value={Number(value ?? field.min)}
            onChange={onChange}
            min={field.min}
            max={field.max}
            step={field.step}
            unit={field.unit}
          />
        </ControlRow>
      );

    case "icon":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <IconPicker value={value as string} onChange={onChange} />
        </ControlRow>
      );

    case "category":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Select value={String(value ?? "none") || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
            <SelectTrigger size="sm" className="text-[12.5px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All categories</SelectItem>
              {ctx.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlRow>
      );

    case "products": {
      const selected = Array.isArray(value) ? (value as string[]) : value ? [String(value)] : [];
      return (
        <ControlRow label={field.label} hint={field.help ?? "Pick products from your catalogue."}>
          <div className="max-h-52 space-y-0.5 overflow-y-auto scrollbar-thin rounded-lg border border-border p-1">
            {ctx.products.length === 0 && (
              <p className="px-2 py-4 text-center text-[11.5px] text-muted-foreground">
                Add products in your dashboard first.
              </p>
            )}
            {ctx.products.map((product) => {
              const checked = selected.includes(product.id);
              return (
                <label
                  key={product.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange(checked ? selected.filter((id) => id !== product.id) : [...selected, product.id])
                    }
                    className="size-3.5 accent-[var(--primary)]"
                  />
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt="" className="size-6 rounded object-cover" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12px]">{product.name}</span>
                </label>
              );
            })}
          </div>
        </ControlRow>
      );
    }

    case "page":
      return (
        <ControlRow label={field.label} hint={field.help}>
          <Select value={String(value ?? "")} onValueChange={onChange}>
            <SelectTrigger size="sm" className="text-[12.5px]">
              <SelectValue placeholder="Choose a page" />
            </SelectTrigger>
            <SelectContent>
              {ctx.pages.map((page) => (
                <SelectItem key={page.slug} value={page.slug}>
                  {page.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlRow>
      );

    case "repeater":
      return (
        <div className="space-y-2">
          <Label className="text-[12px] text-muted-foreground">{field.label}</Label>
          <Repeater
            field={field}
            items={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
            onChange={onChange}
            ctx={ctx}
          />
        </div>
      );

    default:
      return null;
  }
}

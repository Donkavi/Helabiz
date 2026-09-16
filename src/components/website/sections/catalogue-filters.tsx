"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import type { SiteContext } from "@/lib/website/render-types";
import type { CatalogueFilters } from "./commerce";

/** Reads catalogue filters from the URL. Inert in the builder, which has none. */
export function useCatalogueFilters(ctx: SiteContext): CatalogueFilters {
  const params = useSearchParams();
  return React.useMemo(() => {
    if (ctx.editor || !params) return {};
    return {
      category: params.get("category") ?? undefined,
      q: params.get("q") ?? undefined,
      sort: params.get("sort") ?? undefined,
    };
  }, [params, ctx.editor]);
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "best-selling", label: "Best selling" },
  { value: "name", label: "Name A–Z" },
];

const hairline = "1px solid color-mix(in srgb,var(--w-text) 14%,transparent)";

/**
 * Browsing controls for a shop page's product grid (spec §13).
 *
 * Laid out as a control strip — categories on the left, search and sort on the
 * right — so it reads as a toolbar under the page heading rather than
 * competing with it.
 */
export function CatalogueFilterBar({
  ctx,
  filters,
  count,
  activeCategoryName,
}: {
  ctx: SiteContext;
  filters: CatalogueFilters;
  count: number;
  activeCategoryName?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(filters.q ?? "");

  const apply = (patch: CatalogueFilters) => {
    const merged = { ...filters, ...patch };
    const next = new URLSearchParams();
    if (merged.category) next.set("category", merged.category);
    if (merged.q) next.set("q", merged.q);
    if (merged.sort) next.set("sort", merged.sort);
    const qs = next.toString();
    router.push(`${ctx.basePath}/shop${qs ? `?${qs}` : ""}`);
  };

  const filtering = Boolean(filters.category || filters.q);

  return (
    <div style={{ marginBottom: 32, borderBlock: hairline, paddingBlock: 14 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        {/* Categories */}
        {ctx.categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
            <FilterChip active={!filters.category} onClick={() => apply({ category: undefined })}>
              All
            </FilterChip>
            {ctx.categories.map((category) => (
              <FilterChip
                key={category.id}
                active={filters.category === category.slug}
                onClick={() => apply({ category: category.slug })}
              >
                {category.name}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Search + sort */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginLeft: "auto" }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              apply({ q: query.trim() || undefined });
            }}
            style={{ position: "relative", width: 240, maxWidth: "100%" }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--w-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              style={{
                width: "100%",
                font: "inherit",
                fontSize: 13.5,
                height: 36,
                padding: "0 30px 0 32px",
                borderRadius: "calc(var(--w-radius) * .8)",
                border: hairline,
                background: "var(--w-bg)",
                color: "inherit",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  apply({ q: undefined });
                }}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "grid",
                  placeItems: "center",
                  width: 18,
                  height: 18,
                  border: 0,
                  borderRadius: 999,
                  background: "transparent",
                  color: "var(--w-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={13} />
              </button>
            )}
          </form>

          <div style={{ position: "relative" }}>
            <select
              value={filters.sort ?? "newest"}
              onChange={(event) => apply({ sort: event.target.value })}
              aria-label="Sort products"
              style={{
                font: "inherit",
                fontSize: 13.5,
                height: 36,
                padding: "0 30px 0 12px",
                borderRadius: "calc(var(--w-radius) * .8)",
                border: hairline,
                background: "var(--w-bg)",
                color: "inherit",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--w-muted)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* What is being shown, in words */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <span className="w-muted">
          {count} product{count === 1 ? "" : "s"}
          {activeCategoryName && ` in ${activeCategoryName}`}
          {filters.q && ` matching “${filters.q}”`}
        </span>
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push(`${ctx.basePath}/shop`);
            }}
            style={{
              font: "inherit",
              fontSize: 13,
              border: 0,
              background: "transparent",
              color: "var(--w-primary)",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        font: "inherit",
        fontSize: 13,
        fontWeight: 500,
        height: 32,
        padding: "0 14px",
        borderRadius: 999,
        cursor: "pointer",
        border: `1px solid ${active ? "var(--w-primary)" : "color-mix(in srgb,var(--w-text) 14%,transparent)"}`,
        background: active ? "var(--w-primary)" : "transparent",
        color: active ? "var(--w-btn-on-primary,#fff)" : "inherit",
        transition: "background .15s ease, color .15s ease, border-color .15s ease",
      }}
    >
      {children}
    </button>
  );
}

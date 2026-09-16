"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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

const controlStyle: React.CSSProperties = {
  font: "inherit",
  fontSize: 13.5,
  padding: "9px 10px",
  borderRadius: "calc(var(--w-radius) * .8)",
  border: "1px solid color-mix(in srgb,var(--w-text) 16%,transparent)",
  background: "var(--w-bg)",
  color: "inherit",
};

/** Category chips, search and sorting for a shop page's product grid. */
export function CatalogueFilterBar({
  ctx,
  filters,
  count,
}: {
  ctx: SiteContext;
  filters: CatalogueFilters;
  count: number;
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

  return (
    <div style={{ marginBottom: 28, display: "grid", gap: 14 }}>
      {ctx.categories.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply({ q: query || undefined });
          }}
          style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}
        >
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--w-muted)",
            }}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            style={{ ...controlStyle, width: "100%", fontSize: 14, padding: "10px 12px 10px 34px" }}
          />
        </form>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
          <span className="w-muted">Sort</span>
          <select
            value={filters.sort ?? "newest"}
            onChange={(event) => apply({ sort: event.target.value })}
            aria-label="Sort products"
            style={controlStyle}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <span className="w-muted" style={{ fontSize: 13 }}>
          {count} product{count === 1 ? "" : "s"}
        </span>
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
        padding: "7px 14px",
        borderRadius: 999,
        cursor: "pointer",
        border: `1px solid ${active ? "var(--w-primary)" : "color-mix(in srgb,var(--w-text) 16%,transparent)"}`,
        background: active ? "var(--w-primary)" : "transparent",
        color: active ? "var(--w-btn-on-primary,#fff)" : "inherit",
        transition: "background .15s ease, color .15s ease",
      }}
    >
      {children}
    </button>
  );
}

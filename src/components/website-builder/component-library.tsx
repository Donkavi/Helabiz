"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SECTION_CATEGORIES, SECTION_DEFS, type SectionDef } from "@/lib/website/section-registry";
import { useEditor } from "./editor-store";
import { cn } from "@/lib/utils";

export const PALETTE_PREFIX = "palette:";

function PaletteItem({ def }: { def: SectionDef }) {
  const { addSection } = useEditor();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PALETTE_PREFIX}${def.type}`,
    data: { kind: "palette", type: def.type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => addSection(def.type)}
      title={def.description}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-all duration-150",
        "hover:border-border hover:bg-card hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-40",
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary-muted group-hover:text-primary">
        <def.icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{def.label}</span>
      </span>
    </button>
  );
}

export function ComponentLibrary() {
  const [query, setQuery] = React.useState("");

  const available = SECTION_DEFS.filter((def) => !def.structural);
  const matches = query
    ? available.filter((def) =>
        `${def.label} ${def.description} ${def.keywords?.join(" ") ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      )
    : available;

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 border-b border-sidebar-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections"
            className="h-8 pl-8 text-[13px]"
            aria-label="Search sections"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {query ? (
          <div className="space-y-0.5">
            {matches.length === 0 && (
              <p className="px-2 py-6 text-center text-[12.5px] text-muted-foreground">
                Nothing matches “{query}”.
              </p>
            )}
            {matches.map((def) => (
              <PaletteItem key={def.type} def={def} />
            ))}
          </div>
        ) : (
          SECTION_CATEGORIES.filter((category) => category !== "Navigation").map((category) => {
            const items = available.filter((def) => def.category === category);
            if (!items.length) return null;
            return (
              <section key={category} className="mb-4 last:mb-0">
                <h3 className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {items.map((def) => (
                    <PaletteItem key={def.type} def={def} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <p className="shrink-0 border-t border-sidebar-border px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Drag a section onto the canvas, or click to add it at the end.
      </p>
    </div>
  );
}

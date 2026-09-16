"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, MousePointerClick, Trash2 } from "lucide-react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { sectionLabel } from "@/lib/website/section-registry";
import { SectionRenderer } from "@/components/website/section-renderer";
import { WebsiteStyles } from "@/components/website/website-renderer";
import { themeCssVars } from "@/lib/website/styles";
import { VIEWPORT_WIDTH } from "@/lib/website/styles";
import { cn } from "@/lib/utils";
import { HEADER_ID, FOOTER_ID, useEditor } from "./editor-store";

export const CANVAS_DROP_ID = "canvas-root";

/** One selectable, draggable section on the canvas. */
function CanvasSection({
  node,
  index,
  total,
  ctx,
}: {
  node: SectionNode;
  index: number;
  total: number;
  ctx: SiteContext;
}) {
  const { selectedId, select, remove, duplicate, move } = useEditor();
  const selected = selectedId === node.id;

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { kind: "section", index },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/sec relative", isDragging && "opacity-45")}
      onClick={(event) => {
        event.stopPropagation();
        select(node.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.stopPropagation();
          select(node.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${sectionLabel(node.type)} section`}
      aria-pressed={selected}
    >
      {/* Selection frame — outline so it never shifts the layout. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-20 rounded-[2px] outline-2 -outline-offset-2 transition-all",
          selected ? "outline-primary" : "outline-transparent group-hover/sec:outline-primary/35",
        )}
      />

      {/* Floating label + controls */}
      <div
        className={cn(
          "absolute left-2 top-2 z-30 flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-0.5 shadow-sm backdrop-blur transition-opacity",
          selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover/sec:pointer-events-auto group-hover/sec:opacity-100",
        )}
      >
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="flex h-6 cursor-grab items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-foreground active:cursor-grabbing touch-none"
          aria-label={`Drag ${sectionLabel(node.type)}`}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3 text-muted-foreground" />
          {sectionLabel(node.type)}
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <CanvasButton label="Move up" disabled={index === 0} onClick={() => move(node.id, -1)}>
          <ArrowUp className="size-3" />
        </CanvasButton>
        <CanvasButton label="Move down" disabled={index === total - 1} onClick={() => move(node.id, 1)}>
          <ArrowDown className="size-3" />
        </CanvasButton>
        <CanvasButton label="Duplicate" onClick={() => duplicate(node.id)}>
          <Copy className="size-3" />
        </CanvasButton>
        <CanvasButton label="Delete" destructive onClick={() => remove(node.id)}>
          <Trash2 className="size-3" />
        </CanvasButton>
      </div>

      <SectionRenderer node={node} ctx={ctx} />
    </div>
  );
}

function CanvasButton({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-30",
        destructive ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** The line that shows exactly where a dragged section will land (spec §7). */
function DropIndicator() {
  return (
    <div className="relative z-30 -my-px h-0.5" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-primary" />
      <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-primary" />
      <div className="absolute -right-1 -top-[3px] size-2 rounded-full bg-primary" />
    </div>
  );
}

export function Canvas({
  ctx,
  dropIndex,
  sortableIds,
}: {
  ctx: SiteContext;
  dropIndex: number | null;
  sortableIds: string[];
}) {
  const { doc, selectedId, select, viewport } = useEditor();
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ID, data: { kind: "canvas" } });

  const allNodes = React.useMemo(
    () => [doc.header, ...doc.sections, doc.footer].filter(Boolean) as SectionNode[],
    [doc],
  );

  const width = VIEWPORT_WIDTH[viewport];

  return (
    <div className="flex h-full justify-center overflow-auto scrollbar-thin bg-muted/50 p-5">
      <div
        className={cn(
          "h-fit min-h-full w-full origin-top transition-[max-width] duration-300 ease-out",
          viewport !== "desktop" && "rounded-2xl border border-border shadow-lg",
        )}
        style={{ maxWidth: viewport === "desktop" ? "100%" : width }}
      >
        <div
          className="w-root overflow-hidden rounded-xl bg-background"
          style={themeCssVars(ctx.theme)}
          onClick={() => select(null)}
        >
          <WebsiteStyles nodes={allNodes} ctx={ctx} mode="editor" />

          {/* Header — selectable but not part of the page's sortable list. */}
          {doc.header && (
            <StructuralBand
              node={doc.header}
              ctx={ctx}
              label="Header"
              selected={selectedId === HEADER_ID}
              onSelect={() => select(HEADER_ID)}
            />
          )}

          <div ref={setNodeRef} className={cn("relative min-h-[140px]", isOver && "bg-primary/[0.03]")}>
            {doc.sections.length === 0 && (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-10 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
                  <MousePointerClick className="size-4.5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">This page is empty</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Drag a section from the left, or click one to add it.
                  </p>
                </div>
              </div>
            )}

            {doc.sections.map((node, index) => (
              <React.Fragment key={node.id}>
                {dropIndex === index && <DropIndicator />}
                <CanvasSection node={node} index={index} total={doc.sections.length} ctx={ctx} />
              </React.Fragment>
            ))}
            {dropIndex === doc.sections.length && <DropIndicator />}
          </div>

          {doc.footer && (
            <StructuralBand
              node={doc.footer}
              ctx={ctx}
              label="Footer"
              selected={selectedId === FOOTER_ID}
              onSelect={() => select(FOOTER_ID)}
              surface
            />
          )}
        </div>
      </div>
      {/* `sortableIds` is consumed by the parent SortableContext; kept here for clarity. */}
      <span className="sr-only">{sortableIds.length} sections</span>
    </div>
  );
}

function StructuralBand({
  node,
  ctx,
  label,
  selected,
  onSelect,
  surface,
}: {
  node: SectionNode;
  ctx: SiteContext;
  label: string;
  selected: boolean;
  onSelect: () => void;
  surface?: boolean;
}) {
  return (
    <div
      className="group/sec relative"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect();
      }}
      aria-label={`${label} section`}
      aria-pressed={selected}
      style={surface ? { background: ctx.theme.surface } : undefined}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-20 outline-2 -outline-offset-2 transition-all",
          selected ? "outline-primary" : "outline-transparent group-hover/sec:outline-primary/35",
        )}
      />
      <span
        className={cn(
          "absolute left-2 top-2 z-30 rounded-md border border-border bg-card/95 px-2 py-1 text-[11px] font-semibold shadow-sm transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover/sec:opacity-100",
        )}
      >
        {label} · shown on every page
      </span>
      <SectionRenderer node={node} ctx={ctx} />
    </div>
  );
}

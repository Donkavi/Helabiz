"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, PanelBottom, PanelTop, Trash2 } from "lucide-react";
import { getSectionDef, sectionLabel } from "@/lib/website/section-registry";
import { flatten } from "@/lib/website/tree";
import { cn } from "@/lib/utils";
import { HEADER_ID, FOOTER_ID, useEditor } from "./editor-store";

/** A compact outline of the page — the fastest way to find and reorder sections. */
export function LayersPanel() {
  const { doc, selectedId, select, remove, duplicate, move, updateStyles } = useEditor();
  const rows = React.useMemo(() => flatten(doc.sections), [doc.sections]);

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="shrink-0 border-b border-sidebar-border px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">Page sections</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-1.5">
        <StructuralRow
          icon={PanelTop}
          label="Header"
          active={selectedId === HEADER_ID}
          onSelect={() => select(HEADER_ID)}
          disabled={!doc.header}
        />

        {rows.length === 0 && (
          <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
            No sections yet — drag one from the left.
          </p>
        )}

        {rows.map(({ node, depth }, flatIndex) => {
          const def = getSectionDef(node.type);
          const Icon = def?.icon;
          const active = selectedId === node.id;
          const topLevelIndex = doc.sections.findIndex((n) => n.id === node.id);
          const isTopLevel = topLevelIndex >= 0;

          return (
            <div
              key={node.id}
              className={cn(
                "group flex items-center gap-1.5 rounded-md py-1 pr-1 transition-colors",
                active ? "bg-card shadow-xs" : "hover:bg-sidebar-accent",
              )}
              style={{ paddingLeft: 6 + depth * 12 }}
            >
              <button
                type="button"
                onClick={() => select(node.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                aria-current={active ? "true" : undefined}
              >
                {Icon && (
                  <Icon className={cn("size-3 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                )}
                <span className={cn("truncate text-[12px]", node.styles.hidden && "line-through opacity-50")}>
                  {sectionLabel(node.type)}
                </span>
              </button>

              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <RowButton
                  label={node.styles.hidden ? "Show" : "Hide"}
                  onClick={() => updateStyles(node.id, { hidden: !node.styles.hidden })}
                >
                  {node.styles.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </RowButton>
                <RowButton label="Move up" disabled={flatIndex === 0} onClick={() => move(node.id, -1)}>
                  <ArrowUp className="size-3" />
                </RowButton>
                <RowButton
                  label="Move down"
                  disabled={isTopLevel && topLevelIndex === doc.sections.length - 1}
                  onClick={() => move(node.id, 1)}
                >
                  <ArrowDown className="size-3" />
                </RowButton>
                <RowButton label="Duplicate" onClick={() => duplicate(node.id)}>
                  <Copy className="size-3" />
                </RowButton>
                <RowButton label="Delete" destructive onClick={() => remove(node.id)}>
                  <Trash2 className="size-3" />
                </RowButton>
              </div>
            </div>
          );
        })}

        <StructuralRow
          icon={PanelBottom}
          label="Footer"
          active={selectedId === FOOTER_ID}
          onSelect={() => select(FOOTER_ID)}
          disabled={!doc.footer}
        />
      </div>
    </div>
  );
}

function StructuralRow({
  icon: Icon,
  label,
  active,
  onSelect,
  disabled,
}: {
  icon: typeof PanelTop;
  label: string;
  active: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors disabled:opacity-40",
        active ? "bg-card shadow-xs" : "hover:bg-sidebar-accent",
      )}
    >
      <Icon className={cn("size-3 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span className="truncate text-[12px] font-medium">{label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">all pages</span>
    </button>
  );
}

function RowButton({
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
        "flex size-5 items-center justify-center rounded transition-colors disabled:opacity-25",
        destructive
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

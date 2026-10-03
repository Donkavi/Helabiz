"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";
import type { SectionNode, ThemeTokens, Viewport } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { createSection, getSectionDef, sectionLabel } from "@/lib/website/section-registry";
import { PageTour } from "@/components/dashboard/tour/tour";
import { EditorProvider, useEditor, type EditorDoc } from "./editor-store";
import { BuilderToolbar } from "./toolbar";
import { ComponentLibrary, PALETTE_PREFIX } from "./component-library";
import { Canvas } from "./canvas";
import { LayersPanel } from "./layers-panel";
import { SettingsPanel } from "./settings-panel";
import type { FieldContext } from "./field-controls";

export type BuilderPage = { id: string; title: string; slug: string };

export type BuilderProps = {
  pageId: string;
  pages: BuilderPage[];
  initialDoc: EditorDoc;
  siteBase: Omit<SiteContext, "theme" | "viewport">;
  fieldCtx: FieldContext;
  websiteStatus: string;
  hasUnpublishedChanges: boolean;
  previewUrl: string;
  saveAction: (pageId: string, payload: SavePayload) => Promise<{ ok: boolean; error?: string }>;
  publishAction: () => Promise<{ ok: boolean; error?: string }>;
};

export type SavePayload = {
  sections: SectionNode[];
  header: SectionNode | null;
  footer: SectionNode | null;
  theme: ThemeTokens;
};

export function BuilderShell(props: BuilderProps) {
  const save = React.useCallback(
    async (doc: EditorDoc) => {
      const result = await props.saveAction(props.pageId, {
        sections: doc.sections,
        header: doc.header,
        footer: doc.footer,
        theme: doc.theme,
      });
      if (!result.ok) throw new Error(result.error ?? "Save failed");
    },
    [props],
  );

  return (
    <EditorProvider initialDoc={props.initialDoc} onSave={save}>
      <PageTour id="builder" />
      <BuilderLayout {...props} />
    </EditorProvider>
  );
}

function BuilderLayout({
  pageId,
  pages,
  siteBase,
  fieldCtx,
  websiteStatus,
  hasUnpublishedChanges,
  previewUrl,
  publishAction,
}: BuilderProps) {
  const { doc, viewport, addNode, reorder, select } = useEditor();
  const [activeDrag, setActiveDrag] = React.useState<{ kind: "palette" | "section"; label: string } | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [showLayers, setShowLayers] = React.useState(true);

  const sensors = useSensors(
    // A small distance threshold keeps clicks (to select) separate from drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ctx = React.useMemo<SiteContext>(
    () => ({ ...siteBase, theme: doc.theme, viewport }),
    [siteBase, doc.theme, viewport],
  );

  const sortableIds = React.useMemo(() => doc.sections.map((s) => s.id), [doc.sections]);

  /** Works out where a dragged item would land, from the pointer's position. */
  const computeDropIndex = React.useCallback(
    (event: DragOverEvent | DragEndEvent) => {
      const { over, active } = event;
      if (!over) return null;
      if (over.id === "canvas-root") return doc.sections.length;

      const overIndex = doc.sections.findIndex((s) => s.id === over.id);
      if (overIndex < 0) return null;

      const activeCenter = active.rect.current.translated
        ? active.rect.current.translated.top + active.rect.current.translated.height / 2
        : 0;
      const overCenter = over.rect.top + over.rect.height / 2;
      return activeCenter > overCenter ? overIndex + 1 : overIndex;
    },
    [doc.sections],
  );

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith(PALETTE_PREFIX)) {
      const type = id.slice(PALETTE_PREFIX.length);
      setActiveDrag({ kind: "palette", label: sectionLabel(type) });
    } else {
      const node = doc.sections.find((s) => s.id === id);
      setActiveDrag({ kind: "section", label: node ? sectionLabel(node.type) : "Section" });
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    setDropIndex(computeDropIndex(event));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const id = String(event.active.id);
    const target = computeDropIndex(event);
    setActiveDrag(null);
    setDropIndex(null);
    if (target === null) return;

    if (id.startsWith(PALETTE_PREFIX)) {
      const type = id.slice(PALETTE_PREFIX.length);
      const node = createSection(type);
      addNode(node, target);
      toast.success(`${sectionLabel(type)} added`);
      return;
    }

    const from = doc.sections.findIndex((s) => s.id === id);
    if (from < 0) return;
    // Removing the dragged item first shifts every later index down by one.
    const to = target > from ? target - 1 : target;
    if (from !== to) reorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveDrag(null);
        setDropIndex(null);
      }}
    >
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <BuilderToolbar
          pages={pages}
          currentPageId={pageId}
          websiteStatus={websiteStatus}
          hasUnpublishedChanges={hasUnpublishedChanges}
          previewUrl={previewUrl}
          onPublish={publishAction}
          showLayers={showLayers}
          onToggleLayers={() => setShowLayers((v) => !v)}
        />

        <div className="flex min-h-0 flex-1">
          <aside data-tour="builder-library" className="hidden w-[210px] shrink-0 border-r border-sidebar-border md:block">
            <ComponentLibrary />
          </aside>

          {showLayers && (
            <aside data-tour="builder-layers" className="hidden w-[196px] shrink-0 xl:block">
              <LayersPanel />
            </aside>
          )}

          <main data-tour="builder-canvas" className="min-w-0 flex-1" onClick={() => select(null)}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <Canvas ctx={ctx} dropIndex={dropIndex} sortableIds={sortableIds} />
            </SortableContext>
          </main>

          {/* Holds the selected section's settings, or the website style when nothing is selected. */}
          <aside data-tour="builder-settings" className="hidden w-[286px] shrink-0 border-l border-sidebar-border lg:block">
            <SettingsPanel fieldCtx={fieldCtx} />
          </aside>
        </div>

        {/* Small screens get a clear explanation rather than a broken editor (spec §51). */}
        <div className="flex items-center justify-center border-t border-border bg-card px-4 py-3 text-center md:hidden">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            The builder needs a wider screen. Open Helabiz on a tablet or computer to design your website — everything
            else in the dashboard works here.
          </p>
        </div>
      </div>

      {/* The ghost that follows the cursor while dragging. */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }} modifiers={[restrictToVerticalAxis]}>
        {activeDrag && <DragGhost label={activeDrag.label} kind={activeDrag.kind} />}
      </DragOverlay>
    </DndContext>
  );
}

function DragGhost({ label, kind }: { label: string; kind: "palette" | "section" }) {
  const def = getSectionDef(label.toLowerCase());
  const Icon = def?.icon;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/45 bg-card px-3 py-2 text-[12.5px] font-medium text-primary shadow-lg">
      {Icon && <Icon className="size-3.5" />}
      {label}
      <span className="text-[11px] font-normal text-muted-foreground">
        {kind === "palette" ? "drop to add" : "drop to move"}
      </span>
    </div>
  );
}

/** Re-exported for the page component's prop typing. */
export type { EditorDoc, Viewport };

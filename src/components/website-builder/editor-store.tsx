"use client";

import * as React from "react";
import type { SectionNode, StyleProps, ThemeTokens, Viewport } from "@/types";
import { createSection } from "@/lib/website/section-registry";
import {
  duplicateNode,
  findNode,
  insertNode,
  moveNode,
  removeNode,
  reorderTopLevel,
  setNodeProps,
  setNodeStyle,
  updateNode,
} from "@/lib/website/tree";

export const HEADER_ID = "__header__";
export const FOOTER_ID = "__footer__";
export const THEME_ID = "__theme__";

/** The slice of editor state that undo/redo travels over. */
export type EditorDoc = {
  sections: SectionNode[];
  header: SectionNode | null;
  footer: SectionNode | null;
  theme: ThemeTokens;
};

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type EditorContextValue = {
  doc: EditorDoc;
  selectedId: string | null;
  selectedNode: SectionNode | null;
  viewport: Viewport;
  saveState: SaveState;
  canUndo: boolean;
  canRedo: boolean;
  setViewport: (viewport: Viewport) => void;
  select: (id: string | null) => void;
  addSection: (type: string, index?: number, parentId?: string | null) => void;
  addNode: (node: SectionNode, index?: number, parentId?: string | null) => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  updateStyles: (id: string, patch: StyleProps) => void;
  replaceNode: (id: string, updater: (node: SectionNode) => SectionNode) => void;
  updateTheme: (patch: Partial<ThemeTokens>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  reorder: (from: number, to: number) => void;
  replaceDoc: (doc: EditorDoc, options?: { markDirty?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  saveNow: () => Promise<void>;
};

const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useEditor() {
  const ctx = React.useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside <EditorProvider>");
  return ctx;
}

const MAX_HISTORY = 80;

export function EditorProvider({
  initialDoc,
  onSave,
  children,
}: {
  initialDoc: EditorDoc;
  onSave: (doc: EditorDoc) => Promise<void>;
  children: React.ReactNode;
}) {
  const [doc, setDoc] = React.useState<EditorDoc>(initialDoc);
  const [past, setPast] = React.useState<EditorDoc[]>([]);
  const [future, setFuture] = React.useState<EditorDoc[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [viewport, setViewport] = React.useState<Viewport>("desktop");
  const [saveState, setSaveState] = React.useState<SaveState>("idle");

  // The autosave timer fires outside render, so it reads the latest doc from a
  // ref rather than closing over a stale one.
  const docRef = React.useRef(doc);
  React.useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const dirtyRef = React.useRef(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Every mutation goes through here so history stays consistent. */
  const commit = React.useCallback((next: EditorDoc | ((current: EditorDoc) => EditorDoc)) => {
    setDoc((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (resolved === current) return current;
      setPast((stack) => [...stack, current].slice(-MAX_HISTORY));
      setFuture([]);
      dirtyRef.current = true;
      setSaveState("dirty");
      return resolved;
    });
  }, []);

  /* ── Autosave (spec §46) ───────────────────────────────────────────── */
  const flush = React.useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    setSaveState("saving");
    try {
      await onSave(docRef.current);
      setSaveState("saved");
    } catch {
      dirtyRef.current = true;
      setSaveState("error");
    }
  }, [onSave]);

  React.useEffect(() => {
    if (saveState !== "dirty") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flush(), 1100);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [doc, saveState, flush]);

  // A refresh must not silently drop work the debounce has not written yet.
  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  /* ── Mutations ─────────────────────────────────────────────────────── */
  const withSections = React.useCallback(
    (fn: (sections: SectionNode[]) => SectionNode[]) => {
      commit((current) => {
        const sections = fn(current.sections);
        return sections === current.sections ? current : { ...current, sections };
      });
    },
    [commit],
  );

  /** Header and footer live outside the page tree but edit the same way. */
  const applyToNode = React.useCallback(
    (id: string, updater: (node: SectionNode) => SectionNode) => {
      commit((current) => {
        if (id === HEADER_ID) {
          return current.header ? { ...current, header: updater(current.header) } : current;
        }
        if (id === FOOTER_ID) {
          return current.footer ? { ...current, footer: updater(current.footer) } : current;
        }
        const sections = updateNode(current.sections, id, updater);
        return sections === current.sections ? current : { ...current, sections };
      });
    },
    [commit],
  );

  const addNode = React.useCallback(
    (node: SectionNode, index?: number, parentId?: string | null) => {
      commit((current) => ({
        ...current,
        sections: insertNode(current.sections, node, index ?? current.sections.length, parentId),
      }));
      setSelectedId(node.id);
    },
    [commit],
  );

  const addSection = React.useCallback(
    (type: string, index?: number, parentId?: string | null) => {
      addNode(createSection(type), index, parentId);
    },
    [addNode],
  );

  const value = React.useMemo<EditorContextValue>(() => {
    const selectedNode =
      selectedId === HEADER_ID
        ? doc.header
        : selectedId === FOOTER_ID
          ? doc.footer
          : selectedId
            ? findNode(doc.sections, selectedId)
            : null;

    return {
      doc,
      selectedId,
      selectedNode,
      viewport,
      saveState,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      setViewport,
      select: setSelectedId,
      addSection,
      addNode,
      updateProps: (id, patch) => applyToNode(id, (node) => setNodeProps(node, patch)),
      updateStyles: (id, patch) => applyToNode(id, (node) => setNodeStyle(node, viewport, patch)),
      replaceNode: (id, updater) => applyToNode(id, updater),
      updateTheme: (patch) => commit((current) => ({ ...current, theme: { ...current.theme, ...patch } })),
      remove: (id) => {
        withSections((sections) => removeNode(sections, id));
        setSelectedId((current) => (current === id ? null : current));
      },
      duplicate: (id) => withSections((sections) => duplicateNode(sections, id)),
      move: (id, direction) => withSections((sections) => moveNode(sections, id, direction)),
      reorder: (from, to) => withSections((sections) => reorderTopLevel(sections, from, to)),
      replaceDoc: (next, options) => {
        if (options?.markDirty === false) {
          setDoc(next);
          return;
        }
        commit(next);
      },
      undo: () => {
        setPast((stack) => {
          if (!stack.length) return stack;
          const previous = stack[stack.length - 1];
          setFuture((f) => [docRef.current, ...f].slice(0, MAX_HISTORY));
          setDoc(previous);
          dirtyRef.current = true;
          setSaveState("dirty");
          return stack.slice(0, -1);
        });
      },
      redo: () => {
        setFuture((stack) => {
          if (!stack.length) return stack;
          const next = stack[0];
          setPast((p) => [...p, docRef.current].slice(-MAX_HISTORY));
          setDoc(next);
          dirtyRef.current = true;
          setSaveState("dirty");
          return stack.slice(1);
        });
      },
      saveNow: flush,
    };
  }, [doc, selectedId, viewport, saveState, past, future, addSection, addNode, applyToNode, commit, withSections, flush]);

  /* ── Keyboard shortcuts (spec §45) ─────────────────────────────────── */
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        target?.getAttribute("role") === "textbox";

      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "z") {
        if (typing) return;
        event.preventDefault();
        if (event.shiftKey) value.redo();
        else value.undo();
        return;
      }
      if (meta && event.key.toLowerCase() === "y") {
        if (typing) return;
        event.preventDefault();
        value.redo();
        return;
      }
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void value.saveNow();
        return;
      }
      if (!typing && (event.key === "Delete" || event.key === "Backspace") && selectedId) {
        if (selectedId === HEADER_ID || selectedId === FOOTER_ID || selectedId === THEME_ID) return;
        event.preventDefault();
        value.remove(selectedId);
        return;
      }
      if (!typing && meta && event.key.toLowerCase() === "d" && selectedId) {
        event.preventDefault();
        value.duplicate(selectedId);
        return;
      }
      if (event.key === "Escape") setSelectedId(null);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [value, selectedId]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

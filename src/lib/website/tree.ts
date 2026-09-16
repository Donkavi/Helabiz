import type { SectionNode, StyleProps, Viewport } from "@/types";
import { cloneSection } from "./section-registry";

/** Depth-first search for a node by id. */
export function findNode(nodes: SectionNode[], id: string): SectionNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const hit = findNode(node.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

export function findParent(nodes: SectionNode[], id: string, parent: SectionNode | null = null): SectionNode | null {
  for (const node of nodes) {
    if (node.id === id) return parent;
    if (node.children?.length) {
      const hit = findParent(node.children, id, node);
      if (hit !== null || node.children.some((c) => c.id === id)) return hit ?? node;
    }
  }
  return null;
}

/** Returns a new tree with `id` replaced by `updater(node)`. */
export function updateNode(
  nodes: SectionNode[],
  id: string,
  updater: (node: SectionNode) => SectionNode,
): SectionNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children?.length) {
      const children = updateNode(node.children, id, updater);
      if (children !== node.children) return { ...node, children };
    }
    return node;
  });
}

export function removeNode(nodes: SectionNode[], id: string): SectionNode[] {
  const next: SectionNode[] = [];
  let changed = false;
  for (const node of nodes) {
    if (node.id === id) {
      changed = true;
      continue;
    }
    if (node.children?.length) {
      const children = removeNode(node.children, id);
      if (children !== node.children) {
        changed = true;
        next.push({ ...node, children });
        continue;
      }
    }
    next.push(node);
  }
  return changed ? next : nodes;
}

/** Inserts `node` at `index` among the top-level list, or inside `parentId`. */
export function insertNode(
  nodes: SectionNode[],
  node: SectionNode,
  index: number,
  parentId?: string | null,
): SectionNode[] {
  if (!parentId) {
    const next = [...nodes];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, node);
    return next;
  }
  return updateNode(nodes, parentId, (parent) => {
    const children = [...(parent.children ?? [])];
    children.splice(Math.max(0, Math.min(index, children.length)), 0, node);
    return { ...parent, children };
  });
}

export function duplicateNode(nodes: SectionNode[], id: string): SectionNode[] {
  const siblingsOf = (list: SectionNode[]): SectionNode[] => {
    const index = list.findIndex((n) => n.id === id);
    if (index >= 0) {
      const copy = cloneSection(list[index]);
      const next = [...list];
      next.splice(index + 1, 0, copy);
      return next;
    }
    return list.map((node) =>
      node.children?.length ? { ...node, children: siblingsOf(node.children) } : node,
    );
  };
  return siblingsOf(nodes);
}

/** Moves a node one slot up or down among its own siblings. */
export function moveNode(nodes: SectionNode[], id: string, direction: -1 | 1): SectionNode[] {
  const shift = (list: SectionNode[]): SectionNode[] => {
    const index = list.findIndex((n) => n.id === id);
    if (index >= 0) {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }
    return list.map((node) => (node.children?.length ? { ...node, children: shift(node.children) } : node));
  };
  return shift(nodes);
}

export function reorderTopLevel(nodes: SectionNode[], fromIndex: number, toIndex: number): SectionNode[] {
  if (fromIndex === toIndex) return nodes;
  const next = [...nodes];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Applies a style change to the right layer for the viewport being edited. */
export function setNodeStyle(node: SectionNode, viewport: Viewport, patch: StyleProps): SectionNode {
  if (viewport === "desktop") {
    return { ...node, styles: { ...node.styles, ...patch } };
  }
  const responsive = { ...(node.responsiveStyles ?? {}) };
  responsive[viewport] = { ...(responsive[viewport] ?? {}), ...patch };
  return { ...node, responsiveStyles: responsive };
}

/** Clears a viewport override so the value falls back to desktop. */
export function clearResponsiveStyle(node: SectionNode, viewport: Exclude<Viewport, "desktop">, key: keyof StyleProps) {
  const responsive = { ...(node.responsiveStyles ?? {}) };
  const layer = { ...(responsive[viewport] ?? {}) };
  delete layer[key];
  responsive[viewport] = layer;
  return { ...node, responsiveStyles: responsive };
}

export function setNodeProps(node: SectionNode, patch: Record<string, unknown>): SectionNode {
  return { ...node, props: { ...node.props, ...patch } };
}

export function flatten(nodes: SectionNode[], depth = 0): { node: SectionNode; depth: number }[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(node.children?.length ? flatten(node.children, depth + 1) : []),
  ]);
}

export function countNodes(nodes: SectionNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + (node.children?.length ? countNodes(node.children) : 0), 0);
}

import { createElement } from "react";
import { iconFor } from "@/lib/website/icons";

/**
 * Renders one of the builder's picker icons by name.
 *
 * `createElement` is used rather than binding the looked-up component to a
 * local, which React's lint rules read as defining a component during render.
 */
export function Glyph({ name, className, size }: { name?: string; className?: string; size?: number }) {
  return createElement(iconFor(name), { className, size });
}

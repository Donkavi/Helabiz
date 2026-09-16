"use client";

import * as React from "react";
import type { CartLine } from "@/types";

type CartState = {
  lines: CartLine[];
  open: boolean;
  ready: boolean;
};

type CartApi = CartState & {
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  subtotal: number;
  count: number;
  lineKey: (line: CartLine) => string;
};

const CartContext = React.createContext<CartApi | null>(null);

export function lineKey(line: { productId: string; variantId?: string }) {
  return `${line.productId}::${line.variantId ?? ""}`;
}

/**
 * Cart state lives in localStorage keyed per business, so a visitor browsing two
 * Helabiz stores keeps two separate carts.
 */
export function CartProvider({
  businessId,
  children,
  disabled,
}: {
  businessId: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const storageKey = `helabiz.cart.${businessId}`;
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  // The saved cart only exists in the browser, so it is read after mount.
  // `ready` keeps the UI from flashing "your cart is empty" before that.
  /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* private mode or blocked storage — start with an empty cart */
    }
    setReady(true);
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      /* ignore quota/permission errors */
    }
  }, [lines, ready, storageKey]);

  const add = React.useCallback<CartApi["add"]>(
    (incoming) => {
      if (disabled) return;
      const quantity = Math.max(1, incoming.quantity ?? 1);
      setLines((current) => {
        const key = lineKey(incoming);
        const existing = current.find((l) => lineKey(l) === key);
        if (existing) {
          const cap = existing.stock ?? Infinity;
          return current.map((l) =>
            lineKey(l) === key ? { ...l, quantity: Math.min(cap, l.quantity + quantity) } : l,
          );
        }
        return [...current, { ...incoming, quantity }];
      });
      setOpen(true);
    },
    [disabled],
  );

  const remove = React.useCallback((key: string) => {
    setLines((current) => current.filter((l) => lineKey(l) !== key));
  }, []);

  const setQuantity = React.useCallback((key: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => lineKey(l) !== key)
        : current.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.min(l.stock ?? Infinity, quantity) } : l)),
    );
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const subtotal = React.useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);
  const count = React.useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  const value = React.useMemo<CartApi>(
    () => ({ lines, open, ready, add, remove, setQuantity, clear, setOpen, subtotal, count, lineKey }),
    [lines, open, ready, add, remove, setQuantity, clear, subtotal, count],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Safe outside a provider (the builder renders sections without one). */
export function useCart(): CartApi {
  const ctx = React.useContext(CartContext);
  return (
    ctx ?? {
      lines: [],
      open: false,
      ready: true,
      add: () => {},
      remove: () => {},
      setQuantity: () => {},
      clear: () => {},
      setOpen: () => {},
      subtotal: 0,
      count: 0,
      lineKey,
    }
  );
}

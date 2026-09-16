"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "helabiz.vid";

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Private mode: fall back to a per-page-load id rather than dropping the event.
    return `v_anon_${Math.random().toString(36).slice(2)}`;
  }
}

function device() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/** First-party page-view tracking for the published site (spec §29). */
export function AnalyticsBeacon({ businessId, websiteId }: { businessId: string; websiteId: string }) {
  const pathname = usePathname();
  const lastPath = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const body = JSON.stringify({
      businessId,
      websiteId,
      type: "page_view",
      // Strip the /site/<slug> prefix so paths read the same however the site is served.
      path: pathname.replace(/^\/site\/[^/]+/, "") || "/",
      referrer: document.referrer || undefined,
      visitorId: visitorId(),
      device: device(),
    });

    // keepalive lets the request finish even if the visitor navigates away.
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* analytics must never break the page */
    });
  }, [pathname, businessId, websiteId]);

  return null;
}

/** Fires product-level events from client components. */
export function trackEvent(payload: {
  businessId: string;
  websiteId?: string;
  type: "product_view" | "add_to_cart" | "begin_checkout" | "order";
  productId?: string;
  productName?: string;
  value?: number;
  path?: string;
}) {
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, visitorId: visitorId(), device: device() }),
    keepalive: true,
  }).catch(() => {});
}

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { normalizePhone } from "@/lib/whatsapp";

/**
 * The chat button from the "Chat with customers" add-on.
 *
 * It follows the shopper around the site and writes the first message for
 * them: someone looking at a product should not have to explain which one.
 * The page is read at click time rather than render time so a client-side
 * navigation never sends the wrong product name.
 */
export function WhatsAppBubble({
  phone,
  businessName,
  basePath,
}: {
  phone: string;
  businessName: string;
  /** `/site/<slug>` in path mode, empty on a real subdomain. */
  basePath: string;
}) {
  const pathname = usePathname();
  const number = normalizePhone(phone);
  if (!number) return null;

  const message = () => {
    // Strip the tenant prefix so the shopper never sees our internal routing.
    const path = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
    const product = path.match(/^\/products\/([^/]+)/)?.[1];

    if (product) {
      const name = decodeURIComponent(product).replace(/-/g, " ");
      return `Hello ${businessName}, I would like to ask about "${name}".`;
    }
    if (path.startsWith("/cart") || path.startsWith("/checkout")) {
      return `Hello ${businessName}, I need some help with my order.`;
    }
    return `Hello ${businessName}, I have a question.`;
  };

  return (
    <a
      href={`https://wa.me/${number}`}
      onClick={(event) => {
        // Built here so the href always matches the page being looked at.
        event.currentTarget.href = `https://wa.me/${number}?text=${encodeURIComponent(message())}`;
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${businessName} on WhatsApp`}
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 60,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px 12px 13px",
        borderRadius: 999,
        background: "#25D366",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,.45)",
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden focusable="false">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z" />
      </svg>
      Chat with us
    </a>
  );
}

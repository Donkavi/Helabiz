"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Loader2, MessageCircle, SendHorizontal, X } from "lucide-react";
import type { ThemeTokens } from "@/types";
import type { ShopChatMessage } from "@/services/shop-chat-service";
import { normalizePhone } from "@/lib/whatsapp";
import { themeCssVars } from "@/lib/website/styles";
import { SiteImage } from "./primitives";
import { WhatsAppIcon, whatsappMessage } from "./whatsapp-bubble";

/**
 * On-site chat with the shop ("Chat with customers"), for signed-in website
 * customers. One conversation component serves both the floating widget and
 * the Messages page in the customer's account.
 *
 * Styled from the site's own theme variables, like the cart and checkout, so
 * it reads as part of the shop and not as Helabiz.
 */

const OPEN_POLL_MS = 5_000;
const CLOSED_POLL_MS = 30_000;

const CHAT_CSS = `
.w-chat-spin{animation:w-chat-spin 1s linear infinite}
@keyframes w-chat-spin{to{transform:rotate(360deg)}}
.w-chat-panel{position:fixed;right:18px;bottom:84px;z-index:61;width:min(380px,calc(100vw - 36px));height:min(560px,calc(100vh - 120px));height:min(560px,calc(100dvh - 120px));flex-direction:column;overflow:hidden;border-radius:max(14px,var(--w-radius));border:1px solid color-mix(in srgb,var(--w-text) 10%,transparent);box-shadow:0 24px 60px -20px rgba(0,0,0,.45)}
.w-chat-panel:focus{outline:none}
@media (max-width:560px){.w-chat-panel{inset:8px;width:auto;height:auto;z-index:62}.w-chat-input{font-size:16px!important}}
`;

/** The path within the site, without the `/site/<slug>` prefix. */
function sitePath(pathname: string, basePath: string) {
  const path = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  return path || "/";
}

/**
 * Runs `task` straight away, then every `ms` while enabled and the tab is
 * visible, and once on coming back to the tab. A new `restartKey` starts over.
 */
function usePolling(task: () => void, ms: number, enabled: boolean, restartKey?: unknown) {
  const latest = React.useRef(task);
  React.useEffect(() => {
    latest.current = task;
  });
  React.useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") latest.current();
    };
    tick();
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms, enabled, restartKey]);
}

const subscribeNothing = () => () => {};

/** False during server render and hydration, so times are only shown in the reader's own time zone. */
function useHydrated() {
  return React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

function merge(current: ShopChatMessage[], incoming: ShopChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type ChatState = "ok" | "signed-out" | "unavailable";

/**
 * The conversation and its composer. Polls for new messages while `live`;
 * reading them marks the shop's replies as seen, which is why the widget only
 * makes it live while its panel is open.
 */
export function ShopChatConversation({
  businessSlug,
  basePath,
  shopName,
  initialMessages,
  initialDraft = "",
  live,
  autoFocus,
  onSeen,
  onSignedOut,
  style,
}: {
  businessSlug: string;
  basePath: string;
  shopName: string;
  /** From the server on the Messages page; the widget loads its own. */
  initialMessages?: ShopChatMessage[];
  initialDraft?: string;
  live: boolean;
  autoFocus?: boolean;
  onSeen?: () => void;
  onSignedOut?: () => void;
  style?: React.CSSProperties;
}) {
  const hydrated = useHydrated();
  const [messages, setMessages] = React.useState<ShopChatMessage[]>(initialMessages ?? []);
  const [loaded, setLoaded] = React.useState(Boolean(initialMessages));
  const [state, setState] = React.useState<ChatState>("ok");
  const [draft, setDraft] = React.useState(initialDraft);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const nearBottom = React.useRef(true);
  const inFlight = React.useRef(false);
  // Only what polling returned moves the cursor: a message sent from here
  // can be newer than a shop reply the poll has not fetched yet.
  const cursor = React.useRef(initialMessages?.at(-1)?.createdAt);
  const callbacks = React.useRef({ onSeen, onSignedOut });
  React.useEffect(() => {
    callbacks.current = { onSeen, onSignedOut };
  });

  const load = React.useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const params = new URLSearchParams({ shop: businessSlug });
      if (cursor.current) params.set("after", cursor.current);
      const response = await fetch(`/api/site/chat?${params}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { enabled: boolean; signedIn: boolean; messages: ShopChatMessage[] };
      if (!data.enabled) {
        setState("unavailable");
      } else if (!data.signedIn) {
        setState("signed-out");
        callbacks.current.onSignedOut?.();
      } else {
        setState("ok");
        if (data.messages.length > 0) {
          cursor.current = data.messages[data.messages.length - 1].createdAt;
          setMessages((current) => merge(current, data.messages));
        }
        callbacks.current.onSeen?.();
      }
      setLoaded(true);
    } catch {
      // Offline for a moment: the next poll tries again.
    } finally {
      inFlight.current = false;
    }
  }, [businessSlug]);

  usePolling(load, OPEN_POLL_MS, live);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!live || !autoFocus || !input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [live, autoFocus, loaded]);

  // Follow new messages down, unless the reader has scrolled up to read back.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (list && nearBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages, hydrated, loaded]);

  // Grow with the text, up to a few lines.
  React.useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  }, [draft, loaded]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/site/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSlug, body }),
      });
      const data = (await response.json()) as { ok: boolean; message?: ShopChatMessage; error?: string };
      if (data.ok && data.message) {
        nearBottom.current = true;
        setMessages((current) => merge(current, [data.message!]));
        setDraft("");
      } else if (response.status === 401) {
        setState("signed-out");
        callbacks.current.onSignedOut?.();
      } else {
        setError(data.error ?? "Your message was not sent. Please try again.");
      }
    } catch {
      setError("Your message was not sent. Please check your connection and try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (state === "signed-out") return <ChatSignInPrompt basePath={basePath} shopName={shopName} />;
  if (state === "unavailable") {
    return (
      <div style={{ ...style, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <p className="w-muted" style={{ fontSize: 14 }}>
          Chat is not available right now. Please try again later.
        </p>
      </div>
    );
  }

  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, ...style }}>
      <style dangerouslySetInnerHTML={{ __html: CHAT_CSS }} />
      <div
        ref={listRef}
        onScroll={(event) => {
          const list = event.currentTarget;
          nearBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        }}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${shopName}`}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {!loaded ? (
          <div style={{ margin: "auto", color: "var(--w-muted)" }}>
            <Loader2 size={20} className="w-chat-spin" aria-label="Loading messages" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "12px 10px", maxWidth: 300 }}>
            <MessageCircle size={26} style={{ color: "var(--w-primary)" }} />
            <p style={{ marginTop: 10, fontWeight: 600, fontSize: 15 }}>Ask us anything</p>
            <p className="w-muted" style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.55 }}>
              A question about a product, delivery or your order? Send a message and we will reply here.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.from === "customer";
            const date = new Date(message.createdAt);
            const day = hydrated ? dayLabel(date) : "";
            const newDay = day !== lastDay;
            lastDay = day;
            return (
              <React.Fragment key={message.id}>
                {hydrated && newDay && (
                  <p
                    className="w-muted"
                    style={{ alignSelf: "center", margin: "10px 0 6px", fontSize: 11.5, fontWeight: 600 }}
                  >
                    {day}
                  </p>
                )}
                <div
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    display: "grid",
                    justifyItems: mine ? "end" : "start",
                    gap: 3,
                    marginBottom: 6,
                  }}
                >
                  <span style={visuallyHidden}>
                    {mine ? "You:" : `${shopName}:`}
                  </span>
                  <p
                    style={{
                      padding: "9px 13px",
                      borderRadius: mine ? "16px 16px 5px 16px" : "16px 16px 16px 5px",
                      background: mine ? "var(--w-primary)" : "color-mix(in srgb,var(--w-text) 7%,transparent)",
                      color: mine ? "var(--w-btn-on-primary,#fff)" : "inherit",
                      fontSize: 14.5,
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {message.body}
                  </p>
                  {hydrated && (
                    <time dateTime={message.createdAt} className="w-muted" style={{ fontSize: 11, paddingInline: 4 }}>
                      {timeLabel(date)}
                    </time>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        style={{
          padding: 10,
          borderTop: "1px solid color-mix(in srgb,var(--w-text) 10%,transparent)",
          display: "grid",
          gap: 8,
        }}
      >
        {error && (
          <p
            role="alert"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: "8px 10px",
              borderRadius: "calc(var(--w-radius) * .7)",
              background: "rgba(180,52,31,.1)",
              color: "#b4341f",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Not while an input method is composing: Sinhala and Tamil keyboards use Enter to pick a word.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Write a message…"
            className="w-chat-input"
            aria-label={`Message to ${shopName}`}
            style={{
              flex: 1,
              minWidth: 0,
              resize: "none",
              font: "inherit",
              fontSize: 14.5,
              lineHeight: 1.45,
              padding: "10px 13px",
              borderRadius: "calc(var(--w-radius) * .8)",
              border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
              background: "var(--w-bg)",
              color: "inherit",
            }}
          />
          <button
            type="submit"
            className="w-btn w-btn--solid"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            style={{
              flexShrink: 0,
              width: 43,
              height: 43,
              padding: 0,
              opacity: sending || !draft.trim() ? 0.55 : 1,
            }}
          >
            {sending ? <Loader2 size={17} className="w-chat-spin" /> : <SendHorizontal size={17} />}
          </button>
        </div>
      </form>
    </div>
  );
}

const visuallyHidden: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

/** For a visitor who is not signed in: chat lives in the customer's account. */
export function ChatSignInPrompt({ basePath, shopName }: { basePath: string; shopName: string }) {
  const pathname = usePathname();
  const next = encodeURIComponent(sitePath(pathname, basePath));
  return (
    <div style={{ padding: "26px 22px", display: "grid", gap: 8, justifyItems: "center", textAlign: "center" }}>
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "color-mix(in srgb,var(--w-primary) 12%,transparent)",
          color: "var(--w-primary)",
        }}
      >
        <MessageCircle size={22} />
      </span>
      <p style={{ marginTop: 4, fontWeight: 600, fontSize: 15.5 }}>Sign in to chat with {shopName}</p>
      <p className="w-muted" style={{ fontSize: 13.5, lineHeight: 1.55, maxWidth: 300 }}>
        Your messages stay in your account, so you can always pick up where you left off.
      </p>
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        <Link href={`${basePath}/account/sign-in?next=${next}`} className="w-btn w-btn--solid w-btn--sm">
          Sign in
        </Link>
        <Link href={`${basePath}/account/register?next=${next}`} className="w-btn w-btn--outline w-btn--sm">
          Create account
        </Link>
      </div>
    </div>
  );
}

/**
 * The floating chat button and its panel, on every page of a shop with the
 * add-on and customer accounts. Signed-out visitors are asked to sign in;
 * WhatsApp stays on offer either way when the shop has a number.
 */
export function ShopChatWidget({
  businessSlug,
  shopName,
  logo,
  basePath,
  whatsapp,
  theme,
}: {
  businessSlug: string;
  shopName: string;
  logo?: string;
  basePath: string;
  /** The shop's WhatsApp or phone number; empty hides the WhatsApp option. */
  whatsapp: string;
  theme: ThemeTokens;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  // The conversation stays mounted once opened, so closing keeps the draft.
  const [opened, setOpened] = React.useState(false);
  const [status, setStatus] = React.useState<{ signedIn: boolean | null; unread: number }>({
    signedIn: null,
    unread: 0,
  });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // The Messages page in the account is this same chat, full size.
  const hidden = sitePath(pathname, basePath).startsWith("/account/messages");
  const number = normalizePhone(whatsapp);
  const titleId = React.useId();

  const refresh = React.useCallback(async () => {
    try {
      // `peek` counts without marking anything read. A plain fetch rather than
      // a server action, so it works the same on a shop's subdomain.
      const params = new URLSearchParams({ shop: businessSlug, peek: "1" });
      const response = await fetch(`/api/site/chat?${params}`, { cache: "no-store" });
      const data = (await response.json()) as { signedIn?: boolean; unread?: number };
      setStatus({ signedIn: Boolean(data.signedIn), unread: data.unread ?? 0 });
    } catch {
      // Keep what we had; the next poll tries again.
    }
  }, [businessSlug]);

  // Also on closing the panel and on every navigation, since signing in or
  // out happens on another page.
  usePolling(refresh, CLOSED_POLL_MS, !open && !hidden, pathname);

  const close = React.useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // The conversation focuses its text box; anything else, the panel itself.
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel && !panel.contains(document.activeElement)) panel.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(frame);
    };
  }, [open, close]);

  if (hidden) return null;

  const unread = open ? 0 : status.unread;
  const label = unread
    ? `Chat with ${shopName}, ${unread} unread ${unread === 1 ? "message" : "messages"}`
    : `Chat with ${shopName}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CHAT_CSS }} />
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (open) return close();
          setOpen(true);
          setOpened(true);
          if (status.signedIn !== true) void refresh();
        }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          ...themeCssVars(theme),
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 60,
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          padding: "12px 17px 12px 14px",
          border: 0,
          borderRadius: 999,
          backgroundColor: "var(--w-primary)",
          color: "var(--w-btn-on-primary,#fff)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,.45)",
        }}
      >
        {open ? <X size={20} aria-hidden /> : <MessageCircle size={20} aria-hidden />}
        {open ? "Close" : "Chat with us"}
        {unread > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: -5,
              right: -3,
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "#d93025",
              color: "#fff",
              fontSize: 11.5,
              fontWeight: 700,
              boxShadow: "0 0 0 2px var(--w-bg)",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {opened && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="w-root w-chat-panel"
          style={{ ...themeCssVars(theme), display: open ? "flex" : "none" }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "13px 14px",
              background: "var(--w-surface)",
              borderBottom: "1px solid color-mix(in srgb,var(--w-text) 10%,transparent)",
            }}
          >
            {logo ? (
              <SiteImage
                src={logo}
                alt=""
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--w-primary)",
                  color: "var(--w-btn-on-primary,#fff)",
                  fontWeight: 700,
                }}
              >
                {shopName.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                id={titleId}
                style={{
                  fontSize: 15.5,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shopName}
              </h2>
              <p className="w-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                We reply here as soon as we can
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", padding: 4 }}
            >
              <X size={19} />
            </button>
          </header>

          {status.signedIn === null ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--w-muted)" }}>
              <Loader2 size={20} className="w-chat-spin" aria-label="Loading" />
            </div>
          ) : status.signedIn ? (
            <ShopChatConversation
              businessSlug={businessSlug}
              basePath={basePath}
              shopName={shopName}
              live={open}
              autoFocus
              onSeen={() => setStatus((current) => ({ ...current, unread: 0 }))}
              onSignedOut={() => setStatus({ signedIn: false, unread: 0 })}
              style={{ flex: 1 }}
            />
          ) : (
            <div style={{ flex: 1, overflowY: "auto", display: "grid", alignContent: "center" }}>
              <ChatSignInPrompt basePath={basePath} shopName={shopName} />
            </div>
          )}

          {number && (
            <a
              href={`https://wa.me/${number}`}
              onClick={(event) => {
                // Built at click time so it matches the page being looked at.
                event.currentTarget.href = `https://wa.me/${number}?text=${encodeURIComponent(
                  whatsappMessage(pathname, basePath, shopName),
                )}`;
              }}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "9px 14px 11px",
                fontSize: 12.5,
                color: "inherit",
                textDecoration: "none",
                borderTop: "1px solid color-mix(in srgb,var(--w-text) 8%,transparent)",
              }}
            >
              <span className="w-muted">Prefer WhatsApp?</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "#1a9e4b" }}>
                <WhatsAppIcon size={15} />
                Chat on WhatsApp
              </span>
            </a>
          )}
        </div>
      )}
    </>
  );
}

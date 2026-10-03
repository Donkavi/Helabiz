"use client";

import * as React from "react";
import { FileText, Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
/** Any conversation's message: business and Helabiz, or shop and customer. */
export type ThreadMessage = {
  id: string;
  from: string;
  authorName: string;
  body: string;
  kind?: "text" | "request";
  createdAt: string;
  readAt?: string;
};

/**
 * A two-sided chat: the business and the Helabiz team (the Support page and
 * the admin's thread view), or a shop and one of its customers (the
 * dashboard's Messages). The caller supplies
 * how to send and how to fetch what is new, so the component knows nothing
 * about who is allowed to do either.
 *
 * New messages arrive by polling. Simple and enough for a support chat, and
 * it stops while the tab is hidden so an idle tab costs nothing.
 */

export type ChatLabels = {
  placeholder: string;
  send: string;
  empty: string;
  /** Shown above the request summary message. */
  requestBadge: string;
  you: string;
  sending: string;
};

const POLL_MS = 6000;

export function ChatThread({
  initialMessages,
  viewer,
  send,
  poll,
  labels,
  lang = "en",
  className,
}: {
  initialMessages: ThreadMessage[];
  /** Whose screen this is: their own messages sit on the right. */
  viewer: string;
  send: (body: string) => Promise<{ ok: true; message: ThreadMessage } | { ok: false; error: string }>;
  poll: (after?: string) => Promise<ThreadMessage[]>;
  labels: ChatLabels;
  lang?: string;
  className?: string;
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const latest = messages[messages.length - 1]?.createdAt;
  // Read by the poller, which must not restart every time a message arrives.
  const latestRef = React.useRef(latest);
  React.useEffect(() => {
    latestRef.current = latest;
  }, [latest]);

  const merge = React.useCallback((incoming: ThreadMessage[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const seen = new Set(current.map((message) => message.id));
      const fresh = incoming.filter((message) => !seen.has(message.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }, []);

  // Poll while the tab is visible.
  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const incoming = await poll(latestRef.current);
        if (!cancelled) merge(incoming);
      } catch {
        // A missed poll is retried on the next tick.
      }
    };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll, merge]);

  // Keep the newest message in view.
  React.useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    const result = await send(body);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft("");
    merge([result.message]);
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto scrollbar-thin p-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted-foreground">{labels.empty}</p>
        ) : (
          messages.map((message, index) => {
            const mine = message.from === viewer;
            const previous = messages[index - 1];
            const showName = !previous || previous.from !== message.from || previous.authorName !== message.authorName;
            return (
              <div key={message.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {showName && (
                  <span className="mb-1 px-1 text-[11.5px] font-medium text-muted-foreground">
                    {mine ? labels.you : message.authorName}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                    message.kind === "request"
                      ? "border border-primary/30 bg-primary-muted/40 text-foreground"
                      : mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-muted text-foreground",
                  )}
                >
                  {message.kind === "request" && (
                    <span className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-primary">
                      <FileText className="size-3.5" />
                      {labels.requestBadge}
                    </span>
                  )}
                  {message.body}
                </div>
                <time
                  dateTime={message.createdAt}
                  className="mt-1 px-1 text-[11px] text-muted-foreground/80"
                  suppressHydrationWarning
                >
                  {new Date(message.createdAt).toLocaleString(lang === "si" ? "si-LK" : "en-LK", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            );
          })
        )}
      </div>

      <form
        className="border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {error && (
          <p role="alert" className="mb-2 text-[12.5px] text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends; Shift+Enter is a new line, as in every chat app.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder={labels.placeholder}
            rows={2}
            maxLength={4000}
            aria-label={labels.placeholder}
            className="min-h-[44px] resize-none"
          />
          <Button type="submit" disabled={sending || !draft.trim()} aria-label={labels.send}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            <span className="hidden sm:inline">{sending ? labels.sending : labels.send}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

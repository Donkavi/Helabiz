"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatThread } from "@/components/support/chat-thread";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { MESSAGES_UI, type MessagesCopy } from "@/components/dashboard/messages/copy";
import { useLang } from "@/lib/i18n/provider";
import { fill } from "@/lib/i18n/dashboard";
import type { Lang } from "@/lib/i18n";
import { cn, formatCurrency, initials } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import type { ShopChatCustomer, ShopChatMessage, ShopChatThread } from "@/services/shop-chat-service";
import { pollShopChatAction, sendShopMessageAction } from "./actions";

export type RecentOrder = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
};

type Selected = { customer: ShopChatCustomer; messages: ShopChatMessage[]; orders: RecentOrder[] };

const TYPE_VARIANT: Record<string, "default" | "success" | "muted"> = { vip: "default", regular: "success" };

/** Refreshes the list and the nav badge while the screen is open. */
const REFRESH_MS = 30_000;

const PANE_HEIGHT = "h-[calc(100dvh-13rem)] min-h-[420px] lg:h-[calc(100dvh-15rem)] lg:min-h-[520px]";

function locale(lang: Lang) {
  return lang === "si" ? "si-LK" : "en-LK";
}

/** The time for today's messages, the date for older ones. */
function shortTime(iso: string, lang: Lang) {
  const date = new Date(iso);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString(locale(lang), { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(locale(lang), { day: "numeric", month: "short" });
}

function longDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(locale(lang), { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The Messages screen's live part: the conversations, the open one, and the
 * customer behind it. Which conversation is open lives in the address
 * (`?customer=`), so the bell's links land on it and a phone's back button
 * returns to the list.
 */
export function MessagesInbox({
  threads,
  selected,
  canReply,
  clearedUnread,
}: {
  threads: ShopChatThread[];
  selected: Selected | null;
  /** Without the add-on, old conversations can be read but not answered. */
  canReply: boolean;
  /** Opening the conversation marked it read; the nav badge still counts it. */
  clearedUnread: boolean;
}) {
  const lang = useLang();
  const copy = MESSAGES_UI[lang];
  const router = useRouter();

  // The layout, with the nav badge and the bell, rendered alongside this page
  // and is kept across navigation; one refresh brings it up to date.
  React.useEffect(() => {
    if (clearedUnread) router.refresh();
  }, [clearedUnread, router]);

  // The open conversation polls by itself; this brings in new conversations.
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [router]);

  const selectedId = selected?.customer.id;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start xl:grid-cols-[260px_minmax(0,1fr)_280px]">
      <Card
        data-tour="messages-list"
        className={cn("flex flex-col overflow-hidden lg:h-[calc(100dvh-15rem)] lg:min-h-[520px]", selected && "hidden lg:flex")}
      >
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="size-4 text-primary" />
            {copy.conversations}
            <span className="font-normal text-muted-foreground">{threads.length}</span>
          </CardTitle>
        </CardHeader>
        {threads.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">{copy.emptyTitle}</p>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto scrollbar-thin">
            {threads.map((thread) => (
              <li key={thread.customer.id}>
                <ThreadRow thread={thread} active={thread.customer.id === selectedId} copy={copy} lang={lang} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected ? (
        <Conversation key={selected.customer.id} selected={selected} canReply={canReply} copy={copy} lang={lang} />
      ) : (
        <Card className={cn("hidden flex-col items-center justify-center px-6 text-center lg:flex", PANE_HEIGHT)}>
          <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-xs">
            <MessageCircle className="size-5 text-primary" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">{copy.pickTitle}</p>
          <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">{copy.pickBody}</p>
        </Card>
      )}
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  copy,
  lang,
}: {
  thread: ShopChatThread;
  active: boolean;
  copy: MessagesCopy;
  lang: Lang;
}) {
  const { customer, lastMessage, unread } = thread;
  return (
    <Link
      href={`/messages?customer=${customer.id}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors outline-none focus-visible:bg-muted/60",
        active ? "bg-primary-muted/50" : "hover:bg-muted/40",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[12px] font-semibold text-primary">
        {initials(customer.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("truncate text-[13.5px]", unread > 0 ? "font-semibold" : "font-medium")}>
            {customer.name}
          </span>
          <time
            dateTime={lastMessage.createdAt}
            className="ml-auto shrink-0 text-[11px] text-muted-foreground"
            suppressHydrationWarning
          >
            {shortTime(lastMessage.createdAt, lang)}
          </time>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              "line-clamp-1 flex-1 break-all text-[12.5px]",
              unread > 0 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {lastMessage.from === "shop" && <span className="text-muted-foreground">{copy.you} </span>}
            {lastMessage.body}
          </span>
          {unread > 0 && (
            <span
              className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10.5px] font-semibold leading-none text-primary-foreground"
              aria-label={fill(copy.unread, { count: unread })}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function Conversation({
  selected,
  canReply,
  copy,
  lang,
}: {
  selected: Selected;
  canReply: boolean;
  copy: MessagesCopy;
  lang: Lang;
}) {
  const { customer } = selected;
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  // Stable, or the chat would restart its poller on every render.
  const poll = React.useCallback((after?: string) => pollShopChatAction(customer.id, after), [customer.id]);
  const send = React.useCallback(
    async (body: string) =>
      canReply ? sendShopMessageAction(customer.id, body) : { ok: false as const, error: copy.replyNeedsAddon },
    [canReply, customer.id, copy.replyNeedsAddon],
  );

  const openProfile = () => {
    setProfileOpen(true);
    requestAnimationFrame(() => profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <>
      <Card data-tour="messages-thread" className={cn("flex flex-col overflow-hidden", PANE_HEIGHT)}>
        <CardHeader className="flex-row items-center gap-3 border-b border-border pb-4">
          <Button variant="ghost" size="icon-sm" className="-ml-1.5 shrink-0 lg:hidden" asChild>
            <Link href="/messages" aria-label={copy.back}>
              <ArrowLeft />
            </Link>
          </Button>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[12px] font-semibold text-primary">
            {initials(customer.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate">{customer.name}</CardTitle>
              <Badge variant={TYPE_VARIANT[customer.type] ?? "muted"} className="shrink-0">
                {copy.types[customer.type] ?? customer.type}
              </Badge>
            </div>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="mt-0.5 block truncate text-[12.5px] text-muted-foreground hover:text-foreground"
              >
                {customer.phone}
              </a>
            )}
          </div>
          <Button variant="outline" size="sm" className="shrink-0 xl:hidden" onClick={openProfile}>
            <UserRound className="size-3.5" />
            <span className="hidden sm:inline">{copy.showProfile}</span>
          </Button>
        </CardHeader>
        <ChatThread
          className="flex-1"
          initialMessages={selected.messages}
          viewer="shop"
          send={send}
          poll={poll}
          labels={copy.chat}
          lang={lang}
        />
      </Card>

      <div ref={profileRef} className="scroll-mt-20 lg:col-start-2 xl:col-start-3 xl:row-start-1">
        <CustomerProfile
          selected={selected}
          open={profileOpen}
          onToggle={() => setProfileOpen((open) => !open)}
          copy={copy}
          lang={lang}
        />
      </div>
    </>
  );
}

/** Who the shop is talking to. Always open beside the chat on wide screens; folds below it elsewhere. */
function CustomerProfile({
  selected,
  open,
  onToggle,
  copy,
  lang,
}: {
  selected: Selected;
  open: boolean;
  onToggle: () => void;
  copy: MessagesCopy;
  lang: Lang;
}) {
  const { customer, orders } = selected;
  const address = [customer.address, customer.city, customer.district].filter(Boolean).join(", ");

  return (
    <Card data-tour="messages-profile" className="overflow-hidden xl:max-h-[calc(100dvh-15rem)] scrollbar-thin xl:overflow-y-auto">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-4 text-left text-[15px] font-semibold outline-none focus-visible:bg-muted/40 xl:pointer-events-none"
      >
        <UserRound className="size-4 text-primary" />
        {copy.profile}
        <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform xl:hidden", open && "rotate-180")} />
      </button>

      <div className={cn("space-y-5 border-t border-border px-5 py-5", open ? "block" : "hidden", "xl:block")}>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[14px] font-semibold text-primary">
            {initials(customer.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold">{customer.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge variant={TYPE_VARIANT[customer.type] ?? "muted"}>{copy.types[customer.type] ?? customer.type}</Badge>
              {customer.memberSince && (
                <span className="text-[12px] text-muted-foreground" suppressHydrationWarning>
                  {fill(copy.memberSince, { date: longDate(customer.memberSince, lang) })}
                </span>
              )}
            </div>
          </div>
        </div>

        {customer.phone && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${customer.phone}`}>
                <Phone className="size-3.5" />
                {copy.call}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={whatsappLink(customer.phone, fill(copy.whatsappGreeting, { name: customer.name }))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-3.5" />
                {copy.whatsapp}
              </a>
            </Button>
          </div>
        )}

        <div className="space-y-2.5 text-[13px]">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
              <Phone className="size-3.5 shrink-0" />
              {customer.phone}
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-2.5 break-all text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-3.5 shrink-0" />
              {customer.email}
            </a>
          )}
          {address && (
            <p className="flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>{address}</span>
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <dt className="text-[11.5px] text-muted-foreground">{copy.totalOrders}</dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{customer.totalOrders}</dd>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <dt className="text-[11.5px] text-muted-foreground">{copy.totalSpent}</dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">
              {formatCurrency(customer.totalSpent, { decimals: false })}
            </dd>
          </div>
          <div className="col-span-2 rounded-lg bg-muted/50 px-3 py-2.5">
            <dt className="text-[11.5px] text-muted-foreground">{copy.lastOrder}</dt>
            <dd className="mt-0.5 text-[13.5px] font-medium" suppressHydrationWarning>
              {customer.lastOrderAt ? longDate(customer.lastOrderAt, lang) : copy.noOrdersYet}
            </dd>
          </div>
        </dl>

        {orders.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{copy.recentOrders}</p>
            <ul className="mt-2 divide-y divide-border">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <ShoppingBag className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[12.5px] font-medium">{order.orderNumber}</span>
                      <span className="block text-[11.5px] text-muted-foreground" suppressHydrationWarning>
                        {longDate(order.createdAt, lang)} · {fill(copy.items, { count: order.itemCount })}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[12.5px] font-semibold tabular-nums">
                        {formatCurrency(order.total, { decimals: false })}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="outline" className="w-full" asChild>
          <Link href={`/customers/${customer.id}`}>{copy.viewFullProfile}</Link>
        </Button>
      </div>
    </Card>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Check, MessagesSquare, Sparkles, UserX } from "lucide-react";
import { requireBusiness } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { ADDONS, hasAddon } from "@/lib/addons";
import { getLang } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/dashboard";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/models/Order";
import { Notification } from "@/models/Notification";
import { Website } from "@/models/Website";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageTour } from "@/components/dashboard/tour/tour";
import { MESSAGES_UI } from "@/components/dashboard/messages/copy";
import {
  listShopThreads,
  markReadByShop,
  shopChatCustomer,
  shopChatMessages,
} from "@/services/shop-chat-service";
import { MessagesInbox, type RecentOrder } from "./messages-inbox";

export async function generateMetadata(): Promise<Metadata> {
  return { title: MESSAGES_UI[await getLang()].pageTitle };
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const { business, businessId } = await requireBusiness();
  const lang = await getLang();
  const copy = MESSAGES_UI[lang];
  const params = await searchParams;
  await connectDB();

  const [threads, website, customer] = await Promise.all([
    listShopThreads(businessId),
    Website.findOne({ businessId }).select("settings.customerAccounts").lean(),
    // Checked against the business, so an id in the address cannot open another shop's customer.
    params.customer ? shopChatCustomer(businessId, params.customer) : null,
  ]);

  const addonActive = hasAddon(business, "whatsapp_chat");
  const accountsOff = website?.settings?.customerAccounts === false;

  let selected: { messages: Awaited<ReturnType<typeof shopChatMessages>>; orders: RecentOrder[] } | null = null;
  let clearedUnread = false;
  if (customer) {
    const [messages, orders] = await Promise.all([
      shopChatMessages(businessId, customer.id),
      Order.find({ businessId, customerId: customer.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber total status createdAt items")
        .lean(),
    ]);
    selected = {
      messages,
      orders: orders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        total: order.total ?? 0,
        status: order.status ?? "pending",
        createdAt: new Date(order.createdAt).toISOString(),
        itemCount: order.items?.length ?? 0,
      })),
    };

    // Opening the conversation is reading it, and the bell's "new message
    // from …" items for it with it.
    const unread = messages.some((message) => message.from === "customer" && !message.readAt);
    const [, notes] = await Promise.all([
      unread ? markReadByShop(businessId, customer.id) : null,
      Notification.updateMany(
        { businessId, type: "shop_chat", href: `/messages?customer=${customer.id}`, read: false },
        { $set: { read: true } },
      ),
    ]);
    clearedUnread = unread || notes.modifiedCount > 0;
  }

  // The list was read before the conversation was marked read.
  const list = threads.map((thread) => (thread.customer.id === customer?.id ? { ...thread, unread: 0 } : thread));
  const showInbox = list.length > 0 || Boolean(customer);

  return (
    <div className="space-y-6">
      <PageTour id="messages" />
      <PageHeader title={copy.pageTitle} description={copy.pageDescription} />

      {!addonActive && (
        <Card className="border-primary/25">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 max-w-2xl">
              <Badge variant="soft">{copy.addonEyebrow}</Badge>
              <h2 className="mt-3 text-[17px] font-semibold tracking-[-0.01em]">{copy.addonTitle}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{copy.addonBody}</p>
              <ul className="mt-4 space-y-2">
                {copy.addonPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
              {list.length > 0 && <p className="mt-4 text-[12.5px] text-muted-foreground">{copy.addonOldChats}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1.5 md:items-center">
              <Button asChild>
                <Link href="/settings/billing?addons=whatsapp_chat#checkout">
                  <Sparkles className="size-4" />
                  {copy.addonCta}
                </Link>
              </Button>
              <p className="text-[12px] text-muted-foreground">
                {fill(copy.addonPrice, { price: formatCurrency(ADDONS.whatsapp_chat.price, { decimals: false }) })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {addonActive && accountsOff && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <UserX className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-[13.5px] font-semibold text-foreground">{copy.accountsOffTitle}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{copy.accountsOffBody}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/website/settings">{copy.accountsOffCta}</Link>
          </Button>
        </div>
      )}

      {showInbox ? (
        <MessagesInbox
          threads={list}
          selected={customer && selected ? { customer, ...selected } : null}
          canReply={addonActive}
          clearedUnread={clearedUnread}
        />
      ) : (
        addonActive && <EmptyState icon={MessagesSquare} title={copy.emptyTitle} description={copy.emptyBody} />
      )}
    </div>
  );
}

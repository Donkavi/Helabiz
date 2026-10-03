import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { SUPPORT_UI } from "@/components/dashboard/support/copy";
import { getLang } from "@/lib/i18n/server";
import { Notification } from "@/models/Notification";
import { chatMessages, latestWebsiteRequest, markReadByBusiness } from "@/services/support-service";
import { SupportView } from "./support-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: SUPPORT_UI[await getLang()].pageTitle };
}

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { business, businessId } = await requireBusiness();
  const copy = SUPPORT_UI[await getLang()];
  const params = await searchParams;

  const [messages, request] = await Promise.all([chatMessages(businessId), latestWebsiteRequest(businessId)]);

  // Opening the chat is reading the team's replies, and the bell's "new
  // message from the Helabiz team" items with them.
  const unread = messages.some((message) => message.from === "helabiz" && !message.readAt);
  const [, notes] = await Promise.all([
    unread ? markReadByBusiness(businessId) : null,
    Notification.updateMany({ businessId, type: "support", read: false }, { $set: { read: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={copy.pageTitle} description={copy.pageDescription} />
      <SupportView
        initialMessages={messages}
        initialRequest={request}
        defaultPhone={business.phone ?? undefined}
        openRequestForm={params.request === "1"}
        clearedUnread={unread || notes.modifiedCount > 0}
      />
    </div>
  );
}

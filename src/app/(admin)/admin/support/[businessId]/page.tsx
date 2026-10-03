import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileText } from "lucide-react";
import { requireSuperAdmin } from "@/lib/permissions/admin";
import {
  businessName,
  chatMessages,
  hasSupportAccess,
  latestWebsiteRequest,
  markReadByHelabiz,
} from "@/services/support-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatThread } from "@/components/support/chat-thread";
import { RequestStatusBadge } from "../../requests/request-status-badge";
import { adminPollSupportAction, adminSendMessageAction } from "../actions";
import { SupportAccess } from "../support-access";

export const metadata = { title: "Support chat" };

export default async function AdminSupportThreadPage({ params }: { params: Promise<{ businessId: string }> }) {
  const admin = await requireSuperAdmin();
  const { businessId } = await params;
  const name = await businessName(businessId);
  if (!name) notFound();

  const [messages, request, access] = await Promise.all([
    chatMessages(businessId),
    latestWebsiteRequest(businessId),
    hasSupportAccess(businessId, admin.id),
  ]);
  // Opening the thread is reading it.
  await markReadByHelabiz(businessId);

  const openRequest = request && request.status !== "done" && request.status !== "cancelled" ? request : null;

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/support">
            <ArrowLeft className="size-3.5" />
            All conversations
          </Link>
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{name}</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Messages reach the business&apos;s Support page and its notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/businesses/${businessId}`}>
                <Building2 className="size-3.5" />
                Business
              </Link>
            </Button>
            {openRequest && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/requests/${openRequest.id}`}>
                  <FileText className="size-3.5" />
                  Website request
                  <RequestStatusBadge status={openRequest.status} />
                </Link>
              </Button>
            )}
            <SupportAccess businessId={businessId} hasAccess={access} />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <ChatThread
          initialMessages={messages}
          viewer="helabiz"
          send={adminSendMessageAction.bind(null, businessId)}
          poll={adminPollSupportAction.bind(null, businessId)}
          labels={{
            placeholder: `Reply to ${name}…`,
            send: "Send",
            empty: "No messages yet. Say hello — they will see it on their Support page.",
            requestBadge: "Website request",
            you: "Helabiz team",
            sending: "Sending…",
          }}
          className="h-[min(640px,calc(100dvh_-_15rem))] min-h-[420px]"
        />
      </Card>
    </div>
  );
}

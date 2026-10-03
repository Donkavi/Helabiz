"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, MessageCircle, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatThread } from "@/components/support/chat-thread";
import { SUPPORT_UI, isOpenRequest } from "@/components/dashboard/support/copy";
import { WebsiteRequestDialog } from "@/components/dashboard/support/website-request-dialog";
import { useLang } from "@/lib/i18n/provider";
import { fill } from "@/lib/i18n/dashboard";
import { REQUEST_STATUS_LABELS } from "@/lib/website-request";
import type { ChatMessage, WebsiteRequestView } from "@/services/support-service";
import { pollSupportAction, sendSupportMessageAction } from "./actions";

/**
 * The Support page's live part: the chat with the Helabiz team, and beside
 * it the website request — its status, kept current by the chat's polling,
 * or the offer to make one.
 */
export function SupportView({
  initialMessages,
  initialRequest,
  defaultPhone,
  openRequestForm,
  clearedUnread,
}: {
  initialMessages: ChatMessage[];
  initialRequest: WebsiteRequestView | null;
  defaultPhone?: string;
  /** Arrived from "Build my website for me" elsewhere: open the form at once. */
  openRequestForm: boolean;
  /** Opening the page marked replies read; the top bar's badge still counts them. */
  clearedUnread: boolean;
}) {
  const lang = useLang();
  const copy = SUPPORT_UI[lang];
  const router = useRouter();

  // The layout, with its unread badge and bell, rendered alongside this page
  // and is kept across navigation; one refresh brings it up to date.
  React.useEffect(() => {
    if (clearedUnread) router.refresh();
  }, [clearedUnread, router]);

  const [request, setRequest] = React.useState(initialRequest);
  const [formOpen, setFormOpen] = React.useState(openRequestForm && !isOpenRequest(initialRequest?.status));

  // Stable, or the chat would restart its poller on every render.
  const poll = React.useCallback(async (after?: string) => {
    const result = await pollSupportAction(after);
    setRequest(result.request);
    return result.messages;
  }, []);

  const status = request?.status;
  const showStatus = Boolean(request && status !== "cancelled");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <Card className="flex h-[calc(100dvh-13rem)] min-h-[420px] flex-col overflow-hidden lg:h-[calc(100dvh-15rem)] lg:min-h-[520px]">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
              <MessageCircle className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle>{copy.chatTitle}</CardTitle>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{copy.chatSubtitle}</p>
            </div>
          </div>
        </CardHeader>
        <ChatThread
          className="flex-1"
          initialMessages={initialMessages}
          viewer="business"
          send={sendSupportMessageAction}
          poll={poll}
          labels={copy.chat}
          lang={lang}
        />
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="size-4 text-primary" />
              {showStatus ? copy.requestTitle : copy.offerEyebrow}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            {showStatus && request && status ? (
              <div className="space-y-1.5">
                <Badge variant={status === "done" ? "success" : "soft"}>{REQUEST_STATUS_LABELS[status][lang]}</Badge>
                <p className="text-[12.5px] text-muted-foreground" suppressHydrationWarning>
                  {fill(copy.requestSent, {
                    date: new Date(request.createdAt).toLocaleDateString(lang === "si" ? "si-LK" : "en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[14px] font-semibold leading-snug">{copy.offerTitle}</p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{copy.offerBody}</p>
                <Button className="w-full" onClick={() => setFormOpen(true)}>
                  <Wand2 className="size-4" />
                  {status === "cancelled" ? copy.askAgain : copy.offerCta}
                </Button>
              </div>
            )}

            {status !== "done" && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {copy.nextTitle}
                </p>
                <ol className="mt-2.5 space-y-2.5">
                  {copy.nextSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[11px] font-semibold text-primary">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
              {copy.reassurance} {copy.accessNote}
            </p>
          </CardContent>
        </Card>
      </div>

      <WebsiteRequestDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultPhone={defaultPhone}
        onSubmitted={setRequest}
      />
    </div>
  );
}

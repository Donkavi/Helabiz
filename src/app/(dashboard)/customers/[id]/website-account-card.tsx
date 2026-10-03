"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, MessageCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, relativeTime } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { createPasswordResetLinkAction } from "../actions";

/**
 * The customer's sign-in on the shop's website, and the way to get them back
 * in when they forget their password: a one-time link the owner sends them.
 */
export function WebsiteAccountCard({
  customerId,
  customerName,
  phone,
  email,
  createdAt,
  lastSignInAt,
  businessName,
}: {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  createdAt: string;
  lastSignInAt?: string;
  businessName: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const [reset, setReset] = React.useState<{ link: string; hours: number } | null>(null);

  const create = () =>
    startTransition(async () => {
      const result = await createPasswordResetLinkAction(customerId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReset({ link: result.link, hours: result.hours });
    });

  const copy = async () => {
    if (!reset) return;
    try {
      await navigator.clipboard.writeText(reset.link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it instead.");
    }
  };

  const message = reset
    ? `Hello ${customerName}, here is your link to choose a new password for your ${businessName} account: ${reset.link}`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4 text-primary" />
          Website account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-[13.5px]">
        <div className="space-y-1 text-muted-foreground">
          {email && <p className="break-all">Signs in with {email}</p>}
          <p>Registered {formatDate(createdAt, "long")}</p>
          {lastSignInAt && <p>Last signed in {relativeTime(lastSignInAt)}</p>}
        </div>

        {!reset ? (
          <Button variant="outline" size="sm" onClick={create} disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
            Create password reset link
          </Button>
        ) : (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[12.5px] text-muted-foreground">
              Send this to {customerName}. It works once, for {reset.hours} hours.
            </p>
            <input
              readOnly
              value={reset.link}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[12px]"
              aria-label="Password reset link"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-3.5" />
                  Send on WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="size-3.5" />
                Copy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

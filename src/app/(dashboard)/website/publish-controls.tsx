"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { publishAction, unpublishAction } from "./actions";

export function PublishControls({
  published,
  hasChanges,
  liveUrl,
}: {
  published: boolean;
  hasChanges: boolean;
  liveUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [confirmUnpublish, setConfirmUnpublish] = React.useState(false);

  const publish = () =>
    startTransition(async () => {
      const result = await publishAction();
      if (result.ok) {
        toast.success("Website published successfully.", {
          description: liveUrl,
          action: { label: "Visit", onClick: () => window.open(liveUrl, "_blank", "noopener") },
        });
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not publish");
      }
    });

  return (
    <div className="flex shrink-0 items-center gap-2">
      {published && (
        <Button variant="ghost" size="sm" onClick={() => setConfirmUnpublish(true)}>
          <EyeOff className="size-3.5" />
          Unpublish
        </Button>
      )}
      <Button onClick={publish} loading={pending} variant={hasChanges || !published ? "default" : "outline"}>
        <Rocket className="size-4" />
        {published ? (hasChanges ? "Publish changes" : "Republish") : "Publish website"}
      </Button>

      <Dialog open={confirmUnpublish} onOpenChange={setConfirmUnpublish}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Take your website offline?</DialogTitle>
            <DialogDescription>
              Visitors will see a “coming soon” page instead. Your pages, design and orders are all kept — publish
              again whenever you are ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnpublish(false)}>
              Keep it online
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  await unpublishAction();
                  setConfirmUnpublish(false);
                  toast.success("Website taken offline");
                  router.refresh();
                })
              }
            >
              Take offline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

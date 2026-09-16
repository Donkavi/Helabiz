"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Eye,
  Layers,
  Loader2,
  Monitor,
  Redo2,
  Rocket,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type { Viewport } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/misc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useEditor } from "./editor-store";

const VIEWPORTS: { value: Viewport; label: string; icon: typeof Monitor }[] = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

function SaveIndicator() {
  const { saveState } = useEditor();

  if (saveState === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (saveState === "error") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-destructive">
        <CloudOff className="size-3" />
        Not saved
      </span>
    );
  }
  if (saveState === "dirty") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Cloud className="size-3" />
        Unsaved changes
      </span>
    );
  }
  if (saveState === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Check className="size-3 text-success" />
        Saved
      </span>
    );
  }
  return <span className="text-[12px] text-muted-foreground">All changes saved</span>;
}

export function BuilderToolbar({
  pages,
  currentPageId,
  websiteStatus,
  hasUnpublishedChanges,
  previewUrl,
  onPublish,
  showLayers,
  onToggleLayers,
}: {
  pages: { id: string; title: string; slug: string }[];
  currentPageId: string;
  websiteStatus: string;
  hasUnpublishedChanges: boolean;
  previewUrl: string;
  onPublish: () => Promise<{ ok: boolean; error?: string }>;
  showLayers: boolean;
  onToggleLayers: () => void;
}) {
  const router = useRouter();
  const { viewport, setViewport, undo, redo, canUndo, canRedo, saveNow, saveState } = useEditor();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [publishedOpen, setPublishedOpen] = React.useState(false);

  const publish = async () => {
    setPublishing(true);
    // Flush pending edits so the published snapshot includes them (spec §48).
    await saveNow();
    const result = await onPublish();
    setPublishing(false);
    setConfirmOpen(false);
    if (result.ok) {
      setPublishedOpen(true);
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not publish your website");
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        <Tooltip content="Back to your website settings">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/website/pages" aria-label="Leave the builder">
              <ArrowLeft />
            </Link>
          </Button>
        </Tooltip>

        <Link href="/dashboard" className="hidden sm:block" aria-label="Helabiz dashboard">
          <LogoMark />
        </Link>

        <div className="mx-1 h-6 w-px bg-border" aria-hidden />

        <Select value={currentPageId} onValueChange={(id) => router.push(`/website/builder/${id}`)}>
          <SelectTrigger size="sm" className="w-[150px]" aria-label="Page being edited">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip content={showLayers ? "Hide the section list" : "Show the section list"}>
          <Button
            variant={showLayers ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={onToggleLayers}
            aria-pressed={showLayers}
            aria-label="Toggle section list"
          >
            <Layers />
          </Button>
        </Tooltip>

        <div className="flex items-center gap-0.5">
          <Tooltip content="Undo (Ctrl+Z)">
            <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label="Undo">
              <Undo2 />
            </Button>
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Shift+Z)">
            <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label="Redo">
              <Redo2 />
            </Button>
          </Tooltip>
        </div>

        {/* Viewport switcher (spec §17) */}
        <div className="mx-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {VIEWPORTS.map((option) => (
            <Tooltip key={option.value} content={option.label}>
              <button
                type="button"
                onClick={() => setViewport(option.value)}
                aria-pressed={viewport === option.value}
                aria-label={option.label}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-all",
                  viewport === option.value
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <option.icon className="size-3.5" />
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="hidden lg:block">
          <SaveIndicator />
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </a>
        </Button>

        <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={saveState === "saving"}>
          <Rocket className="size-3.5" />
          Publish
          {hasUnpublishedChanges && websiteStatus === "published" && (
            <span className="ml-0.5 size-1.5 rounded-full bg-primary-foreground/80" aria-label="Unpublished changes" />
          )}
        </Button>
      </header>

      {/* Publish confirmation (spec §48) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Publish changes?</DialogTitle>
            <DialogDescription>
              {websiteStatus === "published"
                ? "Your edits will replace what visitors see right now."
                : "This makes your website public for the first time."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Not yet
            </Button>
            <Button onClick={publish} loading={publishing}>
              <Rocket className="size-4" />
              Publish now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success (spec §23) */}
      <Dialog open={publishedOpen} onOpenChange={setPublishedOpen}>
        <DialogContent size="sm">
          <div className="flex flex-col items-center py-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
              <Rocket className="size-5" />
            </span>
            <DialogHeader className="mt-4 items-center pr-0">
              <DialogTitle>Your website is ready!</DialogTitle>
              <DialogDescription className="text-center">
                It is live and ready to take orders. Share the link anywhere you sell.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 p-2.5">
              <Badge variant="success">Live</Badge>
              <span className="min-w-0 flex-1 truncate text-left font-mono text-[12.5px]">{previewUrl}</span>
              <Button
                size="xs"
                variant="ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(previewUrl);
                    toast.success("Link copied");
                  } catch {
                    toast.error("Could not copy the link");
                  }
                }}
              >
                Copy
              </Button>
            </div>

            <div className="mt-5 flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPublishedOpen(false)}>
                Keep editing
              </Button>
              <Button className="flex-1" asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Visit site
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

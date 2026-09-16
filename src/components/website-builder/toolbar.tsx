"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Copy,
  ExternalLink,
  Eye,
  Layers,
  Loader2,
  Monitor,
  Plus,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PlanLimitDialog, type LimitBlockInfo } from "@/components/dashboard/plan-limit-dialog";
import { addPageAction } from "@/app/(dashboard)/website/actions";
import { cn, slugify } from "@/lib/utils";
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
  const [copied, setCopied] = React.useState(false);
  const [addPageOpen, setAddPageOpen] = React.useState(false);
  const [blocked, setBlocked] = React.useState<LimitBlockInfo | null>(null);

  const currentPage = pages.find((page) => page.id === currentPageId);

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

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-[150px] items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-left text-[13px] outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Page being edited"
          >
            <span className="min-w-0 flex-1 truncate font-medium">{currentPage?.title ?? "Page"}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Pages</DropdownMenuLabel>
            {pages.map((page) => (
              <DropdownMenuItem
                key={page.id}
                onSelect={() => router.push(`/website/builder/${page.id}`)}
                className="gap-2"
              >
                <span className="min-w-0 flex-1 truncate">{page.title}</span>
                {page.id === currentPageId && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setAddPageOpen(true)}>
              <Plus />
              New page
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/website/pages")}>
              <Layers />
              Manage pages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

      <NewPageDialog
        open={addPageOpen}
        onOpenChange={setAddPageOpen}
        onBlocked={(block) => {
          setAddPageOpen(false);
          setBlocked(block);
        }}
      />

      <PlanLimitDialog block={blocked} onOpenChange={() => setBlocked(null)} action="add another page" />

      {/* Success (spec §23) */}
      <Dialog open={publishedOpen} onOpenChange={setPublishedOpen}>
        <DialogContent size="md" className="sm:p-7">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-muted text-primary">
              <Rocket className="size-6" />
            </span>

            <DialogHeader className="mt-5 items-center pr-0">
              <DialogTitle className="text-[21px]">Your website is ready!</DialogTitle>
              <DialogDescription className="max-w-sm text-center text-pretty">
                It is live and ready to take orders. Share this link anywhere you sell.
              </DialogDescription>
            </DialogHeader>

            {/* The address, shown the way a customer would type it. */}
            <div className="mt-6 w-full min-w-0 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2.5">
                <Badge variant="success" className="shrink-0 gap-1.5">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                  </span>
                  Live
                </Badge>
                <span
                  className="min-w-0 flex-1 truncate text-left font-mono text-[13px] font-medium"
                  title={previewUrl}
                >
                  {previewUrl.replace(/^https?:\/\//, "")}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0"
                  aria-label="Copy website link"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(previewUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    } catch {
                      toast.error("Could not copy — select the link and copy it manually");
                    }
                  }}
                >
                  {copied ? <Check className="text-success" /> : <Copy />}
                </Button>
              </div>
            </div>

            <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setPublishedOpen(false)}>
                Keep editing
              </Button>
              <Button asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Visit site
                </a>
              </Button>
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
              Every change you make from now on stays a draft until you publish again.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Adds a page without leaving the builder, then opens it. */
function NewPageDialog({
  open,
  onOpenChange,
  onBlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlocked: (block: LimitBlockInfo) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTitle("");
      setError("");
    }
    onOpenChange(next);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await addPageAction(title);
      if (!result.ok) {
        if (result.blocked) {
          onBlocked(result.blocked);
          return;
        }
        setError(result.error);
        return;
      }
      toast.success(`“${title}” added`);
      onOpenChange(false);
      router.push(`/website/builder/${result.pageId}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a page</DialogTitle>
            <DialogDescription>
              It starts with a heading and some text, and opens straight away so you can build it.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-1.5">
            <Label htmlFor="new-page-title">Page name</Label>
            <Input
              id="new-page-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Services"
              required
              autoFocus
            />
            <p className="text-[12.5px] text-muted-foreground">
              Web address: <span className="font-mono">/{slugify(title) || "page"}</span>
            </p>
            {error && <p className="text-[12.5px] text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!title.trim()}>
              Add page
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

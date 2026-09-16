"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Home,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/misc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, relativeTime, slugify } from "@/lib/utils";
import { PlanLimitDialog, type LimitBlockInfo } from "@/components/dashboard/plan-limit-dialog";
import {
  addPageAction,
  deletePageAction,
  duplicatePageAction,
  reorderPagesAction,
  updatePageAction,
} from "../actions";

export type PageRow = {
  id: string;
  title: string;
  slug: string;
  isHome: boolean;
  hidden: boolean;
  showInNav: boolean;
  sectionCount: number;
  lastEditedAt?: string;
  seoTitle: string;
  seoDescription: string;
  noIndex: boolean;
};

export type PageAllowance = { used: number; max: number; planId: string; planName: string };

export function PagesManager({ pages, allowance }: { pages: PageRow[]; allowance: PageAllowance }) {
  const router = useRouter();
  // Optimistic order held only while a reorder is in flight; otherwise the
  // server's order is the source of truth.
  const [pendingOrder, setPendingOrder] = React.useState<PageRow[] | null>(null);
  const order = pendingOrder ?? pages;
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PageRow | null>(null);
  const [deleting, setDeleting] = React.useState<PageRow | null>(null);
  const [blocked, setBlocked] = React.useState<LimitBlockInfo | null>(null);
  const [pending, startTransition] = React.useTransition();

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string; blocked?: LimitBlockInfo }>,
    message: string,
  ) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        // A plan limit gets a real upgrade prompt, not a toast.
        if (result.blocked) setBlocked(result.blocked);
        else toast.error(result.error ?? "That did not work");
        return;
      }
      toast.success(message);
      router.refresh();
    });

  const atLimit = Number.isFinite(allowance.max) && allowance.used >= allowance.max;

  /** Shows the upgrade prompt without a round trip when the plan is already full. */
  const requestNewPage = () => {
    if (atLimit) {
      setBlocked({
        key: "pages",
        used: allowance.used,
        max: allowance.max,
        planId: allowance.planId,
        planName: allowance.planName,
        message: `The ${allowance.planName} plan covers ${allowance.max} website pages, and you have used them all.`,
      });
      return;
    }
    setAddOpen(true);
  };

  const commitOrder = (next: PageRow[]) => {
    setPendingOrder(next);
    startTransition(async () => {
      await reorderPagesAction(next.map((p) => p.id));
      router.refresh();
      setPendingOrder(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="mr-auto text-[13px] text-muted-foreground">
          {Number.isFinite(allowance.max) ? (
            <>
              <span className={cn("font-semibold", atLimit ? "text-warning" : "text-foreground")}>
                {allowance.used} of {allowance.max}
              </span>{" "}
              pages used on the {allowance.planName} plan
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{allowance.used}</span> pages · unlimited on{" "}
              {allowance.planName}
            </>
          )}
        </p>
        <Button onClick={requestNewPage} variant={atLimit ? "outline" : "default"}>
          {atLimit ? <Lock className="size-4" /> : <Plus className="size-4" />}
          {atLimit ? "Upgrade to add pages" : "Add page"}
        </Button>
      </div>

      <ul className="space-y-2">
        {order.map((page, index) => (
          <li
            key={page.id}
            draggable={!page.isHome}
            onDragStart={() => setDragId(page.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!dragId || dragId === page.id) return;
              const from = order.findIndex((p) => p.id === dragId);
              if (from < 0) return;
              const next = [...order];
              const [moved] = next.splice(from, 1);
              next.splice(index, 0, moved);
              commitOrder(next);
              setDragId(null);
            }}
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all",
              dragId === page.id && "opacity-50",
              !page.isHome && "cursor-grab active:cursor-grabbing",
            )}
          >
            <GripVertical
              className={cn("size-4 shrink-0 text-muted-foreground", page.isHome && "opacity-20")}
              aria-hidden
            />

            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                page.isHome ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {page.isHome ? <Home className="size-4" /> : <span className="text-[12px] font-semibold">{index + 1}</span>}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[14px] font-semibold">{page.title}</p>
                {page.isHome && <Badge variant="soft">Home</Badge>}
                {page.hidden && <Badge variant="muted">Hidden</Badge>}
                {!page.showInNav && !page.hidden && <Badge variant="outline">Not in menu</Badge>}
              </div>
              <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                /{page.isHome ? "" : page.slug}
                <span className="font-sans">
                  {" · "}
                  {page.sectionCount} section{page.sectionCount === 1 ? "" : "s"}
                  {page.lastEditedAt && ` · edited ${relativeTime(page.lastEditedAt)}`}
                </span>
              </p>
            </div>

            <Button size="sm" variant="outline" asChild>
              <Link href={`/website/builder/${page.id}`}>
                <Sparkles className="size-3.5" />
                Edit
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${page.title}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(page)}>
                  <Pencil /> Rename & SEO
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => run(() => duplicatePageAction(page.id), "Page duplicated")}>
                  <Copy /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => run(() => updatePageAction(page.id, { hidden: !page.hidden }), page.hidden ? "Page shown" : "Page hidden")}
                >
                  {page.hidden ? <Eye /> : <EyeOff />}
                  {page.hidden ? "Show page" : "Hide page"}
                </DropdownMenuItem>
                {!page.isHome && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(page)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <AddPageDialog open={addOpen} onOpenChange={setAddOpen} onBlocked={setBlocked} />
      {editing && <EditPageDialog page={editing} onClose={() => setEditing(null)} />}

      <PlanLimitDialog block={blocked} onOpenChange={() => setBlocked(null)} action="add another page" />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.title}”?</DialogTitle>
            <DialogDescription>
              The page and everything on it is removed. Anyone visiting its address will see a not-found page. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep page
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() => {
                if (!deleting) return;
                run(() => deletePageAction(deleting.id), "Page deleted");
                setDeleting(null);
              }}
            >
              Delete page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddPageDialog({
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
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

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
          onOpenChange(false);
          onBlocked(result.blocked);
          return;
        }
        setError(result.error);
        return;
      }
      toast.success("Page added");
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
            <DialogDescription>New pages start with a heading and some text you can replace.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-1.5">
            <Label htmlFor="page-title">Page name</Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

function EditPageDialog({ page, onClose }: { page: PageRow; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    title: page.title,
    slug: page.slug,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    noIndex: page.noIndex,
    showInNav: page.showInNav,
  });
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updatePageAction(page.id, {
        title: values.title,
        slug: values.slug,
        showInNav: values.showInNav,
        seo: {
          title: values.seoTitle,
          description: values.seoDescription,
          noIndex: values.noIndex,
        },
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save");
        return;
      }
      toast.success("Page updated");
      onClose();
      router.refresh();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Page settings</DialogTitle>
            <DialogDescription>Rename the page and control how it appears in search results.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Page name</Label>
              <Input
                id="edit-title"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                required
              />
            </div>

            {!page.isHome && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-slug">Web address</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-muted-foreground">/</span>
                  <Input
                    id="edit-slug"
                    value={values.slug}
                    onChange={(e) => setValues({ ...values, slug: slugify(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <p className="text-[12.5px] text-muted-foreground">
                  Changing this breaks any links you have already shared.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-[13.5px] font-medium">Show in the menu</p>
                <p className="text-[12.5px] text-muted-foreground">Uncheck to keep the page but hide the link.</p>
              </div>
              <Switch
                checked={values.showInNav}
                onCheckedChange={(v) => setValues({ ...values, showInNav: v })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-seo-title">Search engine title</Label>
              <Input
                id="edit-seo-title"
                value={values.seoTitle}
                onChange={(e) => setValues({ ...values, seoTitle: e.target.value })}
                maxLength={70}
                placeholder={values.title}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-seo-desc">Meta description</Label>
              <Textarea
                id="edit-seo-desc"
                rows={3}
                value={values.seoDescription}
                onChange={(e) => setValues({ ...values, seoDescription: e.target.value })}
                maxLength={180}
                placeholder="A sentence that makes people want to click, shown under the title in Google."
              />
              <p className="text-[12.5px] text-muted-foreground">{values.seoDescription.length}/180</p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-[13.5px] font-medium">Hide from search engines</p>
                <p className="text-[12.5px] text-muted-foreground">Keeps this page out of Google results.</p>
              </div>
              <Switch checked={values.noIndex} onCheckedChange={(v) => setValues({ ...values, noIndex: v })} />
            </div>

            {error && <p className="text-[12.5px] text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

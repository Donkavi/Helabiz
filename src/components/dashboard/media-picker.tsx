"use client";

import * as React from "react";
import { Check, ImagePlus, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MediaItem = { id: string; url: string; name: string; size: number; alt?: string };

type PickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  title?: string;
};

/** The shared media library dialog (spec §21). Reachable from every image field. */
export function MediaPicker({ open, onOpenChange, onSelect, multiple, title = "Media library" }: PickerProps) {
  const [items, setItems] = React.useState<MediaItem[] | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Loads the library whenever the dialog opens. `cancelled` stops a slow
  // response from overwriting state after the dialog has closed again.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetch("/api/media")
      .then((res) => (res.ok ? (res.json() as Promise<{ items: MediaItem[] }>) : { items: [] }))
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSelected([]);
      setItems(null); // `null` renders the skeletons until the fetch resolves
    }
    onOpenChange(next);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("files", file));

    try {
      const res = await fetch("/api/media", { method: "POST", body });
      const data = (await res.json()) as { items?: MediaItem[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setItems((current) => [...(data.items ?? []), ...(current ?? [])]);
      setSelected((current) => (multiple ? [...current, ...(data.items ?? []).map((i) => i.url)] : [(data.items ?? [])[0]?.url].filter(Boolean) as string[]));
      toast.success(`${data.items?.length ?? 0} image${data.items?.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (item: MediaItem) => {
    const res = await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    if (res.ok) {
      setItems((current) => (current ?? []).filter((i) => i.id !== item.id));
      setSelected((current) => current.filter((url) => url !== item.url));
    } else {
      toast.error("Could not delete that image");
    }
  };

  const toggle = (url: string) => {
    setSelected((current) => {
      if (current.includes(url)) return current.filter((u) => u !== url);
      return multiple ? [...current, url] : [url];
    });
  };

  const filtered = (items ?? []).filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="xl" className="max-h-[86vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Upload new images or reuse ones you have already added.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search images"
              className="pl-9"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} loading={uploading}>
            <Upload className="size-4" />
            Upload images
          </Button>
        </div>

        <div
          className="min-h-[280px] rounded-xl border border-border bg-muted/30 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void upload(e.dataTransfer.files);
          }}
        >
          {items === null ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              icon={ImagePlus}
              title={query ? "No images match that search" : "Your media library is empty"}
              description={
                query ? "Try a different search term." : "Upload images once and reuse them anywhere on your website."
              }
              action={
                !query && (
                  <Button size="sm" onClick={() => inputRef.current?.click()}>
                    <Upload className="size-3.5" />
                    Upload images
                  </Button>
                )
              }
              className="border-0 bg-transparent"
            />
          ) : (
            <div className="grid max-h-[46vh] grid-cols-3 gap-3 overflow-y-auto scrollbar-thin sm:grid-cols-4 lg:grid-cols-6">
              {filtered.map((item) => {
                const isSelected = selected.includes(item.url);
                return (
                  <div key={item.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => toggle(item.url)}
                      className={cn(
                        "block aspect-square w-full overflow-hidden rounded-lg border-2 bg-card transition-all",
                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border",
                      )}
                      aria-pressed={isSelected}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.alt || item.name} className="size-full object-cover" loading="lazy" />
                    </button>
                    {isSelected && (
                      <span className="pointer-events-none absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected.length}
            onClick={() => {
              onSelect(selected);
              onOpenChange(false);
            }}
          >
            {selected.length > 1 ? `Use ${selected.length} images` : "Use image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A single image field with preview, used by product and section forms. */
export function ImageField({
  value,
  onChange,
  label = "Image",
  className,
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/40"
          aria-label={value ? `Change ${label}` : `Choose ${label}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-4 text-muted-foreground" />
          )}
        </button>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose"}
          </Button>
          {value && (
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange("")} aria-label="Remove image">
              <X />
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} onSelect={(urls) => urls[0] && onChange(urls[0])} />
    </div>
  );
}

export function UploadingIndicator() {
  return (
    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      Uploading…
    </span>
  );
}

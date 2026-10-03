"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, uid } from "@/lib/utils";
import { saveNavigationAction } from "../actions";

type NavRow = { id: string; label: string; href: string };

export function NavigationEditor({
  initialItems,
  pages,
}: {
  initialItems: NavRow[];
  pages: { title: string; href: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<NavRow[]>(initialItems);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [pending, startTransition] = React.useTransition();

  const dirty = JSON.stringify(items) !== JSON.stringify(initialItems);

  const save = () =>
    startTransition(async () => {
      const result = await saveNavigationAction(items);
      if (!result.ok) {
        toast.error(result.error ?? "Could not save your menu");
        return;
      }
      toast.success("Menu saved", { description: "Publish your website to make it live." });
      router.refresh();
    });

  const update = (index: number, patch: Partial<NavRow>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card data-tour="website-navigation-items">
        <CardHeader className="flex-row items-center">
          <CardTitle>Menu items</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            data-tour="website-navigation-add"
            onClick={() => setItems([...items, { id: uid("nav"), label: "New link", href: "/" }])}
          >
            <Plus className="size-3.5" />
            Add link
          </Button>
        </CardHeader>

        <CardContent className="space-y-2 pt-0">
          {items.length === 0 ? (
            <EmptyState
              compact
              title="Your menu is empty"
              description="Add links so visitors can find their way around your website."
              action={
                <Button size="sm" onClick={() => setItems([{ id: uid("nav"), label: "Shop", href: "/shop" }])}>
                  Add the first link
                </Button>
              }
            />
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex === null || dragIndex === index) return;
                  const next = [...items];
                  const [moved] = next.splice(dragIndex, 1);
                  next.splice(index, 0, moved);
                  setItems(next);
                  setDragIndex(null);
                }}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5 transition-opacity",
                  dragIndex === index && "opacity-50",
                )}
              >
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                <Input
                  value={item.label}
                  onChange={(e) => update(index, { label: e.target.value })}
                  placeholder="Link text"
                  className="h-8 w-full min-w-0 flex-1 text-[13px] sm:w-auto"
                  aria-label="Menu label"
                />
                <Input
                  value={item.href}
                  onChange={(e) => update(index, { href: e.target.value })}
                  placeholder="/shop"
                  className="h-8 w-full min-w-0 flex-1 font-mono text-[12.5px] sm:w-auto"
                  aria-label="Menu link"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  aria-label={`Remove ${item.label}`}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>

        {items.length > 0 && (
          <div className="flex items-center gap-3 border-t border-border px-5 py-3.5">
            <p className="flex-1 text-[12.5px] text-muted-foreground">
              {dirty ? "You have unsaved changes." : "Everything is saved."}
            </p>
            <Button onClick={save} loading={pending} disabled={!dirty} data-tour="website-navigation-save">
              Save menu
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Card data-tour="website-navigation-quick">
          <CardHeader>
            <CardTitle>Quick add</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">Add a link to one of your pages.</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {pages.map((page) => (
              <Button
                key={page.href}
                size="sm"
                variant="outline"
                disabled={items.some((item) => item.href === page.href)}
                onClick={() => setItems([...items, { id: uid("nav"), label: page.title, href: page.href }])}
              >
                <Plus className="size-3" />
                {page.title}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card data-tour="website-navigation-preview">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-[13px] font-bold tracking-tight">Your shop</span>
                {items.map((item) => (
                  <span key={item.id} className="text-[12.5px] text-muted-foreground">
                    {item.label || "Untitled"}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Tips</Label>
              <ul className="space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
                <li>Use <span className="font-mono">/</span> for your home page.</li>
                <li>Use <span className="font-mono">/shop</span> to link to your product list.</li>
                <li>Full addresses like <span className="font-mono">https://…</span> open external sites.</li>
                <li>Four or five links is usually plenty.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

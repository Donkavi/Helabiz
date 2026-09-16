"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCategoryAction, deleteCategoryAction } from "./actions";

export function CategoryManager({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const add = () => {
    if (!name.trim()) return;
    const data = new FormData();
    data.set("name", name.trim());
    startTransition(async () => {
      const result = await createCategoryAction(null, data);
      if (result?.ok === false) {
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Could not add category");
        return;
      }
      setName("");
      toast.success("Category added");
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteCategoryAction(id);
      toast.success("Category removed");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderTree className="size-4" />
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Product categories</DialogTitle>
          <DialogDescription>
            Categories group your products and let customers browse your website by type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="category-name">New category</Label>
          <div className="flex gap-2">
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="Dresses"
            />
            <Button onClick={add} loading={pending} disabled={!name.trim()}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>

        {categories.length > 0 && (
          <ul className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{category.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">/{category.slug}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(category.id)}
                  disabled={pending}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

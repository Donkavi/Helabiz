"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteBusinessAction, updateBusinessAction } from "../../actions";

type Values = {
  name: string;
  slug: string;
  type: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
};

/**
 * Edit and delete for one business.
 *
 * Delete asks you to type the business name. The server checks it again, so the
 * dialog is a speed bump rather than the safeguard — the safeguard is that the
 * action refuses a mismatch.
 */
export function BusinessEditor({
  businessId,
  counts,
  initial,
}: {
  businessId: string;
  counts: { orders: number; products: number; customers: number };
  initial: Values;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [values, setValues] = React.useState(initial);
  const [confirmation, setConfirmation] = React.useState("");

  const field = (key: keyof Values) => ({
    id: key,
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
  });

  const openEdit = (open: boolean) => {
    if (pending) return;
    // Reset from props on open rather than in an effect, so a cancelled edit
    // does not linger the next time the dialog is used.
    if (open) setValues(initial);
    setEditOpen(open);
  };

  const save = () => {
    startTransition(async () => {
      const result = await updateBusinessAction(businessId, values);
      if (result.ok) {
        toast.success(result.message);
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deleteBusinessAction(businessId, confirmation);
      if (result.ok) {
        toast.success(result.message);
        router.push("/admin/businesses");
      } else {
        toast.error(result.error);
      }
    });
  };

  const totalRecords = counts.orders + counts.products + counts.customers;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => openEdit(true)}>
        <Pencil className="size-3.5" />
        Edit details
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="size-3.5" />
        Delete
      </Button>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={openEdit}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Edit {initial.name}</DialogTitle>
            <DialogDescription>
              These are the business&apos;s own details, the same ones its owner edits in settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input {...field("name")} className="mt-1.5" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="slug">Web address</Label>
              <Input {...field("slug")} className="mt-1.5 font-mono" />
              {values.slug !== initial.slug && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-warning">
                  <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                  Their published site moves to /{values.slug}. Any link to the old address stops working.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Input {...field("type")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input {...field("phone")} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input {...field("email")} type="email" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input {...field("city")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="district">District</Label>
              <Input {...field("district")} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input {...field("address")} className="mt-1.5" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (pending) return;
          if (open) setConfirmation("");
          setDeleteOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {initial.name}?</DialogTitle>
            <DialogDescription>
              This removes the business and everything in it. It cannot be undone — if you only want to stop them
              trading, suspend instead.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-[13px]">
            <li>{counts.orders} orders, with their items and payments</li>
            <li>{counts.products} products, categories and stock history</li>
            <li>{counts.customers} customers</li>
            <li>Their website, its pages and everything published</li>
          </ul>
          <p className="text-[12.5px] text-muted-foreground">
            {totalRecords} records in all. The audit entry for this deletion is kept.
          </p>

          <div>
            <Label htmlFor="confirm">
              Type <span className="font-semibold">{initial.name}</span> to confirm
            </Label>
            <Input
              id="confirm"
              className="mt-1.5"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending || confirmation.trim() !== initial.name}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

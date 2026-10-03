"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";
import { saveCustomerAction } from "./actions";

export type CustomerValues = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  notes: string;
  type: string;
};

const EMPTY: CustomerValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  district: "",
  notes: "",
  type: "new",
};

export function CustomerDialog({
  customer,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  customer?: CustomerValues;
  trigger?: React.ReactNode;
  /** Controlled mode: used by the table's row-level "Edit" action. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [values, setValues] = React.useState<CustomerValues>(customer ?? EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  // Reset when opening rather than in an effect. In controlled mode the parent
  // mounts this with a fresh `key`, so the initial state is already correct.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setValues(customer ?? EMPTY);
      setErrors({});
    }
    setOpen(next);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    if (values.id) data.set("id", values.id);
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "id") data.set(key, String(value ?? ""));
    });

    startTransition(async () => {
      const result = await saveCustomerAction(null, data);
      if (result?.ok === false) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Could not save the customer");
        return;
      }
      toast.success(values.id ? "Customer updated" : "Customer added");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button data-tour="customers-add">
              <Plus className="size-4" />
              Add customer
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{values.id ? "Edit customer" : "Add customer"}</DialogTitle>
            <DialogDescription>
              Phone number identifies a customer, so repeat orders link up automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name} required>
                <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
              </Field>
              <Field label="Phone" error={errors.phone} required>
                <Input
                  value={values.phone}
                  onChange={(e) => setValues({ ...values, phone: e.target.value })}
                  placeholder="077 123 4567"
                  required
                />
              </Field>
            </div>

            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </Field>

            <Field label="Address">
              <Textarea
                rows={2}
                value={values.address}
                onChange={(e) => setValues({ ...values, address: e.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <Input value={values.city} onChange={(e) => setValues({ ...values, city: e.target.value })} />
              </Field>
              <Field label="District">
                <Select value={values.district} onValueChange={(v) => setValues({ ...values, district: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Customer type">
              <Select value={values.type} onValueChange={(v) => setValues({ ...values, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Notes">
              <Textarea
                rows={2}
                value={values.notes}
                onChange={(e) => setValues({ ...values, notes: e.target.value })}
                placeholder="Prefers delivery after 5pm"
              />
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {values.id ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div id={id}>{children}</div>
      {error && <p className="text-[12.5px] text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageField } from "@/components/dashboard/media-picker";
import { SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";
import type { ActionState } from "@/lib/validations/errors";
import { saveBusinessSettingsAction } from "./actions";

type Initial = Record<
  | "name" | "description" | "logo" | "phone" | "whatsapp" | "email" | "address" | "city" | "district"
  | "deliveryFee" | "freeDeliveryOver" | "facebook" | "instagram" | "tiktok" | "youtube",
  string
>;

export function BusinessSettingsForm({ initial, readOnly }: { initial: Initial; readOnly: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveBusinessSettingsAction, null);
  const [values, setValues] = React.useState(initial);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Business settings saved");
      router.refresh();
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const set = (key: keyof Initial, value: string) => setValues({ ...values, [key]: value });

  return (
    <form action={action} className="space-y-5">
      {readOnly && (
        <p className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-[13px] text-muted-foreground">
          You have staff access, so these settings are read-only.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Field label="Business name" error={errors.name} required>
            <Input name="name" value={values.name} onChange={(e) => set("name", e.target.value)} required disabled={readOnly} />
          </Field>

          <Field label="Logo">
            <ImageField value={values.logo} onChange={(url) => set("logo", url)} label="Logo" />
            <input type="hidden" name="logo" value={values.logo} />
          </Field>

          <Field label="Short description" hint="Used on your website and in search results.">
            <Textarea
              name="description"
              rows={3}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={400}
              disabled={readOnly}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <p className="text-[12.5px] text-muted-foreground">Shown on your website, invoices and order messages.</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input name="phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} disabled={readOnly} />
            </Field>
            <Field label="WhatsApp" hint="Used for the WhatsApp order buttons.">
              <Input
                name="whatsapp"
                value={values.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                disabled={readOnly}
              />
            </Field>
          </div>

          <Field label="Email" error={errors.email}>
            <Input
              name="email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={readOnly}
            />
          </Field>

          <Field label="Address">
            <Textarea
              name="address"
              rows={2}
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              disabled={readOnly}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <Input name="city" value={values.city} onChange={(e) => set("city", e.target.value)} disabled={readOnly} />
            </Field>
            <Field label="District">
              <input type="hidden" name="district" value={values.district} />
              <Select value={values.district} onValueChange={(v) => set("district", v)} disabled={readOnly}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {SRI_LANKA_DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
          <Field label="Delivery fee (Rs.)" hint="Added to every website order.">
            <Input
              name="deliveryFee"
              type="number"
              min={0}
              value={values.deliveryFee}
              onChange={(e) => set("deliveryFee", e.target.value)}
              disabled={readOnly}
            />
          </Field>
          <Field label="Free delivery over (Rs.)" hint="Set to 0 to always charge delivery.">
            <Input
              name="freeDeliveryOver"
              type="number"
              min={0}
              value={values.freeDeliveryOver}
              onChange={(e) => set("freeDeliveryOver", e.target.value)}
              disabled={readOnly}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
          <p className="text-[12.5px] text-muted-foreground">Shown in your website footer and social sections.</p>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
          {(["facebook", "instagram", "tiktok", "youtube"] as const).map((network) => (
            <Field key={network} label={network[0].toUpperCase() + network.slice(1)}>
              <Input
                name={network}
                value={values[network]}
                onChange={(e) => set(network, e.target.value)}
                placeholder={`https://${network}.com/yourshop`}
                disabled={readOnly}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
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
      {error ? (
        <p className="text-[12.5px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

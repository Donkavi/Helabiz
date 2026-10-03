"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/misc";
import { ImageField } from "@/components/dashboard/media-picker";
import { SITE_DOMAIN } from "@/lib/website/urls";
import { slugify } from "@/lib/utils";
import { saveWebsiteSettingsAction, saveBusinessBrandingAction } from "../actions";
import type { ActionState } from "@/lib/validations/errors";

type Initial = {
  name: string;
  subdomain: string;
  seoTitle: string;
  seoDescription: string;
  showCart: boolean;
  allowCheckout: boolean;
  whatsappOrdering: boolean;
  customerAccounts: boolean;
  announcementEnabled: boolean;
  announcement: string;
  logo: string;
};

export function WebsiteSettingsForm({ initial, businessName }: { initial: Initial; businessName: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveWebsiteSettingsAction, null);
  const [values, setValues] = React.useState(initial);
  const [logoPending, startLogo] = React.useTransition();

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Settings saved", { description: "Publish your website to make the changes live." });
      router.refresh();
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Card data-tour="website-settings-address">
          <CardHeader>
            <CardTitle>Web address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="name">Website name</Label>
              <Input
                id="name"
                name="name"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subdomain">Address</Label>
              <div className="flex items-center gap-0">
                <Input
                  id="subdomain"
                  name="subdomain"
                  value={values.subdomain}
                  onChange={(e) => setValues({ ...values, subdomain: slugify(e.target.value) })}
                  className="rounded-r-none font-mono"
                  aria-invalid={!!errors.subdomain}
                  required
                />
                <span className="flex h-9.5 shrink-0 items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 font-mono text-[13px] text-muted-foreground">
                  .{SITE_DOMAIN}
                </span>
              </div>
              {errors.subdomain ? (
                <p className="text-[12.5px] text-destructive">{errors.subdomain}</p>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">
                  Changing this breaks any links you have already shared.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-tour="website-settings-seo">
          <CardHeader>
            <CardTitle>Search engine listing</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">How your website appears in Google results.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">Title</Label>
              <Input
                id="seoTitle"
                name="seoTitle"
                value={values.seoTitle}
                onChange={(e) => setValues({ ...values, seoTitle: e.target.value })}
                maxLength={70}
                placeholder={businessName}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoDescription">Description</Label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                rows={3}
                value={values.seoDescription}
                onChange={(e) => setValues({ ...values, seoDescription: e.target.value })}
                maxLength={180}
                placeholder="What you sell and where you deliver — one or two sentences."
              />
              <p className="text-[12.5px] text-muted-foreground">{values.seoDescription.length}/180</p>
            </div>

            {/* A live approximation of a search result */}
            <div className="rounded-lg border border-border bg-muted/40 p-3.5">
              <p className="truncate font-mono text-[12px] text-muted-foreground">
                {values.subdomain}.{SITE_DOMAIN}
              </p>
              <p className="mt-1 truncate text-[15px] font-medium text-info">{values.seoTitle || businessName}</p>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
                {values.seoDescription || "Add a description so people know what you sell before they click."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-tour="website-settings-shop">
          <CardHeader>
            <CardTitle>Shop behaviour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <ToggleRow
              name="showCart"
              label="Show the cart"
              hint="Turn off to use your website as a catalogue only."
              checked={values.showCart}
              onChange={(v) => setValues({ ...values, showCart: v })}
            />
            <ToggleRow
              name="allowCheckout"
              label="Allow checkout"
              hint="Customers can place orders that arrive in your Orders list."
              checked={values.allowCheckout}
              onChange={(v) => setValues({ ...values, allowCheckout: v })}
            />
            <ToggleRow
              name="whatsappOrdering"
              label="WhatsApp ordering"
              hint="Adds a WhatsApp button so customers can message you directly."
              checked={values.whatsappOrdering}
              onChange={(v) => setValues({ ...values, whatsappOrdering: v })}
            />
            <ToggleRow
              name="customerAccounts"
              label="Customer accounts"
              tour="website-settings-accounts"
              hint="Customers can register with their phone and email, then sign in to see their orders and track them."
              checked={values.customerAccounts}
              onChange={(v) => setValues({ ...values, customerAccounts: v })}
            />
          </CardContent>
        </Card>

        <Card data-tour="website-settings-announcement">
          <CardHeader>
            <CardTitle>Announcement bar</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">A thin strip above your header, on every page.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <ToggleRow
              name="announcementEnabled"
              label="Show the announcement bar"
              checked={values.announcementEnabled}
              onChange={(v) => setValues({ ...values, announcementEnabled: v })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="announcement">Message</Label>
              <Input
                id="announcement"
                name="announcement"
                value={values.announcement}
                onChange={(e) => setValues({ ...values, announcement: e.target.value })}
                maxLength={160}
                placeholder="Free delivery on orders over Rs. 10,000"
                disabled={!values.announcementEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="lg:sticky lg:top-20" data-tour="website-settings-logo">
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">
              Shown in your website header and on invoices. A transparent PNG works best.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <ImageField
              value={values.logo}
              label="Logo"
              onChange={(url) => {
                setValues({ ...values, logo: url });
                startLogo(async () => {
                  await saveBusinessBrandingAction(url);
                  toast.success(url ? "Logo updated" : "Logo removed");
                  router.refresh();
                });
              }}
            />
            {logoPending && <p className="text-[12.5px] text-muted-foreground">Saving…</p>}

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Header preview
              </p>
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2.5">
                {values.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={values.logo} alt="" className="h-6 w-auto object-contain" />
                ) : (
                  <span className="text-[13px] font-bold tracking-tight">{businessName}</span>
                )}
                <Globe className="size-3.5 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" className="w-full" loading={pending}>
              Save settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function ToggleRow({
  name,
  label,
  hint,
  tour,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  /** Lets the guided tour point at this row. */
  tour?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0" data-tour={tour}>
      {/* Switch is not a native input, so the value is mirrored for the form post. */}
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <div>
        <p className="text-[13.5px] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

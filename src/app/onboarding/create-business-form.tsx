"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_TYPES, SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";
import { slugify } from "@/lib/utils";
import { createBusinessAction, type OnboardingState } from "./actions";

export function CreateBusinessForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createBusinessAction, null);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("clothing");
  const [district, setDistrict] = React.useState("");

  const slug = slugify(name) || "your-business";

  return (
    <form action={action} className="mt-9 space-y-5">
      {state?.error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-[13px] text-destructive">
          <AlertCircle className="mt-px size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Business name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Kavi Fashion"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!state?.fieldErrors?.name}
        />
        {state?.fieldErrors?.name ? (
          <p className="text-[12.5px] text-destructive">{state.fieldErrors.name}</p>
        ) : (
          <p className="text-[12.5px] text-muted-foreground">
            Your website address will be <span className="font-medium text-foreground">{slug}.helabiz.lk</span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">What do you sell?</Label>
        <input type="hidden" name="type" value={type} />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Colombo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district">District</Label>
          <input type="hidden" name="district" value={district} />
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger id="district">
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="077 123 4567" aria-invalid={!!state?.fieldErrors?.phone} />
          {state?.fieldErrors?.phone && <p className="text-[12.5px] text-destructive">{state.fieldErrors.phone}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" type="tel" placeholder="Same as phone" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Modern casual clothing for women, made in Colombo."
          maxLength={400}
        />
        <p className="text-[12.5px] text-muted-foreground">Used on your website and in search results.</p>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Creating…" : "Create business"}
        {!pending && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

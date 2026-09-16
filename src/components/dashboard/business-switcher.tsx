"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2, Plus, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";

export type BusinessOption = { id: string; name: string; slug: string; plan: string; role: string; logo?: string };

export function BusinessSwitcher({ businesses, activeId }: { businesses: BusinessOption[]; activeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const active = businesses.find((b) => b.id === activeId) ?? businesses[0];

  const switchTo = (id: string) => {
    if (id === activeId) return;
    startTransition(async () => {
      await fetch("/api/businesses/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id }),
      });
      router.push("/dashboard");
      router.refresh();
    });
  };

  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left transition-colors outline-none",
          "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label="Switch business"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
          {initials(active.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-tight">{active.name}</span>
          <span className="block truncate text-[11.5px] capitalize text-muted-foreground">{active.plan} plan</span>
        </span>
        {pending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
        {businesses.map((business) => (
          <DropdownMenuItem key={business.id} onSelect={() => switchTo(business.id)} className="gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-foreground">
              {initials(business.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{business.name}</span>
              <span className="block truncate text-[11px] capitalize text-muted-foreground">{business.role}</span>
            </span>
            {business.id === activeId && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/onboarding?another=1")}>
          <Plus />
          Add another business
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Store />
          Business settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

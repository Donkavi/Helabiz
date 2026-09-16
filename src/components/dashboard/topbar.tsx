"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, Monitor, Moon, Plus, Search, Settings, Sun, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { useTheme } from "@/components/providers";
import { SidebarContent } from "./sidebar";
import type { BusinessOption } from "./business-switcher";
import { NAV_GROUPS, isActive } from "./nav-config";
import { initials } from "@/lib/utils";

export function Topbar({
  user,
  businesses,
  activeId,
  plan,
  usage,
  siteUrl,
  notifications,
}: {
  user: { name: string; email: string; image?: string };
  businesses: BusinessOption[];
  activeId: string;
  plan: string;
  usage?: { label: string; used: number; limit: number };
  siteUrl?: string | null;
  notifications: { id: string; title: string; body?: string; href?: string; createdAt: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const current = NAV_GROUPS.flatMap((g) => g.items).find((item) => isActive(pathname, item));

  return (
    <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" hideClose>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            businesses={businesses}
            activeId={activeId}
            plan={plan}
            usage={usage}
            siteUrl={siteUrl}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <h1 className="truncate text-[15px] font-semibold lg:hidden">{current?.label ?? "Helabiz"}</h1>

      <button
        type="button"
        onClick={() => router.push("/products")}
        className="hidden h-9 w-72 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent lg:flex"
      >
        <Search className="size-3.5" />
        Search products, orders, customers…
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/orders/new">
            <Plus className="size-3.5" />
            New order
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            {notifications.length === 0 ? (
              <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">You are all caught up.</p>
            ) : (
              notifications.map((note) => (
                <DropdownMenuItem
                  key={note.id}
                  className="flex-col items-start gap-0.5 py-2.5"
                  onSelect={() => note.href && router.push(note.href)}
                >
                  <span className="text-[13px] font-medium">{note.title}</span>
                  {note.body && <span className="text-[12px] text-muted-foreground">{note.body}</span>}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Change theme">
              {theme === "dark" ? <Moon /> : theme === "light" ? <Sun /> : <Monitor />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("system")}>
              <Monitor /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold">{user.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/settings/account")}>
              <UserIcon /> Account
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              <Settings /> Business settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => signOut({ callbackUrl: "/" })}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

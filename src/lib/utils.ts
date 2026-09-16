import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sri Lankan rupee formatting used everywhere money is shown. */
export function formatCurrency(amount: number, opts: { compact?: boolean; decimals?: boolean } = {}) {
  const value = Number.isFinite(amount) ? amount : 0;
  if (opts.compact && Math.abs(value) >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (opts.compact && Math.abs(value) >= 10_000) return `Rs. ${(value / 1_000).toFixed(1)}K`;
  return `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: opts.decimals === false ? 0 : 2,
    maximumFractionDigits: opts.decimals === false ? 0 : 2,
  })}`;
}

export function formatNumber(value: number) {
  return (Number.isFinite(value) ? value : 0).toLocaleString("en-LK");
}

export function formatDate(date: Date | string | number, style: "short" | "long" | "time" = "short") {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  if (style === "long") return d.toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" });
  if (style === "time") return d.toLocaleString("en-LK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(date: Date | string | number) {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Percentage change guarded against divide-by-zero. */
export function percentChange(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function truncate(value: string, length = 60) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stable id generator usable on both server and client. */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

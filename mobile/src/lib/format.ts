/** Formatting shared by every screen. Money is Sri Lankan Rupees, as on the web. */

export function formatCurrency(amount: number, opts: { compact?: boolean } = {}) {
  const value = Number.isFinite(amount) ? amount : 0;
  if (opts.compact && Math.abs(value) >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (opts.compact && Math.abs(value) >= 10_000) return `Rs. ${(value / 1_000).toFixed(1)}K`;
  return `Rs. ${Math.round(value).toLocaleString("en-LK")}`;
}

export function formatNumber(value: number) {
  return (Number.isFinite(value) ? value : 0).toLocaleString("en-LK");
}

export function percentChange(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  if (!withTime) return day;
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}, ${hours}:${minutes} ${date.getHours() < 12 ? "am" : "pm"}`;
}

/** "just now", "5m", "3h", "2d", then a date. */
export function relativeTime(value: string | null | undefined) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function messageTime(value: string) {
  const date = new Date(value);
  const hours = date.getHours() % 12 || 12;
  const time = `${hours}:${String(date.getMinutes()).padStart(2, "0")} ${date.getHours() < 12 ? "am" : "pm"}`;
  const today = new Date();
  return date.toDateString() === today.toDateString() ? time : `${date.getDate()} ${MONTHS[date.getMonth()]}, ${time}`;
}

/** A Sri Lankan number in the international form WhatsApp links need (07x… → 947x…). */
export function whatsappNumber(phone: string) {
  // Same rules as `normalizePhone` in the web app's lib/whatsapp.ts.
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  if (digits.length === 9) return `94${digits}`;
  return digits;
}

/** The web dictionary's English labels (`t.enums`). */
export const PAYMENT_METHODS: Record<string, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
  online: "Online payment",
  cash: "Cash",
  card: "Card",
};

export const ORDER_SOURCES: Record<string, string> = {
  website: "Website",
  manual: "Manual",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  walk_in: "Walk-in",
};

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

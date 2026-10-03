import type { Lang } from "@/lib/i18n";

/**
 * Shared vocabulary for "Build my website for me" requests, used by the
 * business's form, the admin screens and the server validation alike.
 * Imports nothing server-side, so client components can use it.
 */
export const REQUEST_PAGES = ["home", "shop", "about", "contact", "gallery", "reviews", "faq"] as const;
export type RequestPage = (typeof REQUEST_PAGES)[number];

export const REQUEST_PAGE_LABELS: Record<RequestPage, Record<Lang, string>> = {
  home: { en: "Home", si: "මුල් පිටුව" },
  shop: { en: "Shop / products", si: "Shop / භාණ්ඩ" },
  about: { en: "About us", si: "අපි ගැන" },
  contact: { en: "Contact", si: "සම්බන්ධ වෙන්න" },
  gallery: { en: "Gallery", si: "Gallery" },
  reviews: { en: "Customer reviews", si: "ගනුදෙනුකරුවන්ගේ අදහස්" },
  faq: { en: "Questions (FAQ)", si: "ප්‍රශ්න (FAQ)" },
};

export function isRequestPage(value: unknown): value is RequestPage {
  return typeof value === "string" && (REQUEST_PAGES as readonly string[]).includes(value);
}

export type RequestStatus = "new" | "contacted" | "building" | "done" | "cancelled";

/** How each status reads to the business that asked. */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, Record<Lang, string>> = {
  new: { en: "Received — we will call you soon", si: "ලැබුණා — අපි ඉක්මනින් call කරනවා" },
  contacted: { en: "We have been in touch", si: "අපි ඔබව සම්බන්ධ කරගත්තා" },
  building: { en: "We are building your website", si: "අපි ඔබේ website එක හදනවා" },
  done: { en: "Your website is ready", si: "ඔබේ website එක ලෑස්තියි" },
  cancelled: { en: "Closed", si: "වසා දැමුවා" },
};

/** How each status reads to the Helabiz team. */
export const REQUEST_STATUS_ADMIN_LABELS: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  building: "Building",
  done: "Done",
  cancelled: "Cancelled",
};

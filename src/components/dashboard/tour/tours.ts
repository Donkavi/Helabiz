import type { Lang } from "@/lib/i18n";
import { steps as dashboard } from "./steps/dashboard";
import { steps as orders } from "./steps/orders";
import { steps as products } from "./steps/products";
import { steps as inventory } from "./steps/inventory";
import { steps as customers } from "./steps/customers";
import { steps as messages } from "./steps/messages";
import { steps as expenses } from "./steps/expenses";
import { steps as invoices } from "./steps/invoices";
import { steps as reports } from "./steps/reports";
import { steps as website } from "./steps/website";
import { steps as websitePages } from "./steps/website-pages";
import { steps as websiteThemes } from "./steps/website-themes";
import { steps as websiteNavigation } from "./steps/website-navigation";
import { steps as websiteAnalytics } from "./steps/website-analytics";
import { steps as websiteDomains } from "./steps/website-domains";
import { steps as websiteSettings } from "./steps/website-settings";
import { steps as builder } from "./steps/builder";

/**
 * The guided tours, one per screen, in both languages.
 *
 * Each screen's steps live in `steps/<id>.ts`. A step points at an element by
 * its `data-tour` attribute; one whose element is not on screen — the sidebar
 * on a phone, the setup checklist once the shop is running, an empty list —
 * is skipped rather than shown pointing at nothing, so a tour reads correctly
 * on every screen size and at every stage.
 *
 * Steps with no `target` sit in the middle of the screen: the welcome and the
 * goodbye. The Sinhala keeps the product words people already say in English
 * (order, website, publish, theme), the same rule as the dashboard dictionary.
 */
export type TourText = { title: string; body: string };

export type TourStep = {
  /** The `data-tour` value to point at. None for a centred step. */
  target?: string;
  text: Record<Lang, TourText>;
};

export const TOURS = {
  dashboard,
  orders,
  products,
  inventory,
  customers,
  messages,
  expenses,
  invoices,
  reports,
  website,
  "website-pages": websitePages,
  "website-themes": websiteThemes,
  "website-navigation": websiteNavigation,
  "website-analytics": websiteAnalytics,
  "website-domains": websiteDomains,
  "website-settings": websiteSettings,
  builder,
} satisfies Record<string, TourStep[]>;

export type TourId = keyof typeof TOURS;

export function isTourId(value: unknown): value is TourId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(TOURS, value);
}

/** The words on the tour's own buttons. */
export const TOUR_UI: Record<
  Lang,
  { next: string; back: string; skip: string; done: string; start: string; progress: string; chooseLanguage: string; help: string; needHelp: string }
> = {
  en: {
    next: "Next",
    back: "Back",
    skip: "Skip tour",
    done: "Got it",
    start: "Show me around",
    progress: "{step} of {total}",
    chooseLanguage: "Tour language",
    help: "Take a tour of this page",
    needHelp: "Need help?",
  },
  si: {
    next: "ඊළඟ",
    back: "ආපසු",
    skip: "Tour එක මඟහරින්න",
    done: "හරි, තේරුණා",
    start: "පෙන්නන්න",
    progress: "{total}න් {step}",
    chooseLanguage: "Tour එකේ භාෂාව",
    help: "මේ පිටුවේ tour එක බලන්න",
    needHelp: "උදව් ඕනද?",
  },
};

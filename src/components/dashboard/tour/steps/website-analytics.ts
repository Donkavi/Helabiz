import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Who visits your website",
        body: "See what visitors do on your website over the last 30 days, and find out what to improve to sell more.",
      },
      si: {
        title: "ඔබේ website එකට කවුද එන්නේ",
        body: "පහුගිය දවස් 30 තුළ visitors ලා website එකේ මොනවද කළේ කියලා බලන්න. වැඩිපුර විකුණන්න මොනවද හදන්න ඕන කියලත් තේරුම් ගන්න පුළුවන්.",
      },
    },
  },
  {
    target: "website-analytics-empty",
    text: {
      en: {
        title: "Numbers appear here",
        body: "Nothing yet. Publish your website and share its link on Facebook, Instagram and WhatsApp — visits and orders show up here by themselves.",
      },
      si: {
        title: "ගණන් මෙතන පේනවා",
        body: "තාම කිසිම දෙයක් නෑ. Website එක publish කරලා link එක Facebook, Instagram, WhatsApp වල share කරන්න — visits සහ order ඉබේම මෙතන පේනවා.",
      },
    },
  },
  {
    target: "website-analytics-stats",
    text: {
      en: {
        title: "The main numbers",
        body: "Visitors, page views, product views, add-to-carts, orders and revenue from your website. Tap Website orders to see those orders.",
      },
      si: {
        title: "ප්‍රධාන ගණන්",
        body: "Website එකේ visitors, page views, product views, cart එකට දාපු ගණන, order සහ ආදායම. ඒ order බලන්න Website orders tap කරන්න.",
      },
    },
  },
  {
    target: "website-analytics-funnel",
    text: {
      en: {
        title: "From visit to order",
        body: "See where people stop on the way to ordering. The biggest drop is usually the best thing to fix first.",
      },
      si: {
        title: "ආපු කෙනා order කරනකම්",
        body: "Order කරන්න කලින් අය නතර වෙන්නේ කොතනද කියලා බලන්න. වැඩිම අඩුවීම තියෙන තැන තමයි මුලින්ම හදන්න ඕන.",
      },
    },
  },
  {
    target: "website-analytics-pages",
    text: {
      en: {
        title: "Top pages and devices",
        body: "Which pages people open most, and whether they visit on a phone or a computer.",
      },
      si: {
        title: "ජනප්‍රිය පිටු සහ device",
        body: "වැඩියෙන්ම බලන පිටු මොනවද, එන අය phone එකෙන්ද computer එකෙන්ද එන්නේ කියලා මෙතන පේනවා.",
      },
    },
  },
  {
    target: "website-analytics-products",
    text: {
      en: {
        title: "Products people look at",
        body: "Lots of views but few carts? That product usually needs better photos or a clearer price.",
      },
      si: {
        title: "අය බලන භාණ්ඩ",
        body: "ගොඩක් අය බලනවා, ඒත් cart එකට දාන්නේ ටික දෙනයිද? එහෙනම් ඒ භාණ්ඩයට හොඳ photos හරි පැහැදිලි මිලක් හරි ඕන වෙන්න පුළුවන්.",
      },
    },
  },
];

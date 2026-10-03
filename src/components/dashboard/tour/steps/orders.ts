import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "All your orders in one place",
        body: "Website, WhatsApp, Facebook and walk-in orders all land in this one list. Let me show you how to keep on top of them.",
      },
      si: {
        title: "ඔක්කොම order එක තැනක",
        body: "Website, WhatsApp, Facebook සහ කඩේට ආපු order ඔක්කොම එන්නේ මේ එක list එකට. ඒවා හරියට manage කරන හැටි පෙන්නන්නම්.",
      },
    },
  },
  {
    target: "orders-new",
    text: {
      en: {
        title: "Record an order",
        body: "Got an order on WhatsApp, Facebook or over the phone? Tap New order to add it. Stock and the customer's details update by themselves.",
      },
      si: {
        title: "Order එකක් දාන්න",
        body: "WhatsApp, Facebook හෝ phone එකෙන් order එකක් ආවද? New order ඔබලා දාන්න. තොගයයි ගනුදෙනුකරුවගේ විස්තරයි ඉබේම update වෙනවා.",
      },
    },
  },
  {
    target: "orders-website",
    text: {
      en: {
        title: "Let orders come to you",
        body: "Once your website is live, orders placed there arrive in this list on their own — no typing needed. Set it up from here.",
      },
      si: {
        title: "Order ඉබේම එන්න දෙන්න",
        body: "ඔබේ website එක live වුණාම එතනින් දාන order ඉබේම මේ list එකට එනවා — type කරන්න ඕන නෑ. මෙතනින් website එක හදන්න.",
      },
    },
  },
  {
    target: "orders-summary",
    text: {
      en: {
        title: "Your orders at a glance",
        body: "Sales this month, orders still awaiting action, and your total orders so far. Keep the awaiting number low so no customer is left waiting.",
      },
      si: {
        title: "Order එක බැල්මෙන්",
        body: "මේ මාසේ විකුණුම්, තාම action ගන්න තියෙන order, සහ මෙතෙක් ආපු මුළු order ගාණ. කිසිම customer කෙනෙක් බලන් ඉන්න නොවෙන්න awaiting ගාණ අඩුවෙන් තියාගන්න.",
      },
    },
  },
  {
    target: "orders-status",
    text: {
      en: {
        title: "Filter by status",
        body: "Tap Pending to see orders you still need to confirm, or Shipped to follow up on parcels on the way. All shows everything again.",
      },
      si: {
        title: "Status එකෙන් filter කරන්න",
        body: "තාම confirm කරන්න තියෙන order බලන්න Pending ඔබන්න, පාරේ යන parcel follow up කරන්න Shipped ඔබන්න. All ඔබුවොත් ආයෙත් ඔක්කොම පේනවා.",
      },
    },
  },
  {
    target: "orders-search",
    text: {
      en: {
        title: "Find any order fast",
        body: "Search by order number, customer name or phone number — handy when a customer calls asking about their parcel.",
      },
      si: {
        title: "ඕනම order එකක් ඉක්මනට හොයන්න",
        body: "Order number එක, customer ගේ නම හෝ phone number එකෙන් search කරන්න — customer කෙනෙක් parcel එක ගැන අහලා call කරනකොට ගොඩක් ලේසියි.",
      },
    },
  },
  {
    target: "orders-source",
    text: {
      en: {
        title: "Where orders came from",
        body: "Show only website, WhatsApp, Facebook, Instagram or walk-in orders, and see which channel brings you the most sales.",
      },
      si: {
        title: "Order ආවේ කොහෙන්ද",
        body: "Website, WhatsApp, Facebook, Instagram හෝ walk-in order විතරක් බලන්න. වැඩිපුරම විකුණුම් එන්නේ කොහෙන්ද කියලා මෙතනින් තේරුම් ගන්න පුළුවන්.",
      },
    },
  },
  {
    target: "orders-list",
    text: {
      en: {
        title: "Open an order",
        body: "Tap any order to see its items, move it from pending to delivered, mark it paid when the COD money comes in, and create an invoice.",
      },
      si: {
        title: "Order එකක් open කරන්න",
        body: "ඕනම order එකක් ඔබලා items බලන්න, pending ඉඳන් delivered වෙනකම් status එක මාරු කරන්න, COD සල්ලි ආවම paid කරන්න, invoice එකකුත් හදන්න.",
      },
    },
  },
];

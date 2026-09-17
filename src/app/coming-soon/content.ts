/**
 * The teaser copy, in both languages.
 *
 * Sinhala leads because the people this is for read Sinhala first, and the
 * English is a translation rather than the other way round. Product words that
 * Sri Lankan shop owners already use in English — order, stock, invoice,
 * WhatsApp, publish — are left in English inside the Sinhala, which is how
 * they are actually spoken.
 */
export type Lang = "si" | "en";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "si", label: "සිංහල" },
  { id: "en", label: "English" },
];

type Copy = {
  badge: string;
  headline: string;
  lede: string;
  mascotHint: string;
  whatsComing: string;
  whatsComingNote: string;
  features: { icon: FeatureIcon; title: string; body: string }[];
  priceTitle: string;
  priceBody: string;
  followTitle: string;
  followBody: string;
  facebook: string;
  instagram: string;
  madeIn: string;
};

export type FeatureIcon =
  | "builder"
  | "orders"
  | "stock"
  | "money"
  | "invoice"
  | "free";

export const COPY: Record<Lang, Copy> = {
  si: {
    badge: "ඉක්මනින්ම",
    headline: "ඔබේ ව්‍යාපාරයට\nඔබේම වෙබ් අඩවියක්",
    lede:
      "ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම හදපු platform එකක්. කේත ලියන්නේ නැතිව වෙබ් අඩවියක් හදාගන්න — ඒ එක්කම order, stock, ගනුදෙනුකරුවෝ සහ ලාභය එකම තැනකින් කළමනාකරණය කරන්න.",
    mascotHint: "මාව එබුවොත් මොකද වෙන්නේ කියලා බලන්න 👆",
    whatsComing: "එන්නේ මොනවද?",
    whatsComingNote: "මේ හැම දෙයක්ම එකම තැනකින්. එකම දේ දෙපාරක් ලියන්න ඕන නෑ.",
    features: [
      {
        icon: "builder",
        title: "Drag & drop වෙබ් අඩවි නිර්මාණකරු",
        body: "Template එකක් තෝරලා, section එකක් අදිනවා, අකුරු වෙනස් කරනවා, Publish කරනවා. Developer කෙනෙක් ඕන නෑ.",
      },
      {
        icon: "orders",
        title: "Order සහ ගනුදෙනුකරුවෝ",
        body: "Website, WhatsApp සහ walk-in order ඔක්කොම එකම ලැයිස්තුවක. ගනුදෙනුකරුගේ විස්තර සහ order ඉතිහාසය ඉබේම save වෙනවා.",
      },
      {
        icon: "stock",
        title: "තමන්ම update වෙන Stock",
        body: "Website එකෙන් order එකක් ආවම stock එක ඉබේම අඩු වෙනවා. අඩු වුනාම ඔබට දැනුම් දෙනවා.",
      },
      {
        icon: "money",
        title: "වියදම් සහ සැබෑ ලාභය",
        body: "කුලී, පඩි, delivery සහ ද්‍රව්‍ය සටහන් කරලා, ඇත්තටම ඉතුරු වෙන්නේ කීයද කියලා බලාගන්න.",
      },
      {
        icon: "invoice",
        title: "Invoice සහ WhatsApp",
        body: "Invoice එකක් හදලා එකපාරටම WhatsApp කරන්න. Order තහවුරු කිරීම් සහ delivery update එවන්න.",
      },
      {
        icon: "free",
        title: "නොමිලේ පටන් ගන්න",
        body: "Card එකක් ඕන නෑ. නොමිලේ yourshop.helabiz.lk ලිපිනයක්, සැබෑ වෙබ් අඩවියක් — trial එකක් නෙවෙයි.",
      },
    ],
    priceTitle: "මිල ගැන",
    priceBody:
      "නොමිලේ plan එකෙන්ම සැබෑ වෙබ් අඩවියක් publish කරන්න පුළුවන්. ව්‍යාපාරය ලොකු වෙනකොට විතරක් upgrade කරන්න — Rs. 999/මාසෙට පටන්.",
    followTitle: "මුලින්ම දැනගන්න",
    followBody: "Launch වුනාම දැනගන්න අපේ page එක follow කරන්න. පළමු මාසේ ලියාපදිංචි වෙන අයට විශේෂ දීමනාවක් 🎁",
    facebook: "Facebook එකේ follow කරන්න",
    instagram: "Instagram එකේ follow කරන්න",
    madeIn: "ශ්‍රී ලංකාවේ හදපු",
  },

  en: {
    badge: "Coming soon",
    headline: "Your business.\nYour own website.",
    lede:
      "A platform built for Sri Lankan small businesses. Make your own website without writing code — and run your orders, stock, customers and profit from the same place.",
    mascotHint: "Poke me and see what happens 👆",
    whatsComing: "What is coming",
    whatsComingNote: "All of it in one place. Nothing to type in twice.",
    features: [
      {
        icon: "builder",
        title: "Drag-and-drop website builder",
        body: "Pick a template, drag a section where you want it, change the words, publish. No developer, no code.",
      },
      {
        icon: "orders",
        title: "Orders and customers",
        body: "Website, WhatsApp and walk-in orders in one list. Customer details and their order history save themselves.",
      },
      {
        icon: "stock",
        title: "Stock that updates itself",
        body: "An order from your website takes the stock down for you, and tells you when something is running low.",
      },
      {
        icon: "money",
        title: "Expenses and real profit",
        body: "Record rent, wages, delivery and materials, then see what you are actually left with at the end of the month.",
      },
      {
        icon: "invoice",
        title: "Invoices and WhatsApp",
        body: "Make an invoice and send it straight to WhatsApp, along with order confirmations and delivery updates.",
      },
      {
        icon: "free",
        title: "Start for free",
        body: "No card needed. A free yourshop.helabiz.lk address and a real website — not a trial.",
      },
    ],
    priceTitle: "About the price",
    priceBody:
      "The free plan publishes a real website. Upgrade only when the business grows — from Rs. 999 a month.",
    followTitle: "Hear about it first",
    followBody: "Follow the page to know the day we launch. Something special for everyone who signs up in the first month 🎁",
    facebook: "Follow on Facebook",
    instagram: "Follow on Instagram",
    madeIn: "Made in Sri Lanka",
  },
};

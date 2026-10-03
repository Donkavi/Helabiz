import type { Lang } from "@/lib/i18n";

/**
 * The words for the dashboard's side of "Chat with customers": the Messages
 * screen and the ways in to it. Kept with the feature rather than in the
 * dashboard dictionary, the same as the support copy and the tours.
 *
 * Plain data with no server imports, so both server pages and client
 * components can read it. The Sinhala keeps everyday product words in
 * English (chat, message, order, WhatsApp, customer profile).
 */
export type MessagesCopy = {
  pageTitle: string;
  pageDescription: string;

  // The conversation list
  conversations: string;
  you: string;
  unread: string;

  // The open conversation
  back: string;
  showProfile: string;
  hideProfile: string;
  pickTitle: string;
  pickBody: string;
  replyNeedsAddon: string;
  chat: { placeholder: string; send: string; empty: string; requestBadge: string; you: string; sending: string };

  // The customer profile
  profile: string;
  types: Record<string, string>;
  call: string;
  whatsapp: string;
  whatsappGreeting: string;
  memberSince: string;
  totalOrders: string;
  totalSpent: string;
  lastOrder: string;
  noOrdersYet: string;
  recentOrders: string;
  items: string;
  viewFullProfile: string;

  // Empty and gated states
  emptyTitle: string;
  emptyBody: string;
  addonEyebrow: string;
  addonTitle: string;
  addonBody: string;
  addonPoints: string[];
  addonCta: string;
  addonPrice: string;
  addonOldChats: string;
  accountsOffTitle: string;
  accountsOffBody: string;
  accountsOffCta: string;

  // The customer's own page
  customerCardTitle: string;
  customerCardBody: string;
  customerCardCta: string;
};

export const MESSAGES_UI: Record<Lang, MessagesCopy> = {
  en: {
    pageTitle: "Messages",
    pageDescription: "Chats from customers signed in on your website, with who they are and what they have bought beside each one.",

    conversations: "Conversations",
    you: "You:",
    unread: "{count} unread",

    back: "All conversations",
    showProfile: "Customer profile",
    hideProfile: "Hide profile",
    pickTitle: "Pick a conversation",
    pickBody: "Choose a customer on the left to read their messages and reply.",
    replyNeedsAddon: "Turn on Chat with customers to reply here.",
    chat: {
      placeholder: "Write a reply…",
      send: "Send",
      empty: "No messages yet. Say hello!",
      requestBadge: "Request",
      you: "You",
      sending: "Sending…",
    },

    profile: "Customer profile",
    types: { new: "New", regular: "Regular", vip: "VIP" },
    call: "Call",
    whatsapp: "WhatsApp",
    whatsappGreeting: "Hello {name},",
    memberSince: "Account since {date}",
    totalOrders: "Orders",
    totalSpent: "Total spent",
    lastOrder: "Last order",
    noOrdersYet: "No orders yet.",
    recentOrders: "Recent orders",
    items: "{count} items",
    viewFullProfile: "View full profile",

    emptyTitle: "No messages yet",
    emptyBody:
      "When a signed-in customer taps the chat button on your website, their message lands here — and the bell lets you know.",
    addonEyebrow: "Add-on",
    addonTitle: "Chat with your customers on your website",
    addonBody: "Turn on Chat with customers and a chat button follows shoppers around your website.",
    addonPoints: [
      "Signed-in customers chat with you right on your site — you answer from here.",
      "See who you are talking to: their phone, address and past orders beside the chat.",
      "Anyone can tap through to WhatsApp instead.",
    ],
    addonCta: "Turn on Chat with customers",
    addonPrice: "{price} a month",
    addonOldChats: "Your earlier conversations are still here to read.",
    accountsOffTitle: "Customers cannot sign in right now",
    accountsOffBody:
      "Chat is for customers signed in on your website, and customer accounts are switched off in your website settings. Turn them on so the chat button shows.",
    accountsOffCta: "Open website settings",

    customerCardTitle: "Messages",
    customerCardBody: "This customer has chatted with you on your website.",
    customerCardCta: "Open conversation",
  },
  si: {
    pageTitle: "පණිවිඩ",
    pageDescription:
      "ඔබේ website එකට sign in වෙලා ඉන්න customers එවන chat මෙතන. හැම chat එකක් ළඟම ඒ කවුද, මොනවද ගත්තේ කියලා පේනවා.",

    conversations: "Chat",
    you: "ඔබ:",
    unread: "කියවලා නැති {count}ක්",

    back: "හැම chat එකම",
    showProfile: "Customer profile",
    hideProfile: "Profile එක හංගන්න",
    pickTitle: "Chat එකක් තෝරන්න",
    pickBody: "Messages කියවලා reply කරන්න වම් පැත්තෙන් customer කෙනෙක් තෝරන්න.",
    replyNeedsAddon: "මෙතනින් reply කරන්න Chat with customers on කරන්න.",
    chat: {
      placeholder: "Reply එකක් ලියන්න…",
      send: "යවන්න",
      empty: "තාම messages නෑ. Hello කියන්න!",
      requestBadge: "Request",
      you: "ඔබ",
      sending: "යවනවා…",
    },

    profile: "Customer profile",
    types: { new: "අලුත්", regular: "නිතර එන", vip: "VIP" },
    call: "Call",
    whatsapp: "WhatsApp",
    whatsappGreeting: "Hello {name},",
    memberSince: "{date} ඉඳන් account එකක් තියෙනවා",
    totalOrders: "Order",
    totalSpent: "මුළු වියදම",
    lastOrder: "අන්තිම order එක",
    noOrdersYet: "තාම order නෑ.",
    recentOrders: "අලුත්ම order",
    items: "items {count}",
    viewFullProfile: "සම්පූර්ණ profile එක බලන්න",

    emptyTitle: "තාම messages නෑ",
    emptyBody:
      "Sign in වෙලා ඉන්න customer කෙනෙක් ඔබේ website එකේ chat button එක ඔබලා message එකක් එව්වම ඒක මෙතනට එනවා — bell එකෙනුත් දැනුම් දෙනවා.",
    addonEyebrow: "Add-on",
    addonTitle: "ඔබේ website එකේදීම customers එක්ක chat කරන්න",
    addonBody: "Chat with customers on කරාම ඔබේ website එකේ හැම පිටුවකම chat button එකක් පේනවා.",
    addonPoints: [
      "Sign in වෙච්ච customers ලට ඔබේ site එකේදීම ඔබත් එක්ක chat කරන්න පුළුවන් — ඔබ reply කරන්නේ මෙතනින්.",
      "කතා කරන්නේ කාත් එක්කද කියලා පේනවා: phone number එක, address එක, කලින් order — chat එක ළඟම.",
      "කැමති කෙනෙක්ට ඒ වෙනුවට WhatsApp එකට යන්නත් පුළුවන්.",
    ],
    addonCta: "Chat with customers on කරන්න",
    addonPrice: "මාසෙකට {price}",
    addonOldChats: "කලින් chat තාමත් මෙතන කියවන්න පුළුවන්.",
    accountsOffTitle: "දැන් customers ලට sign in වෙන්න බෑ",
    accountsOffBody:
      "Chat එක තියෙන්නේ website එකට sign in වෙච්ච customers ලට. ඔබේ website settings වල customer accounts off කරලා. Chat button එක පේන්න ඒක on කරන්න.",
    accountsOffCta: "Website settings අරින්න",

    customerCardTitle: "පණිවිඩ",
    customerCardBody: "මේ customer ඔබේ website එකේදී ඔබත් එක්ක chat කරලා තියෙනවා.",
    customerCardCta: "Chat එක අරින්න",
  },
};

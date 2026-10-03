import type { Lang } from "@/lib/i18n";
import type { RequestStatus } from "@/lib/website-request";

/**
 * The words for "Help from the Helabiz team" on the business's side: the
 * request form, the popup and banners that offer it, the Support page and
 * the ways in to it. Kept here rather than in the dashboard dictionary so the
 * feature carries its own copy, the same as the tours.
 *
 * Plain data with no server imports, so both server pages and client
 * components can read it. The Sinhala keeps everyday product words in
 * English (website, order, chat, request, WhatsApp), the way people say them.
 */
export type SupportCopy = {
  // The offer, shared by the popup and the banners
  offerEyebrow: string;
  offerTitle: string;
  offerBody: string;
  benefits: string[];
  offerCta: string;
  maybeLater: string;

  // The floating card in the corner of every dashboard screen
  nudgeTitle: string;
  nudgeBody: string;
  nudgeCta: string;
  /** The small button the card shrinks to when closed. */
  nudgeCompact: string;
  nudgeHide: string;

  // The request form
  formTitle: string;
  formDescription: string;
  reassurance: string;
  phone: string;
  phoneHint: string;
  phonePlaceholder: string;
  whatsapp: string;
  bestTime: string;
  bestTimePlaceholder: string;
  about: string;
  aboutPlaceholder: string;
  pages: string;
  style: string;
  stylePlaceholder: string;
  links: string;
  linksPlaceholder: string;
  notes: string;
  notesPlaceholder: string;
  optional: string;
  submit: string;
  submitting: string;
  cancel: string;
  fieldErrors: { phone: string; about: string; pages: string; tooLong: string };
  genericError: string;
  doneTitle: string;
  doneBody: string;
  openChat: string;
  backToChat: string;
  close: string;

  // A request that already exists
  requestTitle: string;
  requestSent: string;
  chatWithTeam: string;

  // The Support page
  pageTitle: string;
  pageDescription: string;
  chatTitle: string;
  chatSubtitle: string;
  chat: { placeholder: string; send: string; empty: string; requestBadge: string; you: string; sending: string };
  nextTitle: string;
  nextSteps: string[];
  accessNote: string;
  askAgain: string;

  // Ways in
  helpAndSupport: string;
  showMeAround: string;
  chatMenu: string;
  unread: string;

  // The team page
  supportBadge: string;
  supportNote: string;
  removeSupportBody: string;
};

export const SUPPORT_UI: Record<Lang, SupportCopy> = {
  en: {
    offerEyebrow: "Help from the Helabiz team",
    offerTitle: "Not into drag and drop? We'll build your website for you",
    offerBody: "Tell us a little about your business and the Helabiz team will set up your website for you.",
    benefits: [
      "We call you, listen, and build it the way you want",
      "Your products and orders stay yours",
      "You can still change anything yourself later",
    ],
    offerCta: "Build my website for me",
    maybeLater: "Maybe later",
    nudgeTitle: "Want us to build your website?",
    nudgeBody: "Not comfortable with drag and drop? Send us a few details and the Helabiz team will build it for you.",
    nudgeCta: "Yes, build it for me",
    nudgeCompact: "Build my website",
    nudgeHide: "Hide",

    formTitle: "Let us build your website",
    formDescription:
      "Fill in a few details. Someone from the Helabiz team will call you and build the website with you.",
    reassurance:
      "This is the Helabiz team doing the work. Your products and orders stay yours, and you can edit the website yourself whenever you like.",
    phone: "Mobile number",
    phoneHint: "We will call you on this number.",
    phonePlaceholder: "07X XXX XXXX",
    whatsapp: "This number has WhatsApp",
    bestTime: "Best time to call",
    bestTimePlaceholder: "e.g. weekdays after 6 pm",
    about: "What do you sell? Tell us about your business",
    aboutPlaceholder: "e.g. Handmade batik sarees and shirts from Kandy. We deliver island-wide.",
    pages: "Which pages would you like?",
    style: "Styles or colours you like",
    stylePlaceholder: "e.g. simple and clean, our logo is green and gold, a website you like the look of…",
    links: "Facebook, Instagram or TikTok page",
    linksPlaceholder: "Paste your page links here",
    notes: "Anything else?",
    notesPlaceholder: "Anything you would like us to know",
    optional: "optional",
    submit: "Send my request",
    submitting: "Sending…",
    cancel: "Cancel",
    fieldErrors: {
      phone: "Enter a valid Sri Lankan mobile number",
      about: "Tell us a little more about your business",
      pages: "Choose the pages again",
      tooLong: "This is a bit too long",
    },
    genericError: "Something went wrong. Please try again.",
    doneTitle: "Thank you! We have your request",
    doneBody:
      "Our team will call you within one working day to talk about your website. You can message us any time in the Support chat.",
    openChat: "Open the Support chat",
    backToChat: "Back to the chat",
    close: "Close",

    requestTitle: "Your website request",
    requestSent: "Sent {date}",
    chatWithTeam: "Chat with the team",

    pageTitle: "Help & support",
    pageDescription: "Message the Helabiz team here. Real people, happy to help.",
    chatTitle: "Chat with the Helabiz team",
    chatSubtitle: "Ask about your website, orders or anything else.",
    chat: {
      placeholder: "Type your message…",
      send: "Send",
      empty: "No messages yet. Ask us anything about your website, orders or anything else.",
      requestBadge: "Website request",
      you: "You",
      sending: "Sending…",
    },
    nextTitle: "What happens next",
    nextSteps: [
      "We call you to understand your business",
      "We build your website with your products",
      "You check it, ask for changes here, and it goes live",
    ],
    accessNote:
      "While we build, a Helabiz support member appears in your Staff accounts. They are removed when the job is done, and you can remove them yourself any time.",
    askAgain: "Ask us again",

    helpAndSupport: "Help & support",
    showMeAround: "Show me around this page",
    chatMenu: "Chat with the Helabiz team",
    unread: "{count} unread",

    supportBadge: "Helabiz support",
    supportNote: "The Helabiz team, building your website at your request",
    removeSupportBody:
      "The Helabiz team will no longer be able to open your business. You can still chat with them in Help & support.",
  },
  si: {
    offerEyebrow: "Helabiz team එකෙන් උදව්",
    offerTitle: "Drag and drop කරන්න අමාරුද? ඔබේ website එක අපි හදලා දෙන්නම්",
    offerBody: "ඔබේ business එක ගැන පොඩ්ඩක් කියන්න. Helabiz team එක ඔබට website එක හදලා දෙනවා.",
    benefits: [
      "අපි ඔබට call කරලා, ඔබට ඕන විදිහටම හදලා දෙනවා",
      "ඔබේ products, orders ඔක්කොම ඔබේමයි",
      "පස්සේ ඕන දෙයක් ඔබටම වෙනස් කරන්නත් පුළුවන්",
    ],
    offerCta: "මගේ website එක හදලා දෙන්න",
    maybeLater: "පස්සේ බලමු",
    nudgeTitle: "Website එක අපි හදලා දෙන්නද?",
    nudgeBody: "Drag and drop කරන්න අමාරුද? විස්තර ටිකක් එවන්න, Helabiz team එක ඔබට website එක හදලා දෙනවා.",
    nudgeCta: "ඔව්, හදලා දෙන්න",
    nudgeCompact: "Website එක හදලා දෙන්නම්",
    nudgeHide: "හංගන්න",

    formTitle: "ඔබේ website එක අපි හදලා දෙන්නම්",
    formDescription:
      "පොඩි විස්තර ටිකක් දෙන්න. Helabiz team එකෙන් කෙනෙක් ඔබට call කරලා, ඔබත් එක්ක කතා කරලා website එක හදලා දෙනවා.",
    reassurance:
      "මේක කරන්නේ Helabiz team එකමයි. ඔබේ products, orders ඔබේමයි. ඕන වෙලාවක website එක ඔබටම edit කරන්නත් පුළුවන්.",
    phone: "Mobile number එක",
    phoneHint: "අපි call කරන්නේ මේ number එකට.",
    phonePlaceholder: "07X XXX XXXX",
    whatsapp: "මේ number එකේ WhatsApp තියෙනවා",
    bestTime: "Call කරන්න හොඳම වෙලාව",
    bestTimePlaceholder: "උදා: සතියේ දවස්වල හවස 6න් පස්සේ",
    about: "ඔබ විකුණන්නේ මොනවද? ඔබේ business එක ගැන කියන්න",
    aboutPlaceholder: "උදා: මහනුවර අතින් හදන බතික් සාරි, shirts. ලංකාව පුරා delivery කරනවා.",
    pages: "ඕන මොන pages ද?",
    style: "ඔබ කැමති style එක, පාට",
    stylePlaceholder: "උදා: simple, clean එකක්; අපේ logo එකේ පාට කොළ සහ රන්වන්; ඔබ කැමති website එකක්…",
    links: "Facebook, Instagram, TikTok page එක",
    linksPlaceholder: "ඔබේ page links මෙතන paste කරන්න",
    notes: "තව මොනවා හරි කියන්න තියෙනවද?",
    notesPlaceholder: "අපි දැනගන්න ඕන වෙන දෙයක්",
    optional: "අනිවාර්ය නෑ",
    submit: "Request එක යවන්න",
    submitting: "යවනවා…",
    cancel: "Cancel",
    fieldErrors: {
      phone: "හරි ලංකාවේ mobile number එකක් දාන්න",
      about: "ඔබේ business එක ගැන තව ටිකක් කියන්න",
      pages: "Pages ආයෙත් තෝරන්න",
      tooLong: "මේක ටිකක් දිග වැඩියි",
    },
    genericError: "මොකක් හරි වැරදුණා. ආයෙත් try කරන්න.",
    doneTitle: "ස්තූතියි! ඔබේ request එක අපිට ලැබුණා",
    doneBody:
      "වැඩ කරන දවසක් ඇතුළත අපේ team එක ඔබට call කරලා website එක ගැන කතා කරනවා. ඕන වෙලාවක Support chat එකෙන් අපිට message කරන්නත් පුළුවන්.",
    openChat: "Support chat එක open කරන්න",
    backToChat: "ආයෙත් chat එකට",
    close: "හරි",

    requestTitle: "ඔබේ website request එක",
    requestSent: "යැව්වේ {date}",
    chatWithTeam: "Team එකත් එක්ක chat කරන්න",

    pageTitle: "උදව් සහ support",
    pageDescription: "Helabiz team එකට මෙතනින් message කරන්න. උදව් කරන්න අපි ලෑස්තියි.",
    chatTitle: "Helabiz team එකත් එක්ක chat",
    chatSubtitle: "Website එක, orders, වෙන ඕන දෙයක් ගැන අහන්න.",
    chat: {
      placeholder: "ඔබේ message එක type කරන්න…",
      send: "Send",
      empty: "තාම messages නෑ. Website එක, orders, වෙන ඕන දෙයක් ගැන අපෙන් අහන්න.",
      requestBadge: "Website request",
      you: "ඔබ",
      sending: "යවනවා…",
    },
    nextTitle: "ඊළඟට මොකද වෙන්නේ",
    nextSteps: [
      "ඔබේ business එක තේරුම් ගන්න අපි call කරනවා",
      "ඔබේ products එක්කම website එක හදනවා",
      "ඔබ බලලා, වෙනස්කම් මෙතනින් කියනවා, ඊට පස්සේ live යනවා",
    ],
    accessNote:
      "අපි හදන අතරතුර ඔබේ Staff accounts වල Helabiz support කෙනෙක් පේනවා. වැඩේ ඉවර වුණාම එයාව අයින් වෙනවා. ඕන නම් ඕන වෙලාවක ඔබටම අයින් කරන්නත් පුළුවන්.",
    askAgain: "ආයෙත් ඉල්ලන්න",

    helpAndSupport: "උදව් සහ support",
    showMeAround: "මේ page එක පෙන්නන්න",
    chatMenu: "Helabiz team එකත් එක්ක chat කරන්න",
    unread: "කියවපු නැති messages {count}",

    supportBadge: "Helabiz support",
    supportNote: "ඔබ ඉල්ලපු නිසා ඔබේ website එක හදන Helabiz team එක",
    removeSupportBody:
      "එතකොට Helabiz team එකට ඔබේ business එක open කරන්න බෑ. උදව් සහ support එකෙන් එයාලත් එක්ක chat කරන්න පුළුවන්.",
  },
};

/** A request still being worked on, as opposed to one that is done or closed. */
export function isOpenRequest(status: RequestStatus | null | undefined) {
  return status === "new" || status === "contacted" || status === "building";
}

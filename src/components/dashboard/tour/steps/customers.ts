import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Your customers in one place",
        body: "Everyone who has ordered from you, with their phone number and order history. Website buyers are added by themselves.",
      },
      si: {
        title: "ඔබේ ගනුදෙනුකරුවෝ එකම තැනක",
        body: "ඔබෙන් order කරපු හැමෝම, phone number එකයි order history එකයි එක්කම මෙතන තියෙනවා. Website එකෙන් ගන්න අය ඉබේම එකතු වෙනවා.",
      },
    },
  },
  {
    target: "customers-add",
    text: {
      en: {
        title: "Add a customer",
        body: "Add WhatsApp, Facebook or walk-in customers by hand. The phone number identifies each person, so their repeat orders link up automatically.",
      },
      si: {
        title: "ගනුදෙනුකරුවෙක් එකතු කරන්න",
        body: "WhatsApp, Facebook හෝ කඩේට ආපු අයව Add customer ඔබලා දාන්න. Phone number එකෙන් අඳුරගන්න නිසා, ආයෙත් order කරනකොට ඉබේම link වෙනවා.",
      },
    },
  },
  {
    target: "customers-summary",
    text: {
      en: {
        title: "Know your regulars",
        body: "How many customers you have, how many came back for more, and how much they have spent with you in total.",
      },
      si: {
        title: "නිතර එන අය කවුද",
        body: "ගනුදෙනුකරුවෝ කී දෙනෙක්ද, කී දෙනෙක් ආයෙත් order කළාද, ඔක්කොම එකතුවෙන් ඔබ ළඟ වියදම් කරපු ගාණ — එක බැල්මෙන්.",
      },
    },
  },
  {
    target: "customers-search",
    text: {
      en: {
        title: "Find anyone fast",
        body: "Search by name, phone or email — handy when someone messages \"it's me, I ordered last week\".",
      },
      si: {
        title: "ඉක්මනින් හොයන්න",
        body: "නම, phone number හෝ email එකෙන් search කරන්න — \"මම ගිය සතියේ order කළා\" කියලා WhatsApp එකක් ආවම ගොඩක් ලේසියි.",
      },
    },
  },
  {
    target: "customers-table",
    text: {
      en: {
        title: "Who buys the most",
        body: "Your biggest spenders come first. Their type — new, regular or VIP — updates by itself as they order. Tap a name to see their full order history.",
      },
      si: {
        title: "වැඩියෙන්ම ගන්නේ කවුද",
        body: "වැඩියෙන්ම වියදම් කරන අය උඩින්ම. Type එක (new, regular, VIP) order කරන විදිහට ඉබේම මාරු වෙනවා. සම්පූර්ණ order history එක බලන්න නමක් ඔබන්න.",
      },
    },
  },
  {
    target: "customers-row-actions",
    text: {
      en: {
        title: "Message on WhatsApp",
        body: "The ⋯ menu lets you view history, edit details, or send a WhatsApp message in one tap — perfect for a thank-you or news of new stock.",
      },
      si: {
        title: "WhatsApp එකෙන් කතා කරන්න",
        body: "⋯ menu එකෙන් history බලන්න, විස්තර edit කරන්න, නැත්නම් එක tap එකකින් WhatsApp message එකක් යවන්න — ස්තුති කරන්න, අලුත් stock ගැන කියන්න.",
      },
    },
  },
  {
    target: "customers-record-order",
    text: {
      en: {
        title: "Start with an order",
        body: "Record a WhatsApp or Facebook order and the customer is saved for you. People who buy on your website show up here by themselves.",
      },
      si: {
        title: "Order එකකින් පටන් ගන්න",
        body: "WhatsApp හෝ Facebook order එකක් සටහන් කරාම ගනුදෙනුකරුවා ඉබේම save වෙනවා. Website එකෙන් ගන්න අයත් මෙතනට ඉබේම එනවා.",
      },
    },
  },
];

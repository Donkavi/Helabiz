import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Chat with your customers",
        body: "Customers signed in on your website can message you from the chat button. Every conversation lands here, and the bell tells you when a new one arrives.",
      },
      si: {
        title: "Customers එක්ක chat කරන්න",
        body: "ඔබේ website එකට sign in වෙච්ච customers ලට chat button එකෙන් ඔබට message කරන්න පුළුවන්. හැම chat එකක්ම මෙතනට එනවා, අලුත් එකක් ආවම bell එකෙන් කියනවා.",
      },
    },
  },
  {
    target: "messages-list",
    text: {
      en: {
        title: "Who is waiting",
        body: "Conversations with unread messages come first, with a count of what you have not opened. Tap a name to open the chat.",
      },
      si: {
        title: "කවුද බලන් ඉන්නේ",
        body: "කියවලා නැති messages තියෙන chat උඩින්ම, ඒ ගාණත් එක්කම. Chat එක අරින්න නමක් ඔබන්න.",
      },
    },
  },
  {
    target: "messages-thread",
    text: {
      en: {
        title: "Reply right here",
        body: "Type your answer and press Enter to send. New messages show up by themselves, and the customer sees your reply on your website.",
      },
      si: {
        title: "මෙතනින්ම reply කරන්න",
        body: "Reply එක type කරලා Enter ඔබන්න. අලුත් messages ඉබේම පේනවා, customer ට ඔබේ reply එක website එකේදීම පේනවා.",
      },
    },
  },
  {
    target: "messages-profile",
    text: {
      en: {
        title: "Know who you are talking to",
        body: "Their phone, address, what they have spent and their latest orders sit beside the chat — call them, jump to WhatsApp or open an order in one tap.",
      },
      si: {
        title: "කතා කරන්නේ කාත් එක්කද",
        body: "Phone number එක, address එක, වියදම් කරපු ගාණ, අලුත්ම order — ඔක්කොම chat එක ළඟම. එක tap එකකින් call කරන්න, WhatsApp එකට යන්න, නැත්නම් order එකක් අරින්න.",
      },
    },
  },
];

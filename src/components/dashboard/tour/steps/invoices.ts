import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Invoices from your orders",
        body: "Turn any order into a professional invoice with your business details and items — ready to print or save as a PDF.",
      },
      si: {
        title: "Order වලින්ම invoice",
        body: "ඕනම order එකක් ඔබේ ව්‍යාපාරයේ විස්තර සහ භාණ්ඩ එක්ක ලස්සන invoice එකක් කරගන්න — print කරන්න හෝ PDF එකක් විදිහට save කරන්න ලෑස්තියි.",
      },
    },
  },
  {
    target: "invoices-upgrade",
    text: {
      en: {
        title: "Part of the Starter plan",
        body: "Invoices come with the Starter plan and above. Tap See plans to compare plans and upgrade when you're ready.",
      },
      si: {
        title: "Starter plan එකේ තියෙන දෙයක්",
        body: "Invoice හදන්න පුළුවන් Starter plan එකේ ඉඳන්. Plans සසඳලා බලලා upgrade කරන්න See plans ඔබන්න.",
      },
    },
  },
  {
    target: "invoices-from-orders",
    text: {
      en: {
        title: "Create one from an order",
        body: "Open any order and choose Create invoice. The customer, items and totals fill in by themselves — no typing twice.",
      },
      si: {
        title: "Order එකකින් හදන්න",
        body: "ඕනම order එකක් open කරලා Create invoice ඔබන්න. ගනුදෙනුකරුවා, භාණ්ඩ, එකතුව ඔක්කොම ඉබේම පිරෙනවා — දෙපාරක් type කරන්න ඕන නෑ.",
      },
    },
  },
  {
    target: "invoices-table",
    text: {
      en: {
        title: "All your invoices",
        body: "Newest first, with the customer, issue date and total. For a new one, open an order and choose Create invoice.",
      },
      si: {
        title: "ඔබේ invoice ඔක්කොම",
        body: "අලුත්ම ඒවා උඩින් — ගනුදෙනුකරුවා, දිනය සහ එකතුව එක්ක. අලුත් එකක් ඕන නම් order එකක් open කරලා Create invoice ඔබන්න.",
      },
    },
  },
  {
    target: "invoices-status",
    text: {
      en: {
        title: "Paid or still owing?",
        body: "Each invoice shows draft, sent, paid, overdue or void. Change it inside the invoice so you always know who still has to pay.",
      },
      si: {
        title: "ගෙව්වද, තාම නැද්ද?",
        body: "හැම invoice එකකම draft, sent, paid, overdue, void කියලා status එක පේනවා. Invoice එක ඇතුළෙන් ඒක මාරු කරාම තාම ගෙවන්න තියෙන්නේ කාටද කියලා හැමවෙලේම දැනගන්න පුළුවන්.",
      },
    },
  },
  {
    target: "invoices-open",
    text: {
      en: {
        title: "Print or send as a PDF",
        body: "Tap an invoice number to open it, then Print / Save PDF. Send the PDF to your customer on WhatsApp or email.",
      },
      si: {
        title: "Print කරන්න, PDF එක යවන්න",
        body: "Invoice number එක ඔබලා open කරලා Print / Save PDF ඔබන්න. ඒ PDF එක WhatsApp හෝ email එකෙන් ගනුදෙනුකරුවාට යවන්න.",
      },
    },
  },
];

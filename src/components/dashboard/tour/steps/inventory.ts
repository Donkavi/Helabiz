import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Know what's on your shelves",
        body: "Your stock levels live here. They go down by themselves when orders come in, so you always know what you can still sell.",
      },
      si: {
        title: "කඩේ මොනවද තියෙන්නේ කියලා දැනගන්න",
        body: "ඔබේ තොග විස්තර ඔක්කොම මෙතන. Order එනකොට තොගය ඉබේම අඩු වෙනවා, ඒ නිසා තව විකුණන්න පුළුවන් මොනවද කියලා හැමවෙලේම දන්නවා.",
      },
    },
  },
  {
    target: "inventory-add",
    text: {
      en: {
        title: "Start with a product",
        body: "Add a product with stock tracking turned on, and it will appear here with its live stock level.",
      },
      si: {
        title: "මුලින්ම භාණ්ඩයක් දාන්න",
        body: "තොග tracking on කරලා භාණ්ඩයක් දාන්න. එතකොට ඒක දැනට තියෙන තොගයත් එක්කම මෙතන පේනවා.",
      },
    },
  },
  {
    target: "inventory-stats",
    text: {
      en: {
        title: "Your stock in numbers",
        body: "How many products you track, what your stock cost you, what it's worth at selling price, and how many items are low or sold out.",
      },
      si: {
        title: "ඔබේ තොගය ඉලක්කම් වලින්",
        body: "Track කරන භාණ්ඩ ගාණ, තොගයට ගිය වියදම, විකුණුම් මිලට ඒකේ වටිනාකම, සහ අඩු වෙලා හෝ ඉවර වෙලා තියෙන ඒවා කීයද කියලා.",
      },
    },
  },
  {
    target: "inventory-search",
    text: {
      en: {
        title: "Find an item",
        body: "Search by product name, SKU, or a variant like a size or colour.",
      },
      si: {
        title: "Item එකක් හොයන්න",
        body: "භාණ්ඩයේ නම, SKU එක, නැත්නම් size එකක් හෝ colour එකක් වගේ variant එකකින් search කරන්න.",
      },
    },
  },
  {
    target: "inventory-filter",
    text: {
      en: {
        title: "What needs restocking?",
        body: "Choose Running low or Out of stock to see exactly what to reorder from your supplier before customers start asking.",
      },
      si: {
        title: "ආයෙත් ගේන්න ඕන මොනවද?",
        body: "Customers අහන්න කලින් supplier ගෙන් ආයෙත් ගේන්න ඕන මොනවද කියලා බලන්න Running low හෝ Out of stock තෝරන්න.",
      },
    },
  },
  {
    target: "inventory-adjust",
    text: {
      en: {
        title: "Update stock by hand",
        body: "New stock arrived, a customer returned something, or an item got damaged? Tap Adjust, pick the reason, and enter the quantity.",
      },
      si: {
        title: "තොගය අතින් update කරන්න",
        body: "අලුත් තොගයක් ආවද, customer කෙනෙක් බඩුවක් ආපහු දුන්නද, නැත්නම් බඩුවක් කැඩුණද? Adjust ඔබලා හේතුව තෝරලා ප්‍රමාණය දාන්න.",
      },
    },
  },
  {
    target: "inventory-movements",
    text: {
      en: {
        title: "Every change, recorded",
        body: "Each sale, restock and correction is listed here with its reason, so you can always see why a number changed.",
      },
      si: {
        title: "හැම වෙනසක්ම සටහන් වෙනවා",
        body: "හැම sale එකක්ම, restock එකක්ම, correction එකක්ම හේතුවත් එක්ක මෙතන පේනවා. ගාණක් වෙනස් වුණේ ඇයි කියලා ඕනම වෙලාවක බලන්න පුළුවන්.",
      },
    },
  },
];

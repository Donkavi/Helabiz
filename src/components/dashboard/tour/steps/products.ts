import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Everything you sell",
        body: "This is your product list. Whatever you add here shows up on your website by itself — no double work.",
      },
      si: {
        title: "ඔබ විකුණන හැමදේම",
        body: "මේ ඔබේ භාණ්ඩ list එක. මෙතන දාන දේවල් ඉබේම website එකේ පේනවා — දෙපාරක් වැඩ කරන්න ඕන නෑ.",
      },
    },
  },
  {
    target: "products-add",
    text: {
      en: {
        title: "Add a product",
        body: "Add a name, price and photo — plus sizes or colours if you have them. Add your cost price too, so Helabiz can show your real profit.",
      },
      si: {
        title: "භාණ්ඩයක් දාන්න",
        body: "නම, මිල සහ photo එකක් දාන්න — size, colour තියෙනවා නම් ඒවත්. ඔබේ ඇත්ත ලාභය පෙන්නන්න පුළුවන් වෙන්න cost price එකත් දාන්න.",
      },
    },
  },
  {
    target: "products-categories",
    text: {
      en: {
        title: "Group them into categories",
        body: "Make categories like Dresses or Shoes. Customers can browse your website by category, and you can filter this list with them.",
      },
      si: {
        title: "Category වලට බෙදන්න",
        body: "Dresses, Shoes වගේ category හදන්න. Customers ලට website එකේ category අනුව බලන්න පුළුවන්, ඔබටත් මේ list එක category අනුව filter කරන්න පුළුවන්.",
      },
    },
  },
  {
    target: "products-search",
    text: {
      en: {
        title: "Find a product",
        body: "Type a name or SKU to find a product straight away, even when you have hundreds.",
      },
      si: {
        title: "භාණ්ඩයක් හොයන්න",
        body: "භාණ්ඩ සිය ගාණක් තිබුණත්, නම හෝ SKU එක type කරලා ඕන එක ඉක්මනටම හොයාගන්න.",
      },
    },
  },
  {
    target: "products-status",
    text: {
      en: {
        title: "Active, draft or archived",
        body: "Active products are on sale. Keep unfinished ones as Draft, and find archived products here when you want to bring them back.",
      },
      si: {
        title: "Active, draft හෝ archived",
        body: "Active භාණ්ඩ තමයි විකුණන්න තියෙන්නේ. තාම ලෑස්ති නැති ඒවා Draft විදිහට තියන්න. Archive කරපු ඒවා ආයෙත් ගන්න ඕන නම් මෙතනින් හොයාගන්න.",
      },
    },
  },
  {
    target: "products-list",
    text: {
      en: {
        title: "Price, margin and stock",
        body: "See each product's price, profit margin and stock in one row. Yellow or red stock means it's running low or sold out. Tap a product to edit it.",
      },
      si: {
        title: "මිල, margin සහ තොග",
        body: "හැම භාණ්ඩයකම මිල, ලාභ margin එක සහ තොගය එක පේළියේ පේනවා. තොගය කහ හෝ රතු නම් අඩුයි හෝ ඉවරයි. Edit කරන්න භාණ්ඩය ඔබන්න.",
      },
    },
  },
  {
    target: "products-actions",
    text: {
      en: {
        title: "Quick actions",
        body: "Use this menu to edit, feature a product on your website, or archive it when you stop selling it. Archived products can be restored later.",
      },
      si: {
        title: "ඉක්මන් actions",
        body: "මේ menu එකෙන් edit කරන්න, website එකේ feature කරන්න, නැත්නම් තවදුරටත් විකුණන්නේ නැත්නම් archive කරන්න. Archive කරපු ඒවා පස්සේ restore කරන්නත් පුළුවන්.",
      },
    },
  },
];

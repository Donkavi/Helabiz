import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Know where your money goes",
        body: "Rent, salaries, packaging, delivery… record them here and your profit becomes a real number, not a guess.",
      },
      si: {
        title: "සල්ලි යන්නේ කොහෙටද",
        body: "කුලී, පඩි, ඇසුරුම්, delivery… මෙතන සටහන් කරාම ඔබේ ලාභය අනුමානයක් නෙවෙයි, ඇත්ත ගාණක් වෙනවා.",
      },
    },
  },
  {
    target: "expenses-add",
    text: {
      en: {
        title: "Record an expense",
        body: "Spent something? Press Record expense and note what it was for, the amount, date, category and how you paid. Add it the same day so nothing slips.",
      },
      si: {
        title: "වියදමක් සටහන් කරන්න",
        body: "මොකක් හරි වියදම් කළාද? Record expense ඔබලා මොකටද, කීයද, දවස, category එක, ගෙව්වේ කොහොමද කියලා දාන්න. ඒ දවසෙම දැම්මොත් අමතක වෙන්නේ නෑ.",
      },
    },
  },
  {
    target: "expenses-summary",
    text: {
      en: {
        title: "This month at a glance",
        body: "This month's spending next to last month's, plus your all-time total. If spending suddenly jumps, you'll see it here first.",
      },
      si: {
        title: "මේ මාසේ කොහොමද",
        body: "මේ මාසේ වියදම් ගිය මාසේට සාපේක්ෂව, ඒ එක්කම මුළු එකතුවත්. වියදම් එකපාරටම වැඩි වුණොත් මුලින්ම පේන්නේ මෙතන.",
      },
    },
  },
  {
    target: "expenses-table",
    text: {
      en: {
        title: "Every expense",
        body: "Newest first, with the total of what's shown. Use the ⋯ menu on a row to edit or delete it.",
      },
      si: {
        title: "හැම වියදමක්ම",
        body: "අලුත්ම ඒවා උඩින්, පේන ඒවයේ එකතුවත් එක්ක. Edit හෝ delete කරන්න පේළියේ ⋯ menu එක ඔබන්න.",
      },
    },
  },
  {
    target: "expenses-filters",
    text: {
      en: {
        title: "Search and filter",
        body: "Search by name or note, or pick a category like Delivery or Rent to see exactly how much went on it.",
      },
      si: {
        title: "Search සහ filter",
        body: "නමෙන් හෝ note එකෙන් search කරන්න, නැත්නම් Delivery, Rent වගේ category එකක් තෝරලා ඒකට කීයක් ගියාද කියලා හරියටම බලන්න.",
      },
    },
  },
  {
    target: "expenses-chart",
    text: {
      en: {
        title: "Where the money goes",
        body: "This month's spending split by category, so you can spot what is eating into your profit.",
      },
      si: {
        title: "සල්ලි යන තැන්",
        body: "මේ මාසේ වියදම් category අනුව බෙදලා — ලාභය කන්නේ මොකද්ද කියලා ඉක්මනට අල්ලගන්න පුළුවන්.",
      },
    },
  },
];

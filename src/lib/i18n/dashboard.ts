import type { Lang } from ".";

/**
 * Strings for the signed-in app, in both languages.
 *
 * Same principle as the marketing dictionary: the product words Sri Lankan
 * shop owners already say in English — order, stock, invoice, WhatsApp, plan,
 * publish, dashboard — stay English inside the Sinhala. Forcing them into
 * formal Sinhala would make the app harder to use, not easier.
 *
 * Grouped by the screen that uses them. `common` holds the words that appear
 * on almost every screen, so a table's Save button is translated once.
 */
export type DashboardCopy = {
  common: {
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    search: string;
    loading: string;
    back: string;
    next: string;
    previous: string;
    viewAll: string;
    manage: string;
    optional: string;
    required: string;
    yes: string;
    no: string;
    all: string;
    none: string;
    total: string;
    status: string;
    date: string;
    actions: string;
    noResults: string;
    somethingWentWrong: string;
  };

  nav: {
    groups: { business: string; website: string };
    dashboard: string;
    orders: string;
    products: string;
    inventory: string;
    customers: string;
    messages: string;
    expenses: string;
    invoices: string;
    reports: string;
    overview: string;
    pages: string;
    themes: string;
    navigation: string;
    analytics: string;
    domains: string;
    settings: string;
    viewLiveSite: string;
    freePlan: string;
    usageThisMonth: string;
    upgradePlan: string;
  };

  topbar: {
    searchPlaceholder: string;
    newOrder: string;
    openNavigation: string;
    navigation: string;
    notifications: string;
    allCaughtUp: string;
    changeTheme: string;
    light: string;
    dark: string;
    system: string;
    accountMenu: string;
    account: string;
    businessSettings: string;
    signOut: string;
    language: string;
  };

  enums: {
    orderStatus: Record<string, string>;
    paymentStatus: Record<string, string>;
    paymentMethod: Record<string, string>;
    orderSource: Record<string, string>;
    expenseCategory: Record<string, string>;
  };

  home: {
    metaTitle: string;
    greeting: string;
    subtitle: string;
    addProduct: string;
    newOrder: string;
    today: string;
    websiteLast30: string;
    viewAnalytics: string;
    todaysSales: string;
    orders: string;
    expenses: string;
    profit: string;
    vsYesterday: string;
    afterCostAndExpenses: string;
    visitors: string;
    pageViews: string;
    websiteOrders: string;
    conversionRate: string;
    visitorsWhoOrdered: string;
    lowStock: string;
    everythingInStock: string;
    itemsNeedRestocking: string;
    sales: string;
    last30Days: string;
    thisMonth: string;
    profitAndExpenses: string;
    profitSuffix: string;
    recentOrders: string;
    noOrdersTitle: string;
    noOrdersBody: string;
    recordAnOrder: string;
    walkInCustomer: string;
    topProducts: string;
    noSalesYet: string;
    sold: string;
    everythingWellStocked: string;
    outOfStock: string;
    left: string;
    setupTitle: string;
    setupProgress: string;
    setup: { title: string; body: string; cta: string }[];
  };
};

const EN: DashboardCopy = {
  common: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    close: "Close",
    search: "Search",
    loading: "Loading…",
    back: "Back",
    next: "Next",
    previous: "Previous",
    viewAll: "View all",
    manage: "Manage",
    optional: "Optional",
    required: "Required",
    yes: "Yes",
    no: "No",
    all: "All",
    none: "None",
    total: "Total",
    status: "Status",
    date: "Date",
    actions: "Actions",
    noResults: "Nothing found",
    somethingWentWrong: "Something went wrong",
  },

  nav: {
    groups: { business: "Business", website: "Website" },
    dashboard: "Dashboard",
    orders: "Orders",
    products: "Products",
    inventory: "Inventory",
    customers: "Customers",
    messages: "Messages",
    expenses: "Expenses",
    invoices: "Invoices",
    reports: "Reports",
    overview: "Overview",
    pages: "Pages",
    themes: "Themes",
    navigation: "Navigation",
    analytics: "Analytics",
    domains: "Domains",
    settings: "Settings",
    viewLiveSite: "View live site",
    freePlan: "Free plan",
    usageThisMonth: "{used} of {limit} orders this month",
    upgradePlan: "Upgrade plan",
  },

  topbar: {
    searchPlaceholder: "Search products, orders, customers…",
    newOrder: "New order",
    openNavigation: "Open navigation",
    navigation: "Navigation",
    notifications: "Notifications",
    allCaughtUp: "You are all caught up.",
    changeTheme: "Change theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    accountMenu: "Account menu",
    account: "Account",
    businessSettings: "Business settings",
    signOut: "Sign out",
    language: "Language",
  },

  enums: {
    orderStatus: {
      pending: "Pending", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped",
      delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
    },
    paymentStatus: { paid: "Paid", unpaid: "Unpaid", partial: "Partly paid", refunded: "Refunded" },
    paymentMethod: {
      cod: "Cash on delivery", bank_transfer: "Bank transfer", online: "Online payment",
      cash: "Cash", card: "Card",
    },
    orderSource: {
      website: "Website", manual: "Manual", whatsapp: "WhatsApp", instagram: "Instagram",
      facebook: "Facebook", walk_in: "Walk-in",
    },
    expenseCategory: {
      rent: "Rent", salary: "Salary", marketing: "Marketing", packaging: "Packaging",
      delivery: "Delivery", inventory: "Inventory", utilities: "Utilities",
      transport: "Transport", other: "Other",
    },
  },

  home: {
    metaTitle: "Dashboard",
    greeting: "Good day, {name}",
    subtitle: "Here is how your business is doing today.",
    addProduct: "Add product",
    newOrder: "New order",
    today: "Today",
    websiteLast30: "Website · last 30 days",
    viewAnalytics: "View analytics",
    todaysSales: "Today's sales",
    orders: "Orders",
    expenses: "Expenses",
    profit: "Profit",
    vsYesterday: "vs yesterday",
    afterCostAndExpenses: "after cost & expenses",
    visitors: "Visitors",
    pageViews: "{count} page views",
    websiteOrders: "Website orders",
    conversionRate: "Conversion rate",
    visitorsWhoOrdered: "visitors who ordered",
    lowStock: "Low stock",
    everythingInStock: "everything in stock",
    itemsNeedRestocking: "items need restocking",
    sales: "Sales",
    last30Days: "Last 30 days",
    thisMonth: "this month",
    profitAndExpenses: "Profit & expenses",
    profitSuffix: "profit",
    recentOrders: "Recent orders",
    noOrdersTitle: "No orders yet",
    noOrdersBody: "Orders from your website and the ones you add by hand both land here.",
    recordAnOrder: "Record an order",
    walkInCustomer: "Walk-in customer",
    topProducts: "Top products",
    noSalesYet: "No sales yet.",
    sold: "sold",
    everythingWellStocked: "Everything is well stocked.",
    outOfStock: "Out of stock",
    left: "{count} left",
    setupTitle: "Get set up",
    setupProgress: "{done} of {total} done — you are close.",
    setup: [
      { title: "Add your products", body: "Name, price and a photo is enough to start.", cta: "Add product" },
      { title: "Create your website", body: "Pick a template — your products load in automatically.", cta: "Create website" },
      { title: "Publish it", body: "Go live on your own helabiz.lk address.", cta: "Open builder" },
      { title: "Take your first order", body: "Website orders arrive here automatically.", cta: "Record an order" },
    ],
  },
};

const SI: DashboardCopy = {
  common: {
    save: "සුරකින්න",
    saving: "සුරකිමින්…",
    cancel: "අවලංගු කරන්න",
    delete: "මකන්න",
    edit: "වෙනස් කරන්න",
    add: "එකතු කරන්න",
    close: "වහන්න",
    search: "සොයන්න",
    loading: "පූරණය වෙමින්…",
    back: "ආපහු",
    next: "ඊළඟ",
    previous: "කලින්",
    viewAll: "ඔක්කොම බලන්න",
    manage: "කළමනාකරණය",
    optional: "අවශ්‍ය නෑ",
    required: "අවශ්‍යයි",
    yes: "ඔව්",
    no: "නෑ",
    all: "ඔක්කොම",
    none: "කිසිවක් නෑ",
    total: "එකතුව",
    status: "තත්ත්වය",
    date: "දිනය",
    actions: "ක්‍රියා",
    noResults: "කිසිවක් හමු වුණේ නෑ",
    somethingWentWrong: "මොකක් හරි වැරදිලා",
  },

  nav: {
    groups: { business: "ව්‍යාපාරය", website: "වෙබ් අඩවිය" },
    dashboard: "Dashboard",
    orders: "Order",
    products: "භාණ්ඩ",
    inventory: "තොග",
    customers: "ගනුදෙනුකරුවෝ",
    messages: "පණිවිඩ",
    expenses: "වියදම්",
    invoices: "Invoice",
    reports: "වාර්තා",
    overview: "දළ විශ්ලේෂණය",
    pages: "පිටු",
    themes: "Theme",
    navigation: "Navigation",
    analytics: "Analytics",
    domains: "Domain",
    settings: "සැකසුම්",
    viewLiveSite: "සජීවී අඩවිය බලන්න",
    freePlan: "නොමිලේ plan එක",
    usageThisMonth: "මේ මාසේ order {limit}න් {used}ක්",
    upgradePlan: "Plan එක upgrade කරන්න",
  },

  topbar: {
    searchPlaceholder: "භාණ්ඩ, order, ගනුදෙනුකරුවෝ සොයන්න…",
    newOrder: "අලුත් order",
    openNavigation: "මෙනුව විවෘත කරන්න",
    navigation: "මෙනුව",
    notifications: "දැනුම්දීම්",
    allCaughtUp: "අලුත් දෙයක් නෑ.",
    changeTheme: "Theme එක වෙනස් කරන්න",
    light: "එළිය",
    dark: "අඳුර",
    system: "System එක",
    accountMenu: "ගිණුම් මෙනුව",
    account: "ගිණුම",
    businessSettings: "ව්‍යාපාර සැකසුම්",
    signOut: "පිටවෙන්න",
    language: "භාෂාව",
  },

  enums: {
    orderStatus: {
      pending: "බලාපොරොත්තුවෙන්", confirmed: "තහවුරුයි", packed: "ඇසුරුම් කළා", shipped: "යවලා",
      delivered: "බාර දුන්නා", cancelled: "අවලංගුයි", returned: "ආපහු ආවා",
    },
    paymentStatus: { paid: "ගෙවලා", unpaid: "ගෙවලා නෑ", partial: "කොටසක් ගෙවලා", refunded: "ආපහු දුන්නා" },
    paymentMethod: {
      cod: "බාර දෙනකොට මුදලින්", bank_transfer: "බැංකු මාරුව", online: "Online ගෙවීම",
      cash: "මුදල්", card: "Card",
    },
    orderSource: {
      website: "වෙබ් අඩවිය", manual: "අතින්", whatsapp: "WhatsApp", instagram: "Instagram",
      facebook: "Facebook", walk_in: "Walk-in",
    },
    expenseCategory: {
      rent: "කුලී", salary: "පඩි", marketing: "ප්‍රචාරණය", packaging: "ඇසුරුම්",
      delivery: "Delivery", inventory: "තොග", utilities: "උපයෝගිතා",
      transport: "ප්‍රවාහන", other: "වෙනත්",
    },
  },

  home: {
    metaTitle: "Dashboard",
    greeting: "සුබ දවසක්, {name}",
    subtitle: "අද ඔබේ ව්‍යාපාරය යන විදිහ මෙන්න.",
    addProduct: "භාණ්ඩයක් එකතු කරන්න",
    newOrder: "අලුත් order",
    today: "අද",
    websiteLast30: "වෙබ් අඩවිය · පසුගිය දවස් 30",
    viewAnalytics: "Analytics බලන්න",
    todaysSales: "අදේ විකුණුම්",
    orders: "Order",
    expenses: "වියදම්",
    profit: "ලාභය",
    vsYesterday: "ඊයේට සාපේක්ෂව",
    afterCostAndExpenses: "පිරිවැය සහ වියදම් අඩු කළාට පස්සේ",
    visitors: "පැමිණි අය",
    pageViews: "පිටු බැලීම් {count}ක්",
    websiteOrders: "වෙබ් අඩවි order",
    conversionRate: "Order කළ ප්‍රතිශතය",
    visitorsWhoOrdered: "පැමිණි අයගෙන් order කළ අය",
    lowStock: "අඩු තොග",
    everythingInStock: "ඔක්කොම තියෙනවා",
    itemsNeedRestocking: "භාණ්ඩ නැවත ගන්න ඕන",
    sales: "විකුණුම්",
    last30Days: "පසුගිය දවස් 30",
    thisMonth: "මේ මාසේ",
    profitAndExpenses: "ලාභය සහ වියදම්",
    profitSuffix: "ලාභය",
    recentOrders: "අලුත්ම order",
    noOrdersTitle: "තාම order නෑ",
    noOrdersBody: "වෙබ් අඩවියෙන් එන order සහ ඔබ අතින් දාන ඒවා දෙකම මෙතනට එනවා.",
    recordAnOrder: "Order එකක් සටහන් කරන්න",
    walkInCustomer: "Walk-in ගනුදෙනුකරු",
    topProducts: "වැඩියෙන්ම විකුණෙන භාණ්ඩ",
    noSalesYet: "තාම විකුණුම් නෑ.",
    sold: "විකුණලා",
    everythingWellStocked: "ඔක්කොම හොඳට තියෙනවා.",
    outOfStock: "තොගය ඉවරයි",
    left: "තව {count}ක්",
    setupTitle: "සූදානම් වෙන්න",
    setupProgress: "{total}න් {done}ක් ඉවරයි — ළඟටම ඇවිත්.",
    setup: [
      { title: "ඔබේ භාණ්ඩ එකතු කරන්න", body: "නම, මිල සහ පින්තූරයක් තිබුණාම පටන් ගන්න පුළුවන්.", cta: "භාණ්ඩයක් එකතු කරන්න" },
      { title: "වෙබ් අඩවිය හදන්න", body: "Template එකක් තෝරන්න — ඔබේ භාණ්ඩ ඉබේම එනවා.", cta: "වෙබ් අඩවිය හදන්න" },
      { title: "Publish කරන්න", body: "ඔබේම helabiz.lk ලිපිනයක online වෙන්න.", cta: "Builder එක අරින්න" },
      { title: "පළමු order එක ගන්න", body: "වෙබ් අඩවි order ඉබේම මෙතනට එනවා.", cta: "Order එකක් සටහන් කරන්න" },
    ],
  },
};

const COPY: Record<Lang, DashboardCopy> = { si: SI, en: EN };

export function dashboardCopy(lang: Lang) {
  return COPY[lang];
}

/** Fills `{name}`-style slots. Keeps word order a translator's decision, not the code's. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

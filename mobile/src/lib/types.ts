/** Shapes returned by the web app's `/api/mobile/*` routes. */

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";

export type User = { id: string; name: string; email: string; image?: string | null };

export type Business = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "staff";
  plan: string;
  status: string;
  locked: boolean;
};

export type SessionResponse = { user: User; businesses: Business[] };
export type SignInResponse = SessionResponse & { token: string };

export type PeriodSummary = {
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
  orders: number;
  items: number;
};

export type SeriesPoint = {
  date: string;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  orders: number;
};

export type WebMetrics = {
  pageViews: number;
  visitors: number;
  productViews: number;
  addToCart: number;
  checkouts: number;
  orders: number;
  conversionRate: number;
};

export type TopProduct = { id: string; name: string; image: string | null; quantity: number; revenue: number };

export type OrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: string;
  itemCount: number;
  createdAt: string | null;
};

export type OrderDetail = OrderSummary & {
  customerId: string | null;
  customer: {
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
  };
  items: {
    name: string;
    variantName: string | null;
    image: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  paymentMethod: string;
  notes: string | null;
  trackingNumber: string | null;
  timeline: { status: string; note: string | null; at: string | null }[];
  /** wa.me link carrying the web's ready-made order message, when there is a phone. */
  whatsappUrl: string | null;
  /** Total less delivery and cost, when cost prices are known. */
  estimatedProfit: number | null;
};

export type Dashboard = {
  business: { id: string; name: string; plan: string };
  today: PeriodSummary;
  yesterday: PeriodSummary;
  month: PeriodSummary;
  lastMonth: PeriodSummary;
  series: SeriesPoint[];
  topProducts: TopProduct[];
  lowStock: { id: string; name: string; image: string | null; stock: number; threshold: number }[];
  web: WebMetrics;
  websitePublished: boolean;
  recentOrders: OrderSummary[];
  customerCount: number;
  unreadMessages: number;
  chatEnabled: boolean;
};

export type Report = {
  days: number;
  current: PeriodSummary;
  previous: PeriodSummary;
  series: SeriesPoint[];
  top: TopProduct[];
  expenseSplit: { category: string; total: number }[];
  customers: { total: number; repeat: number; spend: number };
  inventory: { cost: number; retail: number; units: number };
  web: WebMetrics;
  grossProfit: number;
  margin: number;
};

export type ChatMessage = {
  id: string;
  from: "customer" | "shop";
  authorName: string;
  body: string;
  createdAt: string;
  readAt?: string;
};

export type ChatCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  type: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  memberSince?: string;
};

export type ChatThread = {
  customer: ChatCustomer;
  lastMessage: { body: string; from: "customer" | "shop"; createdAt: string };
  unread: number;
};

/** What the server puts in a push notification's `data`. */
export type PushData = {
  type?: "order" | "message" | "support" | "test";
  orderId?: string;
  customerId?: string;
  businessId?: string;
};

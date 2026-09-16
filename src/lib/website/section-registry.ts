import {
  AlignLeft,
  ArrowRightLeft,
  Banknote,
  BadgePercent,
  Building2,
  CalendarClock,
  Columns3,
  Contact,
  CreditCard,
  Frame,
  Grid3x3,
  Heading1,
  HelpCircle,
  Images,
  Image as ImageIcon,
  LayoutGrid,
  LayoutList,
  Layers,
  Link2,
  MapPin,
  Megaphone,
  Minus,
  MousePointerClick,
  Package,
  PanelBottom,
  PanelTop,
  Quote,
  RectangleHorizontal,
  Rows3,
  ShoppingBag,
  Sparkles,
  Square,
  Star,
  Store,
  Type,
  Users,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { SectionNode, StyleProps } from "@/types";
import { ALIGN_OPTIONS, COLUMN_OPTIONS, type Field } from "./fields";
import { uid } from "@/lib/utils";

export type SectionCategory =
  | "Layout"
  | "Content"
  | "Marketing"
  | "Media"
  | "Commerce"
  | "Business"
  | "Navigation";

export type SectionDef = {
  type: string;
  label: string;
  category: SectionCategory;
  icon: LucideIcon;
  description: string;
  keywords?: string[];
  /** Container sections accept dropped children. */
  container?: boolean;
  /** Header/footer are managed separately and cannot be dropped onto a page. */
  structural?: boolean;
  props: Record<string, unknown>;
  styles: StyleProps;
  fields: Field[];
};

const PLACEHOLDER = "/placeholders/photo-1.svg";
const PLACEHOLDER_2 = "/placeholders/photo-2.svg";
const PLACEHOLDER_3 = "/placeholders/photo-3.svg";

const buttonFields = (prefix = "", label = "Button"): Field[] => [
  { key: `${prefix}buttonText`, label: `${label} text`, type: "text", placeholder: "Shop now" },
  { key: `${prefix}buttonUrl`, label: `${label} link`, type: "url", placeholder: "/shop" },
];

export const SECTION_DEFS: SectionDef[] = [
  /* ── Layout ────────────────────────────────────────────────────────── */
  {
    type: "section",
    label: "Section",
    category: "Layout",
    icon: Rows3,
    description: "A blank band you can drop anything into.",
    container: true,
    props: {},
    styles: { paddingY: 64, maxWidth: "lg", background: "transparent" },
    fields: [],
  },
  {
    type: "container",
    label: "Container",
    category: "Layout",
    icon: Square,
    description: "Centres its contents inside a fixed width.",
    container: true,
    props: {},
    styles: { paddingY: 24, maxWidth: "md" },
    fields: [],
  },
  {
    type: "columns",
    label: "Columns",
    category: "Layout",
    icon: Columns3,
    description: "Side-by-side columns that stack on mobile.",
    container: true,
    props: { columns: 2 },
    styles: { paddingY: 48, gap: 32, maxWidth: "lg" },
    fields: [{ key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(0, 4) }],
  },
  {
    type: "grid",
    label: "Grid",
    category: "Layout",
    icon: Grid3x3,
    description: "An even grid of blocks.",
    container: true,
    props: { columns: 3 },
    styles: { paddingY: 48, gap: 24, maxWidth: "lg" },
    fields: [{ key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS }],
  },
  {
    type: "spacer",
    label: "Spacer",
    category: "Layout",
    icon: ArrowRightLeft,
    description: "Adds breathing room between sections.",
    props: { height: 64 },
    styles: {},
    fields: [{ key: "height", label: "Height", type: "slider", min: 8, max: 240, step: 4, unit: "px" }],
  },

  /* ── Content ───────────────────────────────────────────────────────── */
  {
    type: "heading",
    label: "Heading",
    category: "Content",
    icon: Heading1,
    description: "A title with an optional kicker.",
    props: { eyebrow: "", text: "A heading that sets the scene", level: "h2", subtext: "" },
    styles: { paddingY: 40, align: "center", maxWidth: "md" },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "Optional small label" },
      { key: "text", label: "Heading", type: "text", placeholder: "Your heading" },
      { key: "subtext", label: "Sub text", type: "textarea", rows: 3 },
      {
        key: "level",
        label: "Heading level",
        type: "segmented",
        options: [
          { value: "h1", label: "H1" },
          { value: "h2", label: "H2" },
          { value: "h3", label: "H3" },
        ],
      },
    ],
  },
  {
    type: "paragraph",
    label: "Paragraph",
    category: "Content",
    icon: AlignLeft,
    description: "A block of body text.",
    props: {
      text: "Tell your customers what makes your business different. Keep it short, warm and specific.",
    },
    styles: { paddingY: 32, align: "left", maxWidth: "md" },
    fields: [{ key: "text", label: "Text", type: "textarea", rows: 6 }],
  },
  {
    type: "richtext",
    label: "Rich text",
    category: "Content",
    icon: Type,
    description: "Multiple paragraphs with a heading and list.",
    props: {
      heading: "About this",
      body: "Write a longer story here.\n\nLeave a blank line to start a new paragraph. Use it for your story, delivery information or anything that needs more space.",
    },
    styles: { paddingY: 64, align: "left", maxWidth: "md" },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea", rows: 10, help: "Blank line = new paragraph." },
    ],
  },
  {
    type: "image",
    label: "Image",
    category: "Content",
    icon: ImageIcon,
    description: "A single image with an optional caption.",
    props: { src: PLACEHOLDER, alt: "", caption: "", link: "", ratio: "16/9", fit: "cover" },
    styles: { paddingY: 48, maxWidth: "lg", radius: 12 },
    fields: [
      { key: "src", label: "Image", type: "image" },
      { key: "alt", label: "Alt text", type: "text", help: "Describes the image for screen readers and search." },
      { key: "caption", label: "Caption", type: "text" },
      { key: "link", label: "Links to", type: "url" },
      {
        key: "ratio",
        label: "Shape",
        type: "select",
        options: [
          { value: "auto", label: "Original" },
          { value: "16/9", label: "Wide 16:9" },
          { value: "4/3", label: "Classic 4:3" },
          { value: "1/1", label: "Square" },
          { value: "3/4", label: "Portrait 3:4" },
        ],
      },
      {
        key: "fit",
        label: "Fit",
        type: "segmented",
        options: [
          { value: "cover", label: "Fill" },
          { value: "contain", label: "Fit" },
        ],
      },
    ],
  },
  {
    type: "video",
    label: "Video",
    category: "Content",
    icon: Video,
    description: "Embed a YouTube or Vimeo video.",
    props: { url: "", caption: "", ratio: "16/9" },
    styles: { paddingY: 56, maxWidth: "lg", radius: 14 },
    fields: [
      { key: "url", label: "Video URL", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "caption", label: "Caption", type: "text" },
    ],
  },
  {
    type: "button",
    label: "Button",
    category: "Content",
    icon: MousePointerClick,
    description: "A single call-to-action button.",
    props: { text: "Shop now", url: "/shop", variant: "solid", size: "md" },
    styles: { paddingY: 28, align: "center" },
    fields: [
      { key: "text", label: "Label", type: "text" },
      { key: "url", label: "Link", type: "url" },
      {
        key: "variant",
        label: "Style",
        type: "segmented",
        options: [
          { value: "solid", label: "Solid" },
          { value: "outline", label: "Outline" },
          { value: "soft", label: "Soft" },
        ],
      },
      {
        key: "size",
        label: "Size",
        type: "segmented",
        options: [
          { value: "sm", label: "S" },
          { value: "md", label: "M" },
          { value: "lg", label: "L" },
        ],
      },
    ],
  },
  {
    type: "divider",
    label: "Divider",
    category: "Content",
    icon: Minus,
    description: "A horizontal rule.",
    props: { style: "solid", width: 100 },
    styles: { paddingY: 24, maxWidth: "lg" },
    fields: [
      {
        key: "style",
        label: "Line",
        type: "segmented",
        options: [
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
        ],
      },
      { key: "width", label: "Width", type: "slider", min: 10, max: 100, step: 5, unit: "%" },
    ],
  },

  /* ── Marketing ─────────────────────────────────────────────────────── */
  {
    type: "hero",
    label: "Hero",
    category: "Marketing",
    icon: Sparkles,
    description: "The opening statement of your page.",
    keywords: ["banner", "header", "top"],
    props: {
      layout: "text-left",
      eyebrow: "New collection",
      title: "Your style.\nYour store.\nYour website.",
      description: "Discover our latest collection, made and delivered across Sri Lanka.",
      buttonText: "Shop now",
      buttonUrl: "/shop",
      secondaryButtonText: "Contact us",
      secondaryButtonUrl: "/contact",
      image: PLACEHOLDER,
      textWidth: 560,
    },
    styles: {
      paddingY: 88,
      maxWidth: "lg",
      align: "left",
      minHeight: 0,
      backgroundOverlay: 45,
      animation: "fade-up",
    },
    fields: [
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "text-left", label: "Text left / image right" },
          { value: "text-right", label: "Text right / image left" },
          { value: "centered", label: "Centered" },
          { value: "background", label: "Full-screen background" },
        ],
      },
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Heading", type: "textarea", rows: 3, help: "Press Enter for a line break." },
      { key: "description", label: "Subheading", type: "textarea", rows: 3 },
      ...buttonFields("", "Primary button"),
      { key: "secondaryButtonText", label: "Secondary button text", type: "text" },
      { key: "secondaryButtonUrl", label: "Secondary button link", type: "url" },
      { key: "image", label: "Image", type: "image" },
      { key: "textWidth", label: "Text width", type: "slider", min: 320, max: 900, step: 20, unit: "px" },
    ],
  },
  {
    type: "cta",
    label: "Call to action",
    category: "Marketing",
    icon: Megaphone,
    description: "A focused prompt to buy, book or get in touch.",
    props: {
      title: "Ready to order?",
      description: "Free delivery on orders over Rs. 10,000 anywhere in Sri Lanka.",
      buttonText: "Shop now",
      buttonUrl: "/shop",
      secondaryButtonText: "",
      secondaryButtonUrl: "",
      boxed: true,
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", radius: 18 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea", rows: 3 },
      ...buttonFields(),
      { key: "secondaryButtonText", label: "Secondary button text", type: "text" },
      { key: "secondaryButtonUrl", label: "Secondary button link", type: "url" },
      { key: "boxed", label: "Show as a card", type: "switch" },
    ],
  },
  {
    type: "features",
    label: "Features",
    category: "Marketing",
    icon: LayoutGrid,
    description: "Three or four reasons to choose you.",
    props: {
      eyebrow: "Why us",
      title: "Why customers keep coming back",
      columns: 3,
      items: [
        { icon: "truck", title: "Island-wide delivery", description: "Delivered to your door in 2–4 days." },
        { icon: "shield", title: "Quality you can trust", description: "Every item checked before it is packed." },
        { icon: "heart", title: "Made with care", description: "Small batches, made by a team that cares." },
      ],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", gap: 24 },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(1, 4) },
      {
        key: "items",
        label: "Features",
        type: "repeater",
        itemLabel: "Feature",
        addLabel: "Add feature",
        titleKey: "title",
        defaultItem: { icon: "star", title: "New feature", description: "Describe it in one sentence." },
        fields: [
          { key: "icon", label: "Icon", type: "icon" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  {
    type: "testimonials",
    label: "Testimonials",
    category: "Marketing",
    icon: Quote,
    description: "What your customers say about you.",
    props: {
      eyebrow: "Reviews",
      title: "Loved by our customers",
      layout: "cards",
      items: [
        { quote: "Beautiful quality and it arrived in two days. I will definitely order again.", name: "Tharushi S.", role: "Colombo", rating: 5 },
        { quote: "Exactly what was shown in the photos. Packaging was lovely too.", name: "Nimali P.", role: "Kandy", rating: 5 },
        { quote: "Great service and they answered all my questions on WhatsApp.", name: "Roshan F.", role: "Negombo", rating: 5 },
      ],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", gap: 20 },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      {
        key: "layout",
        label: "Layout",
        type: "segmented",
        options: [
          { value: "cards", label: "Cards" },
          { value: "single", label: "Single" },
        ],
      },
      {
        key: "items",
        label: "Testimonials",
        type: "repeater",
        itemLabel: "Testimonial",
        addLabel: "Add testimonial",
        titleKey: "name",
        defaultItem: { quote: "Write what your customer said.", name: "Customer name", role: "City", rating: 5 },
        fields: [
          { key: "quote", label: "Quote", type: "textarea", rows: 3 },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Location / role", type: "text" },
          { key: "rating", label: "Stars", type: "slider", min: 0, max: 5, step: 1 },
        ],
      },
    ],
  },
  {
    type: "stats",
    label: "Statistics",
    category: "Marketing",
    icon: BadgePercent,
    description: "Numbers that build confidence.",
    props: {
      items: [
        { value: "1,200+", label: "Happy customers" },
        { value: "4.9", label: "Average rating" },
        { value: "2–4 days", label: "Island-wide delivery" },
        { value: "5 years", label: "In business" },
      ],
    },
    styles: { paddingY: 64, maxWidth: "lg", align: "center", gap: 24 },
    fields: [
      {
        key: "items",
        label: "Statistics",
        type: "repeater",
        itemLabel: "Statistic",
        addLabel: "Add statistic",
        titleKey: "label",
        defaultItem: { value: "100+", label: "Something to be proud of" },
        fields: [
          { key: "value", label: "Value", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    type: "faq",
    label: "FAQ",
    category: "Marketing",
    icon: HelpCircle,
    description: "Answer the questions customers always ask.",
    props: {
      title: "Frequently asked questions",
      items: [
        { question: "How long does delivery take?", answer: "Orders are dispatched within one working day and arrive in 2–4 days island-wide." },
        { question: "Can I pay cash on delivery?", answer: "Yes. Cash on delivery and bank transfer are both available at checkout." },
        { question: "Do you accept returns?", answer: "Unused items can be returned within 7 days. Message us and we will arrange it." },
      ],
    },
    styles: { paddingY: 80, maxWidth: "md", align: "left" },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      {
        key: "items",
        label: "Questions",
        type: "repeater",
        itemLabel: "Question",
        addLabel: "Add question",
        titleKey: "question",
        defaultItem: { question: "A question customers ask", answer: "The answer." },
        fields: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea", rows: 4 },
        ],
      },
    ],
  },
  {
    type: "announcement",
    label: "Announcement bar",
    category: "Marketing",
    icon: RectangleHorizontal,
    description: "A thin strip for offers and notices.",
    props: { text: "Free delivery on orders over Rs. 10,000", linkText: "", linkUrl: "" },
    styles: { paddingY: 10, align: "center", maxWidth: "full", fontSize: 13 },
    fields: [
      { key: "text", label: "Message", type: "text" },
      { key: "linkText", label: "Link text", type: "text" },
      { key: "linkUrl", label: "Link", type: "url" },
    ],
  },

  /* ── Media ─────────────────────────────────────────────────────────── */
  {
    type: "gallery",
    label: "Image gallery",
    category: "Media",
    icon: Images,
    description: "A grid, masonry or scrolling set of images.",
    props: {
      title: "",
      layout: "grid",
      columns: 3,
      lightbox: true,
      hoverEffect: "zoom",
      items: [
        { src: PLACEHOLDER, caption: "", link: "" },
        { src: PLACEHOLDER_2, caption: "", link: "" },
        { src: PLACEHOLDER_3, caption: "", link: "" },
        { src: PLACEHOLDER, caption: "", link: "" },
        { src: PLACEHOLDER_2, caption: "", link: "" },
        { src: PLACEHOLDER_3, caption: "", link: "" },
      ],
    },
    styles: { paddingY: 72, maxWidth: "lg", gap: 14, radius: 12 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "grid", label: "Grid" },
          { value: "masonry", label: "Masonry" },
          { value: "scroll", label: "Horizontal scroll" },
        ],
      },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(1, 4) },
      {
        key: "hoverEffect",
        label: "Hover effect",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "zoom", label: "Zoom in" },
          { value: "lift", label: "Lift" },
          { value: "fade", label: "Fade" },
        ],
      },
      { key: "lightbox", label: "Open full size on click", type: "switch" },
      {
        key: "items",
        label: "Images",
        type: "repeater",
        itemLabel: "Image",
        addLabel: "Add image",
        titleKey: "caption",
        defaultItem: { src: PLACEHOLDER, caption: "", link: "" },
        fields: [
          { key: "src", label: "Image", type: "image" },
          { key: "caption", label: "Caption", type: "text" },
          { key: "link", label: "Links to", type: "url" },
        ],
      },
    ],
  },
  {
    type: "slider",
    label: "Image slider",
    category: "Media",
    icon: Frame,
    description: "Full-width slides with text and a button.",
    props: {
      autoplay: true,
      duration: 5,
      arrows: true,
      dots: true,
      transition: "slide",
      height: 460,
      slides: [
        {
          image: PLACEHOLDER,
          heading: "New season arrivals",
          description: "Fresh pieces added every week.",
          buttonText: "Shop the collection",
          buttonUrl: "/shop",
        },
        {
          image: PLACEHOLDER_2,
          heading: "Made in Sri Lanka",
          description: "Designed and finished by our own team.",
          buttonText: "Our story",
          buttonUrl: "/about",
        },
      ],
    },
    styles: { paddingY: 0, maxWidth: "full", radius: 0, backgroundOverlay: 42 },
    fields: [
      { key: "height", label: "Height", type: "slider", min: 240, max: 800, step: 20, unit: "px" },
      { key: "autoplay", label: "Auto-play", type: "switch" },
      { key: "duration", label: "Seconds per slide", type: "slider", min: 2, max: 12, step: 1, unit: "s" },
      {
        key: "transition",
        label: "Transition",
        type: "segmented",
        options: [
          { value: "slide", label: "Slide" },
          { value: "fade", label: "Fade" },
        ],
      },
      { key: "arrows", label: "Show arrows", type: "switch" },
      { key: "dots", label: "Show dots", type: "switch" },
      {
        key: "slides",
        label: "Slides",
        type: "repeater",
        itemLabel: "Slide",
        addLabel: "Add slide",
        titleKey: "heading",
        defaultItem: { image: PLACEHOLDER, heading: "New slide", description: "", buttonText: "", buttonUrl: "" },
        fields: [
          { key: "image", label: "Image", type: "image" },
          { key: "heading", label: "Heading", type: "text" },
          { key: "description", label: "Description", type: "textarea", rows: 2 },
          ...buttonFields(),
        ],
      },
    ],
  },
  {
    type: "carousel",
    label: "Carousel",
    category: "Media",
    icon: Layers,
    description: "A scrolling row of cards.",
    props: {
      title: "Featured",
      perView: 3,
      items: [
        { image: PLACEHOLDER, title: "Item one", description: "A short description.", link: "" },
        { image: PLACEHOLDER_2, title: "Item two", description: "A short description.", link: "" },
        { image: PLACEHOLDER_3, title: "Item three", description: "A short description.", link: "" },
        { image: PLACEHOLDER, title: "Item four", description: "A short description.", link: "" },
      ],
    },
    styles: { paddingY: 72, maxWidth: "lg", gap: 18, radius: 14 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "perView", label: "Cards visible", type: "segmented", options: COLUMN_OPTIONS.slice(1, 4) },
      {
        key: "items",
        label: "Cards",
        type: "repeater",
        itemLabel: "Card",
        addLabel: "Add card",
        titleKey: "title",
        defaultItem: { image: PLACEHOLDER, title: "New card", description: "", link: "" },
        fields: [
          { key: "image", label: "Image", type: "image" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea", rows: 2 },
          { key: "link", label: "Links to", type: "url" },
        ],
      },
    ],
  },
  {
    type: "video-section",
    label: "Video section",
    category: "Media",
    icon: Video,
    description: "A video with a heading beside it.",
    props: {
      title: "See how we make it",
      description: "A short look inside our workshop.",
      url: "",
      layout: "below",
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", radius: 16 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea", rows: 3 },
      { key: "url", label: "Video URL", type: "url" },
      {
        key: "layout",
        label: "Layout",
        type: "segmented",
        options: [
          { value: "below", label: "Stacked" },
          { value: "side", label: "Side by side" },
        ],
      },
    ],
  },

  /* ── Commerce ──────────────────────────────────────────────────────── */
  {
    type: "product-grid",
    label: "Product grid",
    category: "Commerce",
    icon: Package,
    description: "Pulls products straight from your catalogue.",
    keywords: ["shop", "products", "catalogue"],
    props: {
      title: "Shop our products",
      subtitle: "",
      source: "all",
      categoryId: "",
      limit: 8,
      columns: 4,
      sort: "newest",
      showPrice: true,
      showSaleBadge: true,
      showStock: false,
      showAddToCart: true,
      showViewAll: true,
      showFilters: false,
      productIds: [],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", gap: 20 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "subtitle", label: "Sub heading", type: "text" },
      {
        key: "source",
        label: "Products to show",
        type: "select",
        options: [
          { value: "all", label: "All products" },
          { value: "featured", label: "Featured only" },
          { value: "category", label: "One category" },
          { value: "manual", label: "Hand-picked" },
        ],
      },
      { key: "categoryId", label: "Category", type: "category" },
      { key: "productIds", label: "Products", type: "products" },
      {
        key: "sort",
        label: "Sort by",
        type: "select",
        options: [
          { value: "newest", label: "Newest first" },
          { value: "price-asc", label: "Price: low to high" },
          { value: "price-desc", label: "Price: high to low" },
          { value: "best-selling", label: "Best selling" },
          { value: "name", label: "Name A–Z" },
        ],
      },
      { key: "limit", label: "How many", type: "slider", min: 2, max: 24, step: 1 },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(1, 5) },
      { key: "showPrice", label: "Show price", type: "switch" },
      { key: "showSaleBadge", label: "Show sale badge", type: "switch" },
      { key: "showStock", label: "Show stock status", type: "switch" },
      { key: "showAddToCart", label: "Show add to cart", type: "switch" },
      { key: "showViewAll", label: "Show 'view all' link", type: "switch" },
      {
        key: "showFilters",
        label: "Show category & search filters",
        type: "switch",
        help: "Turn on for your main shop page so customers can browse by category.",
      },
    ],
  },
  {
    type: "featured-product",
    label: "Featured product",
    category: "Commerce",
    icon: Star,
    description: "Give one product the whole spotlight.",
    props: {
      productId: "",
      eyebrow: "Featured",
      buttonText: "View product",
      layout: "image-left",
      showPrice: true,
    },
    styles: { paddingY: 80, maxWidth: "lg", gap: 48, radius: 16 },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "productId", label: "Product", type: "products", help: "Pick one product to feature." },
      {
        key: "layout",
        label: "Layout",
        type: "segmented",
        options: [
          { value: "image-left", label: "Image left" },
          { value: "image-right", label: "Image right" },
        ],
      },
      { key: "buttonText", label: "Button text", type: "text" },
      { key: "showPrice", label: "Show price", type: "switch" },
    ],
  },
  {
    type: "categories",
    label: "Product categories",
    category: "Commerce",
    icon: LayoutList,
    description: "Let people browse by category.",
    props: { title: "Shop by category", columns: 3, limit: 6, style: "image" },
    styles: { paddingY: 72, maxWidth: "lg", align: "center", gap: 18, radius: 14 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(1, 4) },
      { key: "limit", label: "How many", type: "slider", min: 2, max: 12, step: 1 },
      {
        key: "style",
        label: "Style",
        type: "segmented",
        options: [
          { value: "image", label: "Image" },
          { value: "text", label: "Text" },
        ],
      },
    ],
  },
  {
    type: "cards",
    label: "Cards",
    category: "Commerce",
    icon: CreditCard,
    description: "Flexible cards for services, features or categories.",
    props: {
      title: "What we offer",
      columns: 3,
      showButton: true,
      items: [
        { image: PLACEHOLDER, icon: "", title: "First card", description: "A short line about this.", price: "", buttonText: "Learn more", link: "" },
        { image: PLACEHOLDER_2, icon: "", title: "Second card", description: "A short line about this.", price: "", buttonText: "Learn more", link: "" },
        { image: PLACEHOLDER_3, icon: "", title: "Third card", description: "A short line about this.", price: "", buttonText: "Learn more", link: "" },
      ],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", gap: 20, radius: 14 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(1, 4) },
      { key: "showButton", label: "Show buttons", type: "switch" },
      {
        key: "items",
        label: "Cards",
        type: "repeater",
        itemLabel: "Card",
        addLabel: "Add card",
        titleKey: "title",
        defaultItem: { image: "", icon: "star", title: "New card", description: "", price: "", buttonText: "Learn more", link: "" },
        fields: [
          { key: "image", label: "Image", type: "image" },
          { key: "icon", label: "Icon (if no image)", type: "icon" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea", rows: 3 },
          { key: "price", label: "Price", type: "text", placeholder: "Rs. 2,500" },
          { key: "buttonText", label: "Button text", type: "text" },
          { key: "link", label: "Button link", type: "url" },
        ],
      },
    ],
  },
  {
    type: "pricing",
    label: "Pricing cards",
    category: "Commerce",
    icon: Banknote,
    description: "Packages with a highlighted option.",
    props: {
      title: "Our packages",
      items: [
        { name: "Basic", price: "Rs. 4,500", period: "per session", features: "One hour\nOne location\n10 edited photos", buttonText: "Book now", link: "/contact", featured: false },
        { name: "Standard", price: "Rs. 9,500", period: "per session", features: "Three hours\nTwo locations\n40 edited photos\nOnline gallery", buttonText: "Book now", link: "/contact", featured: true },
        { name: "Premium", price: "Rs. 18,000", period: "per session", features: "Full day\nUnlimited locations\n100 edited photos\nPrinted album", buttonText: "Book now", link: "/contact", featured: false },
      ],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", gap: 20, radius: 16 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      {
        key: "items",
        label: "Packages",
        type: "repeater",
        itemLabel: "Package",
        addLabel: "Add package",
        titleKey: "name",
        defaultItem: { name: "New package", price: "Rs. 0", period: "", features: "First thing\nSecond thing", buttonText: "Choose", link: "", featured: false },
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "price", label: "Price", type: "text" },
          { key: "period", label: "Period", type: "text" },
          { key: "features", label: "What's included", type: "textarea", rows: 5, help: "One item per line." },
          { key: "buttonText", label: "Button text", type: "text" },
          { key: "link", label: "Button link", type: "url" },
          { key: "featured", label: "Highlight this one", type: "switch" },
        ],
      },
    ],
  },
  {
    type: "shopping-cta",
    label: "Shopping CTA",
    category: "Commerce",
    icon: ShoppingBag,
    description: "A banner that pushes people to the shop.",
    props: {
      title: "Everything in stock, ready to ship",
      description: "Order before 3pm for same-day dispatch.",
      buttonText: "Browse the shop",
      buttonUrl: "/shop",
      image: PLACEHOLDER,
    },
    styles: { paddingY: 0, maxWidth: "lg", radius: 20, minHeight: 320 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea", rows: 3 },
      ...buttonFields(),
      { key: "image", label: "Background image", type: "image" },
    ],
  },

  /* ── Business ──────────────────────────────────────────────────────── */
  {
    type: "about",
    label: "About us",
    category: "Business",
    icon: Building2,
    description: "Your story, next to a photo.",
    props: {
      eyebrow: "Our story",
      title: "A small business with big standards",
      body: "We started in a spare room in 2019 with one sewing machine and a lot of stubbornness.\n\nToday we are a small team making clothes we are proud to put our name on, for customers across Sri Lanka.",
      image: PLACEHOLDER,
      layout: "image-right",
      buttonText: "",
      buttonUrl: "",
    },
    styles: { paddingY: 88, maxWidth: "lg", gap: 56, radius: 14 },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      { key: "body", label: "Story", type: "textarea", rows: 8, help: "Blank line = new paragraph." },
      { key: "image", label: "Image", type: "image" },
      {
        key: "layout",
        label: "Layout",
        type: "segmented",
        options: [
          { value: "image-right", label: "Image right" },
          { value: "image-left", label: "Image left" },
        ],
      },
      ...buttonFields(),
    ],
  },
  {
    type: "services",
    label: "Services",
    category: "Business",
    icon: Wrench,
    description: "A list of what you do, with prices.",
    props: {
      eyebrow: "Services",
      title: "What we do",
      columns: 2,
      items: [
        { icon: "scissors", title: "Custom tailoring", description: "Made to your measurements in 7–10 days.", price: "From Rs. 6,500" },
        { icon: "sparkles", title: "Alterations", description: "Quick adjustments while you wait.", price: "From Rs. 800" },
        { icon: "package", title: "Bulk orders", description: "Uniforms and event wear for teams.", price: "On request" },
        { icon: "heart", title: "Bridal", description: "A full fitting service for your day.", price: "On request" },
      ],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "left", gap: 20, radius: 14 },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(0, 3) },
      {
        key: "items",
        label: "Services",
        type: "repeater",
        itemLabel: "Service",
        addLabel: "Add service",
        titleKey: "title",
        defaultItem: { icon: "star", title: "New service", description: "", price: "" },
        fields: [
          { key: "icon", label: "Icon", type: "icon" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea", rows: 2 },
          { key: "price", label: "Price", type: "text" },
        ],
      },
    ],
  },
  {
    type: "team",
    label: "Team",
    category: "Business",
    icon: Users,
    description: "The people behind the business.",
    props: {
      title: "Meet the team",
      columns: 3,
      items: [
        { image: PLACEHOLDER, name: "Kavindu Perera", role: "Founder", bio: "" },
        { image: PLACEHOLDER_2, name: "Sanduni Rathnayake", role: "Head of production", bio: "" },
        { image: PLACEHOLDER_3, name: "Dilan Jayasuriya", role: "Customer care", bio: "" },
      ],
    },
    styles: { paddingY: 80, maxWidth: "lg", align: "center", gap: 24, radius: 999 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "columns", label: "Columns", type: "segmented", options: COLUMN_OPTIONS.slice(1, 4) },
      {
        key: "items",
        label: "People",
        type: "repeater",
        itemLabel: "Person",
        addLabel: "Add person",
        titleKey: "name",
        defaultItem: { image: "", name: "Name", role: "Role", bio: "" },
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "bio", label: "Short bio", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  {
    type: "contact",
    label: "Contact",
    category: "Business",
    icon: Contact,
    description: "A contact form beside your details.",
    props: {
      title: "Get in touch",
      description: "Send us a message and we will reply the same day.",
      showForm: true,
      showDetails: true,
      buttonText: "Send message",
      whatsappButton: true,
    },
    styles: { paddingY: 80, maxWidth: "lg", gap: 48, radius: 14 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea", rows: 3 },
      { key: "showForm", label: "Show contact form", type: "switch" },
      { key: "showDetails", label: "Show business details", type: "switch" },
      { key: "whatsappButton", label: "Show WhatsApp button", type: "switch" },
      { key: "buttonText", label: "Send button text", type: "text" },
    ],
  },
  {
    type: "location",
    label: "Location",
    category: "Business",
    icon: MapPin,
    description: "Where to find you, with a map.",
    props: { title: "Find us", address: "", mapQuery: "", showMap: true },
    styles: { paddingY: 72, maxWidth: "lg", radius: 14, gap: 32 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      { key: "address", label: "Address", type: "textarea", rows: 3, help: "Leave blank to use your business address." },
      { key: "mapQuery", label: "Map search", type: "text", placeholder: "Colombo 07, Sri Lanka" },
      { key: "showMap", label: "Show map", type: "switch" },
    ],
  },
  {
    type: "hours",
    label: "Business hours",
    category: "Business",
    icon: CalendarClock,
    description: "Your opening times, day by day.",
    props: {
      title: "Opening hours",
      items: [
        { day: "Monday – Friday", hours: "9:00 am – 6:00 pm" },
        { day: "Saturday", hours: "9:00 am – 4:00 pm" },
        { day: "Sunday", hours: "Closed" },
        { day: "Poya days", hours: "Closed" },
      ],
    },
    styles: { paddingY: 64, maxWidth: "md", align: "left", radius: 14 },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      {
        key: "items",
        label: "Hours",
        type: "repeater",
        itemLabel: "Row",
        addLabel: "Add row",
        titleKey: "day",
        defaultItem: { day: "Day", hours: "9:00 am – 5:00 pm" },
        fields: [
          { key: "day", label: "Day", type: "text" },
          { key: "hours", label: "Hours", type: "text" },
        ],
      },
    ],
  },
  {
    type: "social",
    label: "Social links",
    category: "Business",
    icon: Link2,
    description: "Send visitors to your social pages.",
    props: { title: "Follow us", style: "buttons" },
    styles: { paddingY: 56, maxWidth: "md", align: "center" },
    fields: [
      { key: "title", label: "Heading", type: "text" },
      {
        key: "style",
        label: "Style",
        type: "segmented",
        options: [
          { value: "buttons", label: "Buttons" },
          { value: "icons", label: "Icons" },
        ],
      },
    ],
  },

  /* ── Navigation (structural) ───────────────────────────────────────── */
  {
    type: "header",
    label: "Header",
    category: "Navigation",
    icon: PanelTop,
    structural: true,
    description: "Your site header — edited once, shown on every page.",
    props: {
      style: "simple",
      showLogo: true,
      logoText: "",
      sticky: true,
      showCart: true,
      showSearch: false,
      buttonText: "",
      buttonUrl: "",
    },
    styles: { paddingY: 16, maxWidth: "lg" },
    fields: [
      {
        key: "style",
        label: "Layout",
        type: "select",
        options: [
          { value: "simple", label: "Logo left, links right" },
          { value: "centered", label: "Centred logo" },
          { value: "split", label: "Links either side" },
          { value: "minimal", label: "Minimal" },
        ],
      },
      { key: "logoText", label: "Logo text", type: "text", help: "Leave blank to use your business name." },
      { key: "sticky", label: "Stick to top when scrolling", type: "switch" },
      { key: "showCart", label: "Show cart", type: "switch" },
      ...buttonFields("", "Header button"),
    ],
  },
  {
    type: "footer",
    label: "Footer",
    category: "Navigation",
    icon: PanelBottom,
    structural: true,
    description: "Your site footer — edited once, shown on every page.",
    props: {
      style: "columns",
      about: "",
      showNav: true,
      showContact: true,
      showSocial: true,
      copyright: "",
      poweredBy: true,
    },
    styles: { paddingY: 56, maxWidth: "lg" },
    fields: [
      {
        key: "style",
        label: "Layout",
        type: "select",
        options: [
          { value: "columns", label: "Columns" },
          { value: "simple", label: "Simple row" },
          { value: "centered", label: "Centred" },
        ],
      },
      { key: "about", label: "About text", type: "textarea", rows: 3 },
      { key: "showNav", label: "Show page links", type: "switch" },
      { key: "showContact", label: "Show contact details", type: "switch" },
      { key: "showSocial", label: "Show social links", type: "switch" },
      { key: "copyright", label: "Copyright line", type: "text" },
    ],
  },
  {
    type: "nav-menu",
    label: "Navigation menu",
    category: "Navigation",
    icon: Store,
    description: "A standalone row of page links.",
    props: { align: "center" },
    styles: { paddingY: 20, maxWidth: "lg", align: "center" },
    fields: [{ key: "align", label: "Alignment", type: "segmented", options: ALIGN_OPTIONS }],
  },
];

export const SECTION_MAP = new Map(SECTION_DEFS.map((d) => [d.type, d]));

export const SECTION_CATEGORIES: SectionCategory[] = [
  "Layout",
  "Content",
  "Marketing",
  "Media",
  "Commerce",
  "Business",
  "Navigation",
];

export function getSectionDef(type: string) {
  return SECTION_MAP.get(type);
}

export function sectionLabel(type: string) {
  return SECTION_MAP.get(type)?.label ?? type;
}

/** Builds a fresh node (with new ids all the way down) for a section type. */
export function createSection(type: string, overrides?: Partial<SectionNode>): SectionNode {
  const def = SECTION_MAP.get(type);
  return {
    id: uid("s"),
    type,
    props: structuredClone(def?.props ?? {}),
    styles: structuredClone(def?.styles ?? {}),
    responsiveStyles: {},
    children: def?.container ? [] : undefined,
    ...overrides,
  };
}

/** Deep-clones a node and re-keys every id — used by duplicate and by templates. */
export function cloneSection(node: SectionNode): SectionNode {
  return {
    ...structuredClone(node),
    id: uid("s"),
    children: node.children?.map(cloneSection),
  };
}

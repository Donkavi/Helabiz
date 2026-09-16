/**
 * Plain data shared by client and server.
 *
 * These live outside `services/` on purpose: client components need them, and
 * importing them from a service would drag Mongoose into the browser bundle.
 */

export const SRI_LANKA_DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota",
  "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Monaragala", "Ratnapura", "Kegalle",
] as const;

export const BUSINESS_TYPES = [
  { value: "clothing", label: "Clothing & fashion" },
  { value: "beauty", label: "Beauty & cosmetics" },
  { value: "food", label: "Food & bakery" },
  { value: "restaurant", label: "Restaurant & café" },
  { value: "electronics", label: "Electronics & mobile" },
  { value: "grocery", label: "Grocery & essentials" },
  { value: "handmade", label: "Handmade & crafts" },
  { value: "services", label: "Services" },
  { value: "retail", label: "General retail" },
  { value: "other", label: "Something else" },
];

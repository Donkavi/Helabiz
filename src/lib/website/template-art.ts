/**
 * The placeholder artwork that belongs to each template category.
 *
 * Kept apart from `demo-data.ts` so template cards — which render in the
 * browser — can show pictures without pulling the whole demo catalogue into
 * the client bundle.
 */
const P = (name: string) => `/placeholders/${name}.svg`;

/** On-theme pictures per category. Cards and previews cycle through these. */
export const TEMPLATE_ART: Record<string, string[]> = {
  Fashion: ["fashion-1", "fashion-2", "fashion-3", "fashion-4"].map(P),
  Bakery: ["bakery-1", "bakery-2", "bakery-3", "bakery-4"].map(P),
  Restaurant: ["food-1", "food-2", "food-3", "food-4"].map(P),
  Beauty: ["beauty-1", "beauty-2", "beauty-3", "beauty-4"].map(P),
  Electronics: ["tech-1", "tech-2", "tech-3", "tech-4"].map(P),
  Photography: ["photo-1", "photo-2", "photo-3", "photo-4"].map(P),
  Services: ["service-1", "service-2", "service-3", "service-4"].map(P),
  "Home Business": ["home-1", "home-2", "home-3", "home-4"].map(P),
};

/** Faces, kept out of the product pools — one where a product belongs reads as a bug. */
export const PEOPLE_ART = ["person-1", "person-2", "person-3"].map(P);

/** The family whose wide patterned backdrops suit a category. */
const SCENE_FAMILY: Record<string, string> = {
  Fashion: "fashion",
  Bakery: "bakery",
  Restaurant: "food",
  Beauty: "beauty",
  Electronics: "tech",
  Photography: "photo",
  Services: "service",
  "Home Business": "home",
};

export function artFor(category: string) {
  return TEMPLATE_ART[category] ?? TEMPLATE_ART.Fashion;
}

export function scenesFor(category: string) {
  const family = SCENE_FAMILY[category] ?? "fashion";
  return [`/placeholders/scene-${family}-1.svg`, `/placeholders/scene-${family}-2.svg`];
}

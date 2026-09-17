/**
 * Generates the placeholder artwork in `public/placeholders/`.
 *
 *   node scripts/generate-placeholders.mjs
 *
 * These stand in for photographs the business has not uploaded yet — in the
 * builder, and in the template previews on the marketing site. They are flat
 * vector illustrations rather than grey boxes: a bakery template should look
 * like a bakery before anyone has uploaded a single photo.
 *
 * Each file is a subject drawn in a 400x400 box, centred on a background that
 * varies by index, so a gallery of six never shows the same picture twice.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "placeholders");

const W = 1200;
const H = 900;

/** Background, mid, subject, and highlight tones for each family of images. */
const FAMILIES = {
  bakery: { bg1: "#fdf4e6", bg2: "#f2debb", soft: "#dcae6a", ink: "#9b6a2f", accent: "#c8802f" },
  food: { bg1: "#fbeee7", bg2: "#f1d8c6", soft: "#d59470", ink: "#8d4a28", accent: "#bd5630" },
  fashion: { bg1: "#f4f0ea", bg2: "#ded3c5", soft: "#b49e85", ink: "#5f4e3c", accent: "#96785a" },
  beauty: { bg1: "#fbeef1", bg2: "#f0d5dd", soft: "#d698ab", ink: "#8d4a62", accent: "#bb6584" },
  tech: { bg1: "#eef2f6", bg2: "#d4dde7", soft: "#8ea3b8", ink: "#3d5165", accent: "#4f7fb5" },
  photo: { bg1: "#f0f0ef", bg2: "#d6d6d4", soft: "#9d9d99", ink: "#4a4a47", accent: "#7a7a75" },
  service: { bg1: "#ecf1f4", bg2: "#d1dde3", soft: "#8aa6b2", ink: "#3b5764", accent: "#4d8298" },
  home: { bg1: "#eef4ee", bg2: "#d3e3d5", soft: "#8bb493", ink: "#3f6547", accent: "#548f60" },
};

/* ── Backgrounds ──────────────────────────────────────────────────────── */

function background(c, variant) {
  const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg1}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;

  if (variant === 1) {
    return (
      grad +
      `<circle cx="${W - 180}" cy="150" r="230" fill="${c.soft}" opacity=".22"/>` +
      `<circle cx="140" cy="${H - 120}" r="260" fill="${c.soft}" opacity=".16"/>`
    );
  }
  if (variant === 2) {
    return (
      grad +
      `<rect y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="${c.soft}" opacity=".2"/>` +
      `<rect y="${H * 0.74}" width="${W}" height="${H * 0.26}" fill="${c.soft}" opacity=".18"/>`
    );
  }
  return (
    grad +
    `<circle cx="${W / 2}" cy="${H / 2}" r="340" fill="${c.soft}" opacity=".16"/>` +
    `<circle cx="${W / 2}" cy="${H / 2}" r="250" fill="${c.soft}" opacity=".14"/>`
  );
}

/* ── Subjects, each drawn inside a 400x400 box ────────────────────────── */

const SUBJECTS = {
  cake: (c) => `
    <rect x="70" y="326" width="260" height="18" rx="9" fill="${c.soft}"/>
    <rect x="88" y="212" width="224" height="114" rx="16" fill="${c.ink}"/>
    <rect x="88" y="200" width="224" height="24" rx="12" fill="${c.soft}"/>
    <rect x="112" y="150" width="176" height="58" rx="14" fill="${c.accent}"/>
    <rect x="112" y="142" width="176" height="20" rx="10" fill="${c.soft}"/>
    <rect x="194" y="96" width="12" height="50" rx="6" fill="${c.soft}"/>
    <path d="M200 62c22 24 18 44 0 50-18-6-22-26 0-50z" fill="${c.accent}"/>`,

  loaf: (c) => `
    <path d="M62 262c0-66 46-110 138-110s138 44 138 110v18a16 16 0 0 1-16 16H78a16 16 0 0 1-16-16z" fill="${c.ink}"/>
    <g stroke="${c.soft}" stroke-width="13" stroke-linecap="round" opacity=".9">
      <path d="M118 208l28-30"/><path d="M180 200l28-30"/><path d="M242 208l28-30"/>
    </g>
    <rect x="52" y="304" width="296" height="16" rx="8" fill="${c.soft}"/>`,

  croissant: (c) => `
    <path d="M92 274c24-92 128-136 228-108" fill="none" stroke="${c.ink}" stroke-width="58" stroke-linecap="round"/>
    <path d="M120 246c30-56 96-84 174-72" fill="none" stroke="${c.soft}" stroke-width="14" stroke-linecap="round" opacity=".8"/>
    <circle cx="92" cy="274" r="14" fill="${c.accent}"/>
    <circle cx="320" cy="166" r="14" fill="${c.accent}"/>`,

  cupcake: (c) => `
    <path d="M124 230h152l-20 118a18 18 0 0 1-18 15h-76a18 18 0 0 1-18-15z" fill="${c.ink}"/>
    <g fill="${c.accent}">
      <circle cx="160" cy="200" r="42"/><circle cx="240" cy="200" r="42"/><circle cx="200" cy="170" r="46"/>
    </g>
    <circle cx="200" cy="108" r="15" fill="${c.soft}"/>`,

  plate: (c) => `
    <circle cx="200" cy="204" r="148" fill="#ffffff" opacity=".85"/>
    <circle cx="200" cy="204" r="118" fill="${c.soft}" opacity=".3"/>
    <circle cx="200" cy="204" r="54" fill="#ffffff" opacity=".92"/>
    <circle cx="146" cy="142" r="28" fill="${c.accent}"/>
    <circle cx="258" cy="146" r="25" fill="${c.ink}"/>
    <circle cx="270" cy="252" r="28" fill="${c.accent}" opacity=".85"/>
    <circle cx="136" cy="256" r="23" fill="${c.ink}" opacity=".75"/>`,

  bowl: (c) => `
    <path d="M68 220h264c0 80-59 134-132 134S68 300 68 220z" fill="${c.ink}"/>
    <rect x="52" y="204" width="296" height="26" rx="13" fill="${c.soft}"/>
    <g stroke="${c.soft}" stroke-width="11" fill="none" stroke-linecap="round" opacity=".85">
      <path d="M158 162c18-16 0-34 0-54"/><path d="M200 152c18-16 0-34 0-54"/><path d="M242 162c18-16 0-34 0-54"/>
    </g>`,

  cup: (c) => `
    <path d="M94 168h182v90a74 74 0 0 1-74 74h-34a74 74 0 0 1-74-74z" fill="${c.ink}"/>
    <path d="M278 194h24a40 40 0 0 1 0 80h-24" fill="none" stroke="${c.soft}" stroke-width="18" stroke-linecap="round"/>
    <rect x="76" y="336" width="224" height="16" rx="8" fill="${c.soft}"/>
    <g stroke="${c.soft}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8">
      <path d="M164 128c16-14 0-30 0-46"/><path d="M212 128c16-14 0-30 0-46"/>
    </g>`,

  dress: (c) => `
    <path d="M160 88l40 26 40-26 38 58-30 20 28 148q0 16-18 16H144q-18 0-18-16l28-148-30-20z" fill="${c.ink}"/>
    <path d="M176 186h48" stroke="${c.soft}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="200" cy="252" r="9" fill="${c.soft}"/>`,

  tshirt: (c) => `
    <path d="M152 92l-42 24-26 62 44 22 10-22v136q0 12 12 12h100q12 0 12-12V178l10 22 44-22-26-62-42-24q-48 34-96 0z" fill="${c.ink}"/>
    <path d="M152 92q48 34 96 0" fill="none" stroke="${c.soft}" stroke-width="10"/>`,

  tote: (c) => `
    <rect x="110" y="164" width="180" height="170" rx="16" fill="${c.ink}"/>
    <path d="M154 164v-26a46 46 0 0 1 92 0v26" fill="none" stroke="${c.soft}" stroke-width="17" stroke-linecap="round"/>
    <rect x="162" y="226" width="76" height="14" rx="7" fill="${c.accent}"/>
    <rect x="176" y="258" width="48" height="10" rx="5" fill="${c.soft}" opacity=".7"/>`,

  serum: (c) => `
    <rect x="174" y="66" width="52" height="46" rx="12" fill="${c.soft}"/>
    <rect x="186" y="106" width="28" height="30" fill="${c.ink}"/>
    <path d="M138 150h124a22 22 0 0 1 22 22v140a26 26 0 0 1-26 26H142a26 26 0 0 1-26-26V172a22 22 0 0 1 22-22z" fill="${c.ink}"/>
    <rect x="148" y="200" width="104" height="76" rx="12" fill="${c.bg1}" opacity=".5"/>`,

  flower: (c) => `
    <g fill="${c.accent}" opacity=".92">
      <ellipse cx="200" cy="118" rx="36" ry="56"/>
      <ellipse cx="200" cy="230" rx="36" ry="56"/>
      <ellipse cx="144" cy="174" rx="56" ry="36"/>
      <ellipse cx="256" cy="174" rx="56" ry="36"/>
    </g>
    <circle cx="200" cy="174" r="36" fill="${c.soft}"/>
    <path d="M200 228v116" stroke="${c.ink}" stroke-width="13" stroke-linecap="round"/>
    <path d="M200 296q-44-8-52-46 44-4 52 46z" fill="${c.ink}" opacity=".8"/>`,

  laptop: (c) => `
    <rect x="110" y="122" width="180" height="120" rx="12" fill="${c.ink}"/>
    <rect x="126" y="138" width="148" height="88" rx="6" fill="${c.bg1}" opacity=".55"/>
    <path d="M82 254h236l24 38a10 10 0 0 1-9 15H67a10 10 0 0 1-9-15z" fill="${c.soft}"/>
    <rect x="172" y="272" width="56" height="9" rx="4" fill="${c.ink}" opacity=".45"/>`,

  headphones: (c) => `
    <path d="M100 250v-28a100 100 0 0 1 200 0v28" fill="none" stroke="${c.ink}" stroke-width="24" stroke-linecap="round"/>
    <rect x="72" y="238" width="56" height="92" rx="26" fill="${c.accent}"/>
    <rect x="272" y="238" width="56" height="92" rx="26" fill="${c.accent}"/>`,

  phone: (c) => `
    <rect x="138" y="72" width="124" height="256" rx="26" fill="${c.ink}"/>
    <rect x="152" y="98" width="96" height="192" rx="10" fill="${c.bg1}" opacity=".55"/>
    <rect x="182" y="302" width="36" height="9" rx="4" fill="${c.soft}"/>
    <rect x="186" y="84" width="28" height="6" rx="3" fill="${c.soft}"/>`,

  camera: (c) => `
    <path d="M94 152h46l20-30h80l20 30h46a26 26 0 0 1 26 26v122a26 26 0 0 1-26 26H94a26 26 0 0 1-26-26V178a26 26 0 0 1 26-26z" fill="${c.ink}"/>
    <circle cx="200" cy="240" r="60" fill="${c.soft}"/>
    <circle cx="200" cy="240" r="33" fill="${c.bg1}" opacity=".7"/>
    <circle cx="290" cy="186" r="11" fill="${c.accent}"/>`,

  frame: (c) => `
    <rect x="82" y="92" width="236" height="212" rx="12" fill="none" stroke="${c.ink}" stroke-width="19"/>
    <path d="M104 272l62-72 44 46 34-32 52 58z" fill="${c.soft}"/>
    <circle cx="146" cy="150" r="21" fill="${c.accent}"/>`,

  film: (c) => `
    <rect x="62" y="126" width="276" height="148" rx="10" fill="${c.ink}"/>
    <rect x="98" y="156" width="204" height="88" rx="5" fill="${c.bg1}" opacity=".55"/>
    <g fill="${c.bg1}" opacity=".8">
      ${[0, 1, 2, 3, 4, 5]
        .map((i) => `<rect x="${78 + i * 42}" y="136" width="20" height="12" rx="3"/><rect x="${78 + i * 42}" y="252" width="20" height="12" rx="3"/>`)
        .join("")}
    </g>`,

  wrench: (c) => `
    <path d="M276 84a70 70 0 0 0-84 88l-94 94a22 22 0 0 0 0 31l9 9a22 22 0 0 0 31 0l94-94a70 70 0 0 0 88-84l-50 50-32-8-8-32z" fill="${c.ink}"/>
    <circle cx="124" cy="276" r="11" fill="${c.bg1}" opacity=".6"/>`,

  house: (c) => `
    <path d="M200 82l134 110v146a18 18 0 0 1-18 18H84a18 18 0 0 1-18-18V192z" fill="${c.ink}"/>
    <rect x="168" y="250" width="64" height="106" rx="7" fill="${c.soft}"/>
    <rect x="102" y="218" width="48" height="46" rx="7" fill="${c.bg1}" opacity=".55"/>
    <rect x="250" y="218" width="48" height="46" rx="7" fill="${c.bg1}" opacity=".55"/>`,

  gear: (c) => {
    const teeth = Array.from({ length: 8 }, (_, i) =>
      `<rect x="182" y="44" width="36" height="58" rx="8" fill="${c.ink}" transform="rotate(${i * 45} 200 200)"/>`,
    ).join("");
    return `
    ${teeth}
    <circle cx="200" cy="200" r="112" fill="${c.ink}"/>
    <circle cx="200" cy="200" r="52" fill="${c.bg1}" opacity=".65"/>
    <circle cx="200" cy="200" r="52" fill="none" stroke="${c.soft}" stroke-width="12"/>`;
  },

  candle: (c) => `
    <rect x="144" y="176" width="112" height="162" rx="18" fill="${c.ink}"/>
    <ellipse cx="200" cy="176" rx="56" ry="17" fill="${c.soft}"/>
    <rect x="195" y="128" width="10" height="42" rx="5" fill="${c.soft}"/>
    <path d="M200 70c28 28 24 54 0 62-24-8-28-34 0-62z" fill="${c.accent}"/>
    <rect x="164" y="244" width="72" height="12" rx="6" fill="${c.soft}" opacity=".6"/>`,

  soap: (c) => `
    <rect x="102" y="200" width="196" height="124" rx="28" fill="${c.ink}"/>
    <rect x="126" y="178" width="148" height="44" rx="22" fill="${c.soft}"/>
    <g fill="${c.accent}" opacity=".85">
      <circle cx="146" cy="126" r="19"/><circle cx="194" cy="98" r="13"/><circle cx="238" cy="128" r="24"/>
    </g>`,

  gift: (c) => `
    <rect x="110" y="212" width="180" height="128" rx="12" fill="${c.ink}"/>
    <rect x="90" y="170" width="220" height="46" rx="12" fill="${c.soft}"/>
    <rect x="184" y="170" width="32" height="170" fill="${c.accent}"/>
    <path d="M200 170c-42 0-60-16-60-34s30-20 60 34c30-54 60-52 60-34s-18 34-60 34z" fill="${c.accent}"/>`,

  aperture: (c) => `
    <circle cx="200" cy="200" r="126" fill="none" stroke="${c.ink}" stroke-width="20"/>
    <polygon points="200,106 281,153 281,247 200,294 119,247 119,153" fill="${c.soft}" opacity=".55"/>
    <g stroke="${c.ink}" stroke-width="13" stroke-linecap="round" opacity=".9">
      <path d="M200 106L281 247"/><path d="M281 153L200 294"/><path d="M281 247L119 247"/>
      <path d="M200 294L119 153"/><path d="M119 247L200 106"/><path d="M119 153L281 153"/>
    </g>
    <circle cx="200" cy="200" r="30" fill="${c.accent}"/>`,

  avatar: (c) => `
    <circle cx="200" cy="158" r="70" fill="${c.ink}"/>
    <path d="M70 350c0-66 58-112 130-112s130 46 130 112z" fill="${c.ink}" opacity=".85"/>
    <circle cx="200" cy="158" r="70" fill="none" stroke="${c.soft}" stroke-width="8"/>`,
};

/* ── Scenes ───────────────────────────────────────────────────────────── */

/** Deterministic PRNG, so regenerating the files never changes them. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SW = 1600;
const SH = 900;

/**
 * A wide backdrop: the family's motifs scattered at low contrast.
 *
 * Full-bleed slots — a hero with a background layout, a slider slide — crop
 * hard and sit under text. A single centred subject blown up to fill one looks
 * like a mistake, so those get a pattern that reads the same at any crop.
 */
function scene(c, subjects, seed) {
  const rand = rng(seed);
  const cols = 6;
  const rows = 4;
  const cw = SW / cols;
  const ch = SH / rows;
  const motifs = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const subject = subjects[(row * cols + col + (row % 2)) % subjects.length];
      const scale = 0.2 + rand() * 0.07;
      const size = 400 * scale;
      const cx = col * cw + cw / 2 + (rand() - 0.5) * cw * 0.34;
      const cy = row * ch + ch / 2 + (rand() - 0.5) * ch * 0.34;
      const rot = (rand() - 0.5) * 34;
      motifs.push(
        `<g transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)} 200 200)">${SUBJECTS[subject](c).replace(/\s+/g, " ").trim()}</g>`,
      );
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" width="${SW}" height="${SH}" role="img" aria-label="Decorative backdrop">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg1}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient></defs>` +
    `<rect width="${SW}" height="${SH}" fill="url(#g)"/>` +
    `<circle cx="${SW - 200}" cy="120" r="300" fill="${c.soft}" opacity=".18"/>` +
    `<circle cx="180" cy="${SH - 100}" r="320" fill="${c.soft}" opacity=".14"/>` +
    `<g opacity=".22">${motifs.join("")}</g>` +
    `</svg>
`
  );
}

const SCENES = [
  ["bakery", ["cake", "croissant", "cupcake", "loaf"]],
  ["food", ["plate", "bowl", "cup", "loaf"]],
  ["fashion", ["dress", "tshirt", "tote", "gift"]],
  ["beauty", ["serum", "flower", "soap", "gift"]],
  ["tech", ["laptop", "headphones", "phone", "gear"]],
  ["photo", ["camera", "frame", "film", "aperture"]],
  ["service", ["wrench", "house", "gear", "laptop"]],
  ["home", ["candle", "soap", "gift", "flower"]],
];

/* ── Files ────────────────────────────────────────────────────────────── */

// The `-1` names are the ones templates and the section registry already
// reference, so they keep their meaning and only their artwork improves.
const FILES = [
  ["bakery-1", "bakery", "cake", 1],
  ["bakery-2", "bakery", "loaf", 2],
  ["bakery-3", "bakery", "croissant", 0],
  ["bakery-4", "bakery", "cupcake", 1],
  ["food-1", "food", "plate", 2],
  ["food-2", "food", "bowl", 0],
  ["food-3", "food", "cup", 1],
  ["fashion-1", "fashion", "dress", 2],
  ["fashion-2", "fashion", "tshirt", 0],
  ["fashion-3", "fashion", "tote", 1],
  ["beauty-1", "beauty", "serum", 0],
  ["beauty-2", "beauty", "flower", 1],
  ["beauty-3", "beauty", "soap", 2],
  ["tech-1", "tech", "laptop", 1],
  ["tech-2", "tech", "headphones", 2],
  ["tech-3", "tech", "phone", 0],
  ["photo-1", "photo", "camera", 0],
  ["photo-2", "photo", "frame", 1],
  ["photo-3", "photo", "film", 2],
  ["service-1", "service", "wrench", 1],
  ["service-2", "service", "house", 2],
  ["service-3", "service", "gear", 0],
  ["home-1", "home", "candle", 0],
  ["home-2", "home", "soap", 1],
  ["home-3", "home", "gift", 2],
  // A fourth for each family, so a six-up gallery never repeats a picture.
  ["fashion-4", "fashion", "gift", 0],
  ["food-4", "food", "loaf", 1],
  ["beauty-4", "beauty", "gift", 2],
  ["tech-4", "tech", "gear", 2],
  ["photo-4", "photo", "aperture", 0],
  ["service-4", "service", "laptop", 0],
  ["home-4", "home", "flower", 1],
  ["person-1", "fashion", "avatar", 1],
  ["person-2", "beauty", "avatar", 2],
  ["person-3", "service", "avatar", 0],
];

// The subject is drawn in a 400x400 box and scaled to fill most of the canvas
// height. Large enough to read as the picture rather than an icon on a field,
// small enough to survive the square crop a product card applies.
const SCALE = (H * 0.78) / 400;
const TX = W / 2 - (400 * SCALE) / 2;
const TY = H / 2 - (400 * SCALE) / 2 - 10;

mkdirSync(OUT, { recursive: true });

for (const [name, family, subject, variant] of FILES) {
  const c = FAMILIES[family];
  const art = SUBJECTS[subject](c).replace(/\s+/g, " ").trim();

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${subject} illustration">` +
    background(c, variant) +
    `<g transform="translate(${TX.toFixed(1)} ${TY.toFixed(1)}) scale(${SCALE.toFixed(4)})">${art}</g>` +
    `</svg>`;

  writeFileSync(path.join(OUT, `${name}.svg`), svg + "\n", "utf8");
}

for (const [family, subjects] of SCENES) {
  const c = FAMILIES[family];
  for (const variant of [1, 2]) {
    writeFileSync(path.join(OUT, `scene-${family}-${variant}.svg`), scene(c, subjects, family.length * 977 + variant * 31), "utf8");
  }
}

console.log(`Wrote ${FILES.length + SCENES.length * 2} placeholders to public/placeholders`);

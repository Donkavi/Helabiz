/**
 * Draws the Helabiz mascot sheets for `page-mascot`.
 *
 *   node scripts/generate-mascot.mjs        (npm run mascot)
 *
 * The component expects two 3x3 sheets read row by row, and it is strict about
 * the order — see node_modules/page-mascot/dist/mascot.js:
 *
 *   directions   up-left    up       up-right
 *                left       center   right
 *                down-left  down     down-right
 *
 *   reactions    blink      heart    sparkle
 *                surprised  wink     bashful
 *                sleepy     dizzy    delighted
 *
 * The character is the storefront mark from the logo wearing a striped awning,
 * so the thing that follows your cursor on the coming-soon page is the brand
 * rather than a stock animal. Both sheets are drawn from one base so the head
 * never jumps when the component crossfades between them.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "mascots");

const CELL = 256;

const JADE = "#14776B";
const CREAM = "#FBF7EF";
const INK = "#11201D";
const BLUSH = "#F0907F";
const HEART = "#E0435C";
const GOLD = "#F0B429";

/* ── Pieces ───────────────────────────────────────────────────────────── */

const EYE_X = 96;
const EYE_X2 = 160;
const EYE_Y = 150;

/** An open eye, with the pupil pushed towards wherever the mascot is looking. */
function eyeOpen(cx, px, py, { wide = false } = {}) {
  const rx = wide ? 22 : 20;
  const ry = wide ? 25 : 23;
  return `
    <ellipse cx="${cx}" cy="${EYE_Y}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <circle cx="${cx + px}" cy="${EYE_Y + py}" r="${wide ? 8 : 10}" fill="${INK}"/>
    <circle cx="${cx + px - 3}" cy="${EYE_Y + py - 4}" r="3" fill="#fff"/>`;
}

const eyeClosed = (cx) =>
  `<path d="M${cx - 15} ${EYE_Y - 2}q15 13 30 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;

const eyeHappy = (cx) =>
  `<path d="M${cx - 15} ${EYE_Y + 6}q15 -18 30 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;

const eyeHeart = (cx) =>
  `<path d="M${cx} ${EYE_Y + 16}c-20-14-24-24-24-31a12 12 0 0 1 24-5 12 12 0 0 1 24 5c0 7-4 17-24 31z" fill="${HEART}"/>`;

const eyeStar = (cx) =>
  `<path d="M${cx} ${EYE_Y - 22}l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="${GOLD}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;

const eyeSleepy = (cx) => `
    <path d="M${cx - 17} ${EYE_Y}a17 17 0 0 0 34 0z" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <path d="M${cx - 18} ${EYE_Y}h36" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;

const eyeSpiral = (cx) => `
    <circle cx="${cx}" cy="${EYE_Y}" r="18" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <path d="M${cx} ${EYE_Y}m0 -4a4 4 0 1 1 -4 4a8 8 0 1 0 8 -8a12 12 0 1 0 -12 12" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;

const MOUTHS = {
  smile: `<path d="M110 186q18 16 36 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  small: `<ellipse cx="128" cy="188" rx="9" ry="11" fill="${INK}"/>`,
  open: `<path d="M104 180a24 24 0 0 0 48 0z" fill="${INK}"/>`,
  wide: `<path d="M100 178a28 28 0 0 0 56 0z" fill="${INK}"/><path d="M118 198a12 12 0 0 0 20 0z" fill="${BLUSH}"/>`,
  wavy: `<path d="M106 186q11 -10 22 0t22 0" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`,
  shy: `<path d="M114 186q14 11 28 0" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`,
};

const blush = `
  <ellipse cx="80" cy="176" rx="13" ry="8" fill="${BLUSH}" opacity=".55"/>
  <ellipse cx="176" cy="176" rx="13" ry="8" fill="${BLUSH}" opacity=".55"/>`;

const zzz = `
  <g fill="${JADE}" font-family="Segoe UI, sans-serif" font-weight="700">
    <text x="206" y="146" font-size="22">z</text>
    <text x="222" y="120" font-size="30">z</text>
  </g>`;

const sparkles = `
  <g fill="${GOLD}" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M44 74l5 11 11 5-11 5-5 11-5-11-11-5 11-5z"/>
    <path d="M216 96l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/>
  </g>`;

/**
 * The head: the logo's awning-and-legs storefront, rounded into a face.
 * `dx`/`dy` lean the whole head a little, which sells the direction more than
 * moving the pupils alone.
 */
function head(inner, dx = 0, dy = 0) {
  return `
  <g transform="translate(${dx} ${dy})">
    <ellipse cx="128" cy="236" rx="72" ry="12" fill="${INK}" opacity=".12"/>

    <!-- body -->
    <rect x="40" y="86" width="176" height="140" rx="46" fill="${CREAM}" stroke="${INK}" stroke-width="6"/>

    <!-- awning, the mark from the logo -->
    <path d="M34 86a94 94 0 0 1 188 0z" fill="${JADE}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <g fill="${CREAM}" opacity=".92">
      <path d="M62 52a94 94 0 0 0-28 34h26a94 94 0 0 1 16-30z"/>
      <path d="M128 38a94 94 0 0 0-22 3 94 94 0 0 0-10 45h32z"/>
      <path d="M182 56a94 94 0 0 1 22 30h18a94 94 0 0 0-26-36z"/>
    </g>
    <path d="M34 86h188" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="128" cy="30" r="9" fill="${JADE}" stroke="${INK}" stroke-width="5"/>

    <!-- legs -->
    <path d="M78 226v14M178 226v14" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>

    ${inner}
  </g>`;
}

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${CELL}" height="${CELL}">${body}</svg>`;
}

/* ── The nine directions ──────────────────────────────────────────────── */

// Pupil travel, then a smaller head lean in the same direction.
const LOOK = {
  "up-left": [-10, -9],
  up: [0, -10],
  "up-right": [10, -9],
  left: [-12, 0],
  center: [0, 0],
  right: [12, 0],
  "down-left": [-10, 9],
  down: [0, 10],
  "down-right": [10, 9],
};

const DIRECTION_ORDER = [
  "up-left", "up", "up-right",
  "left", "center", "right",
  "down-left", "down", "down-right",
];

function directionCell(name) {
  const [px, py] = LOOK[name];
  const inner = `${eyeOpen(EYE_X, px, py)}${eyeOpen(EYE_X2, px, py)}${MOUTHS.smile}`;
  return svg(head(inner, px * 0.55, py * 0.55));
}

/* ── The nine reactions ───────────────────────────────────────────────── */

const REACTION_ORDER = [
  "blink", "heart", "sparkle",
  "surprised", "wink", "bashful",
  "sleepy", "dizzy", "delighted",
];

const REACTIONS = {
  blink: () => head(`${eyeClosed(EYE_X)}${eyeClosed(EYE_X2)}${MOUTHS.smile}`),
  heart: () => head(`${eyeHeart(EYE_X)}${eyeHeart(EYE_X2)}${MOUTHS.open}${blush}`),
  sparkle: () => `${head(`${eyeStar(EYE_X)}${eyeStar(EYE_X2)}${MOUTHS.open}`)}${sparkles}`,
  surprised: () =>
    head(`${eyeOpen(EYE_X, 0, 0, { wide: true })}${eyeOpen(EYE_X2, 0, 0, { wide: true })}${MOUTHS.small}`),
  wink: () => head(`${eyeClosed(EYE_X)}${eyeOpen(EYE_X2, 0, 2)}${MOUTHS.smile}${blush}`),
  bashful: () => head(`${eyeHappy(EYE_X)}${eyeHappy(EYE_X2)}${MOUTHS.shy}${blush}`),
  sleepy: () => `${head(`${eyeSleepy(EYE_X)}${eyeSleepy(EYE_X2)}${MOUTHS.small}`)}${zzz}`,
  dizzy: () => head(`${eyeSpiral(EYE_X)}${eyeSpiral(EYE_X2)}${MOUTHS.wavy}`),
  delighted: () => `${head(`${eyeHappy(EYE_X)}${eyeHappy(EYE_X2)}${MOUTHS.wide}${blush}`)}${sparkles}`,
};

/* ── Sheets ───────────────────────────────────────────────────────────── */

async function sheet(cells, file) {
  const tiles = await Promise.all(
    cells.map(async (markup, i) => ({
      input: await sharp(Buffer.from(markup)).png().toBuffer(),
      left: (i % 3) * CELL,
      top: Math.floor(i / 3) * CELL,
    })),
  );

  await sharp({
    create: { width: CELL * 3, height: CELL * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(tiles)
    .webp({ quality: 92 })
    .toFile(path.join(OUT, file));

  console.log(`  ${file}  (${CELL * 3}x${CELL * 3})`);
}

mkdirSync(OUT, { recursive: true });
console.log("Drawing the Helabiz mascot...");

await sheet(DIRECTION_ORDER.map(directionCell), "helabiz-directions.webp");
await sheet(REACTION_ORDER.map((name) => svg(REACTIONS[name]())), "helabiz-reactions.webp");

console.log("Done. Two sheets in public/mascots");

# Helabiz

A business platform for Sri Lankan small businesses. Two halves that share one database:

- **Business management** — products, orders, customers, inventory, expenses, invoices and reports.
- **A no-code website builder** — drag-and-drop pages, eight designed themes, a cart and a Sri Lankan-friendly checkout.

An order placed on a published website becomes a real order, a real customer and a real stock movement in the
dashboard. Products added in the dashboard appear on the website immediately. Nothing is entered twice.

---

## Running it

```bash
npm install
npm run seed     # creates a demo business with products, orders and a published website
npm run dev      # http://localhost:3000
```

Sign in with **demo@helabiz.lk** / **helabiz123**, or create your own account at `/sign-up`.

The demo website is published at <http://localhost:3000/site/kavi-fashion>.

### The database

`MONGODB_URI` is optional in development. Left blank, Helabiz starts an **embedded MongoDB** on first use, so the app
runs with no setup. Its files live in a folder under your OS temp directory keyed by project path, so seeded data
survives restarts. `npm run db:reset` deletes it.

Point `MONGODB_URI` at MongoDB Atlas or a local `mongod` whenever you want a real server. It is **required** in
production — the app refuses to start without it rather than silently using a throwaway database.

`MONGODB_DB` decides which database on that server Helabiz uses, regardless of the database named in the URI's
path. On a shared cluster, leave it as `helabiz` so nothing mixes with another app's collections.

> Only one `next dev` can hold port 3000. If a previous one is still running it keeps serving the old connection,
> so stop it before switching databases — the new process will otherwise start on port 3001 and exit.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run seed` | Reset and recreate the demo business |
| `npm run db:reset` | Delete the embedded development database |
| `npm run placeholders` | Redraw the placeholder artwork in `public/placeholders` |
| `npm run mascot` | Redraw the mascot sprite sheets in `public/mascots` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

### Environment

Copy `.env.example` to `.env.local`. Everything except `AUTH_SECRET` has a working default.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Connection string. Blank in development uses the embedded database. |
| `MONGODB_DB` | Database name, `helabiz` by default. This **overrides** whatever database the URI's path names, so pointing at a shared cluster keeps Helabiz's collections in their own database. |
| `AUTH_SECRET` | Session signing key. Generate with `npx auth secret`. |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app. |
| `NEXT_PUBLIC_SITE_DOMAIN` | Root domain published websites hang off (`helabiz.lk`). |
| `COMING_SOON` | `"true"` serves the launch teaser instead of the site. See below. |
| `COMING_SOON_BYPASS` | The secret that gets you past the teaser while it is up. |
| `NEXT_PUBLIC_FACEBOOK_URL` / `NEXT_PUBLIC_INSTAGRAM_URL` | Shown on the teaser. Blank leaves the buttons off. |

### The launch gate

`COMING_SOON="true"` makes `src/proxy.ts` rewrite every request to `/coming-soon` —
marketing pages, sign-in, the dashboard and published customer sites alike. Static
assets keep serving, so the page's own images still load.

Because it locks out the team as well, set `COMING_SOON_BYPASS` to a secret and open
any page with `?preview=<that secret>`. That sets an HttpOnly cookie, good for 30
days, which exempts the browser and hands back the real site. Leave the variable
blank and nobody gets through at all.

It is a launch gate, not a security control: the secret is compared as a plain
string and anyone holding it gets in. Do not treat it as protection for real data.

The teaser itself is bilingual, Sinhala first, and lives in
`src/app/coming-soon/` — copy in `content.ts`, layout in `coming-soon.tsx`. The
character that watches your cursor is [`page-mascot`](https://github.com/nilbuild/page-mascot);
its two sprite sheets are drawn by `npm run mascot`, which is where to go if the
brand changes. With the gate off, `/coming-soon` still renders so you can look at
it, but it tells search engines not to index it.

---

## How it fits together

```
src/
  app/
    (marketing)/          landing page, pricing, template gallery
    (auth)/               sign in, sign up
    onboarding/           create your first business
    (dashboard)/          the product: orders, products, website admin, settings…
    (builder)/            the full-screen website builder
    site/[businessSlug]/  published customer-facing websites
    api/                  auth, media, analytics, checkout, CSV export
  components/
    ui/                   design-system primitives
    dashboard/            dashboard chrome and shared widgets
    website-builder/      the editor: palette, canvas, settings panel, history
    website/              section renderers, shared by the editor and public site
    charts/               Recharts wrappers
  lib/
    auth/ permissions/    authentication and the multi-tenant access gate
    db/ validations/      Mongoose connection, Zod schemas
    website/              section registry, themes, templates, style compiler
  models/                 Mongoose schemas
  services/               business logic: orders, metrics, limits, websites, AI
```

### The website is JSON, not HTML

A page stores an ordered tree of section nodes:

```ts
{ id, type, props, styles, responsiveStyles, children }
```

`lib/website/section-registry.ts` declares every section type — its label, category, default props and the fields
its settings panel shows. `components/website/section-renderer.tsx` maps a node's `type` to the component that draws
it, and **the builder and the published site use the same map**, so what you see while editing is what ships.

Styling is compiled, not inlined. `lib/website/styles.ts` turns each node's `styles` into CSS keyed on `data-sid`:

- On the **public site** it emits real media queries, so one HTML document is responsive.
- In the **editor** it flattens the selected viewport's styles into the base rule, because viewport media queries
  would not fire inside a simulated device frame.

### Draft and published are separate

Editing writes to `sections`; the public site only ever reads `publishedSections`. Publishing copies one to the
other, along with the theme, header, footer and navigation. Until then, nothing you do is visible to customers.

### Autosave, undo and redo

The editor keeps the whole document in one state object. Every mutation goes through `commit()`, which pushes the
previous document onto an undo stack and marks the draft dirty; a debounced save writes it to the server. `Ctrl+Z`
and `Ctrl+Shift+Z` walk the stack, `Ctrl+S` flushes immediately, and leaving with unsaved work warns first.

### Multi-tenancy

`lib/permissions` is the only place a `businessId` comes from. `requireBusiness()` resolves the active business from
a cookie, verifies membership, and returns it; every business-scoped query derives its filter from that value. A user
can own several businesses and switch between them, and no query can reach another tenant's data.

### Website orders

`POST /api/site/checkout` accepts product ids and quantities only — never prices. It re-prices every line from the
database, re-checks stock, then calls the same `createOrder()` the dashboard uses, which:

1. creates or updates the customer and recalculates their lifetime totals,
2. reduces stock and records an inventory movement,
3. raises a notification for the shop owner.

`inventoryApplied` on the order guards the stock side effects, so re-saving an order or moving it between statuses
never double-counts.

---

## What is real, and what is stubbed

Everything in the product works against the database: authentication, all CRUD, the builder, autosave, publishing,
the storefront, cart, checkout, inventory and customer sync, dashboard and report calculations, website analytics,
CSV export and plan limits.

Three things need an external provider that is not wired up. Each has a working local implementation behind an
interface, so connecting a real one is a single-file change:

| Area | Today | The seam |
| --- | --- | --- |
| **Payments** | Plan changes record a `Subscription` and a pending `Payment`. | `services/limits-service.ts`, the `Payment` model |
| **AI website generation** | A deterministic generator that reads your description, picks a theme and writes a full site. Works with no API key. | `AiProvider` in `services/ai-website-service.ts` |
| **Custom domains** | Domains are stored and the DNS records to add are shown; verification stays pending. | `Domain` model, the hostname rewrite in `proxy.ts` |

Uploads are written to `public/uploads` by the adapter in `lib/storage.ts`. That works locally and on any server with
a writable disk; a serverless deployment needs a second adapter implementing the same interface.

Rate limiting is in-memory (`lib/rate-limit.ts`) — correct for a single instance, and the place to swap in Redis.

---

## Subdomains

Published sites are served from `/site/<business-slug>`. `src/proxy.ts` rewrites `<subdomain>.<SITE_DOMAIN>` onto
that path, so the same routes serve both forms. Locally you can use `shop.localhost:3000`, or just the path.

## Notes

- Built on Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Mongoose and Auth.js.
- The builder is designed for desktop and tablet; the rest of the dashboard and every published site are fully
  responsive.
- Money is Sri Lankan Rupees throughout, with `Asia/Colombo` used for day boundaries in reports.

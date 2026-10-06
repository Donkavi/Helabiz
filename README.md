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
| `SUPER_ADMIN_EMAILS` | Bootstrap list for the platform admin panel. See below. |
| `COMING_SOON` | `"true"` serves the launch teaser instead of the site. See below. |
| `COMING_SOON_BYPASS` | The secret that gets you past the teaser while it is up. |
| `NEXT_PUBLIC_FACEBOOK_URL` / `NEXT_PUBLIC_INSTAGRAM_URL` | Shown on the teaser. Blank leaves the buttons off. |

### Language

The public marketing pages — home, pricing, templates, and the nav and footer
around them — are in Sinhala and English. Sinhala is the default, because that is
who Helabiz is for; the toggle sits in the nav.

The choice is a cookie (`helabiz_lang`) read on the server in
`src/app/(marketing)/layout.tsx`, so a page arrives already translated, its
`<title>` included, rather than flipping language once JavaScript loads. That is
the trade for these pages rendering per request instead of being static — they
touch no database, so it costs little.

All the copy lives in `src/lib/i18n/marketing.ts`, one object per language,
structured by page. `src/lib/i18n/index.ts` must stay free of `next/headers`
because client components import from it; the cookie read lives in
`src/lib/i18n/server.ts`.

Plan names, taglines and feature lists come from the dictionary rather than
`src/lib/plans.ts`, since that file is shared with the signed-in app. The numbers
a plan allows still come from `plans.ts` — there is one source of truth for what
a plan actually does.

Not yet translated: the dashboard, the builder, sign-in and sign-up, and the
chrome on published customer websites. The coming-soon page has its own toggle,
since it ships both languages in the page and is gated separately.

### The platform admin panel

`/admin` is the platform owner's view: every business, every user, plan changes,
suspensions and an audit log. It is a separate route group with its own gate,
nothing to do with the per-business roles in `BusinessMember`.

Access comes from `User.platformRole === "admin"`, read from the database on
every request so revoking it takes effect immediately rather than when a session
expires. `SUPER_ADMIN_EMAILS` is the bootstrap: anyone listed gets in without the
stored role, which is how the first admin is created without editing Mongo. The
panel shows a banner while you are using it, because access that depends on an
environment variable is easy to lose.

Two rules hold the gate up, both in `src/lib/permissions/admin.ts`:

- Every page calls `requireSuperAdmin()`, which redirects rather than 403s — an
  admin area should not confirm its own existence.
- Every server action calls `assertSuperAdmin()` **again**. The layout never runs
  for a server action, which is a public HTTP endpoint; the layout protects the
  screen, not the action behind it.

Every mutation is written to `AuditLog` with an `admin.` prefix, including who
did it and why. `src/services/admin-service.ts` is the only module in the app
that queries without a `businessId` filter, which keeps the "could this leak one
tenant into another" question answerable in one file.

Editing covers a business's own details and a user's name, email and phone.
Two uniqueness rules are checked server-side because both would break someone:
a business slug is its public web address, and a user's email is their login.

Deleting a business cascades through every collection that stores a
`businessId` — the list lives in one array in `admin-service.ts`, and **if you
add a model with a `businessId` you must add it there** or a deleted business
will leave rows behind. Deleting a user is refused while they still own a
business, rather than cascading: that would orphan a live shop with its orders
and customers. Both deletes ask you to type the name or email, and the server
checks it again, because a dialog can be bypassed. Audit entries are written
*before* the delete and are never removed.

Disabling a user is the reversible alternative: they cannot sign in, and
existing sessions stop working at the next request (`/disabled`).

Suspending a business is enforced in three places, not one: `requireBusiness`
(sends the owner to `/suspended`), `resolveBusinessAccess` (the path server
actions take), and `loadPublishedSite` (their public shop stops serving).
Nothing is deleted, and restoring is one click.

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

## Mobile app

`mobile/` is an Expo app for business owners: dashboard, analytics, orders and customer chat, with push notifications
for new website orders and customer messages. It is a separate project with its own `package.json`. The web app's
TypeScript, ESLint and Vercel deployment all ignore it. It talks to the bearer-token routes under `/api/mobile/*`,
and pushes are sent by `src/services/push-service.ts`. Setup, builds and push credentials are in
[mobile/README.md](mobile/README.md).

---

## Subdomains

Published sites are served from `/site/<business-slug>`. `src/proxy.ts` rewrites `<subdomain>.<SITE_DOMAIN>` onto
that path, so the same routes serve both forms. Locally you can use `shop.localhost:3000`, or just the path.

## Notes

- Built on Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Mongoose and Auth.js.
- The builder is designed for desktop and tablet; the rest of the dashboard and every published site are fully
  responsive.
- Money is Sri Lankan Rupees throughout, with `Asia/Colombo` used for day boundaries in reports.

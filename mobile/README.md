# Helabiz mobile

The business owner's companion app. It shows the dashboard and analytics, lists and updates orders, and answers
customer chat. When a website order or customer message arrives, the phone gets a push notification, so the owner
doesn't have to sit at a laptop.

It is an [Expo](https://expo.dev) app (SDK 57, React Native, Expo Router) that talks to the Helabiz web app. It has no
database or business logic of its own: every number comes from the same services the web dashboard uses.

### It looks like the web dashboard

The design follows the web app's design system, so owners don't feel they've switched products:

- **Colours:** the exact `oklch` tokens from `src/app/globals.css`, converted to hex in `src/lib/theme.ts`. That covers
  both light and dark. The app follows the phone's setting, or Settings → Appearance (System / Light / Dark, like the
  web's theme menu).
- **Type and icons:** Geist and Geist Mono for order numbers, and the same Lucide icons as the web.
- **Components:** cards, stat cards, badges, buttons, inputs and empty states are ports of the web components in
  `src/components/ui` and `src/components/dashboard`. Status colours use the same mapping as `order-status-badge.tsx`.
- **Charts:** they match the web's Recharts look (monotone jade area, dashed grid, gold for expenses). Press and drag
  across a chart to read any day.

If you change a colour in `globals.css`, change it in `src/lib/theme.ts` too. Icons are imported one file each through
`src/components/icons.ts`. Importing from the `lucide-react-native` barrel adds about 1.8 MB to the app.

| Tab | What it shows |
| --- | --- |
| Home | Today vs yesterday, this month, 30-day sales chart, recent orders, website stats, best sellers, low stock |
| Orders | Search, filter by status, infinite scroll. Tap one to change its status or payment, call the customer, or "Send via WhatsApp" with the same message the web sends |
| Messages | Customer conversations from the website chat, with replies |
| Reports | The web reports page: 7 days / 30 days / 90 days / 1 year, with sales, profit, expenses, best sellers, expenses by category, website, customers and inventory |
| Settings | Switch business, light/dark appearance, turn on or test notifications, sign out |

Products, the website builder, invoices, billing and team settings stay on the website.

---

## Running it in development

```bash
cd mobile
npm install
cp .env.example .env      # then edit EXPO_PUBLIC_API_URL
npx expo start
```

`EXPO_PUBLIC_API_URL` is where the web app is running. The phone is a different machine, so `localhost` won't work.
Either point it at your Vercel deployment, or run `npm run dev` in the repo root and use your computer's LAN address
(`ipconfig` shows it), e.g. `http://192.168.1.20:3000`. The phone and computer must be on the same Wi-Fi.

Sign in with the same email and password as the website (`demo@helabiz.lk` / `helabiz123` after `npm run seed`).

**Expo Go is fine for the screens, but not for push notifications.** Since SDK 53, Android Expo Go cannot receive
remote pushes. For notifications you need a *development build*, which is your own installable copy of the app:

```bash
npm install -g eas-cli
eas login
eas init                                   # links the app to an Expo project, writes the projectId into app.json
eas build --profile development --platform android
```

Install the APK it gives you, then run `npx expo start` and open the project from that app instead of Expo Go.
Edit the LAN address in `eas.json` → `build.development.env` first.

---

## Push notifications

The flow:

1. After sign-in the app asks for notification permission, gets an Expo push token, and sends it to
   `PUT /api/mobile/push-token`. It's stored on the phone's `MobileDevice` row.
2. When a website order is placed (`createOrder`), a customer sends a chat message (`sendCustomerMessage`) or the Helabiz
   team replies to a support request, the server calls `pushToBusiness()` in `src/services/push-service.ts`.
3. That sends to every phone signed in by an active member of the business through Expo's push service, which delivers
   through Apple and Google.
4. Tapping the notification opens the order or the conversation, switching business first if needed.

Orders ring on a high-priority Android channel, `orders`. Messages use `messages`. Owners can change either in the
phone's settings.

### One-time setup for real devices

- **Android:** Expo delivers through Firebase Cloud Messaging.
  1. Create a Firebase project.
  2. Add an Android app with package `lk.helabiz.app` and download `google-services.json`.
  3. Upload the FCM V1 service-account key with `eas credentials` (Android → Push Notifications).
  4. Reference the JSON from `app.json` (`expo.android.googleServicesFile`). Keep it out of git; `.gitignore` already
     excludes it.
- **iOS:** needs an Apple Developer account. `eas build --platform ios` offers to create the push key for you.
- **Optional hardening:** in the Expo dashboard, turn on *Enhanced push security* and set the access token as
  `EXPO_ACCESS_TOKEN` in Vercel. Then only your server can send to the app.

The "Send a test notification" button on the More tab checks the whole chain end to end.

---

## Building for release

`eas.json` has three profiles:

| Profile | Use |
| --- | --- |
| `development` | Dev client for your own phone, pointing at your laptop |
| `preview` | An installable APK you can send to a few shop owners to try |
| `production` | Play Store / App Store builds |

Set `EXPO_PUBLIC_API_URL` in the `preview` and `production` profiles to your real Vercel domain. `https://helabiz.lk`
is a placeholder.

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
eas submit --platform android
```

Before a store release, add an icon and splash image (`expo.icon`, `expo.splash` in `app.json`).

---

## How it connects to the web app

Everything is under `/api/mobile/*` in the Next.js app:

| Route | |
| --- | --- |
| `POST/GET/DELETE /api/mobile/session` | Sign in (returns a bearer token), current user and businesses, sign out |
| `PUT/POST /api/mobile/push-token` | Save this phone's push token / send a test push |
| `GET /api/mobile/dashboard` | Home screen data, from `getDashboardData()` |
| `GET /api/mobile/reports?range=` | Analytics, from `getReportData()`, the same loader as the web reports page |
| `GET /api/mobile/orders`, `GET/PATCH /api/mobile/orders/:id` | Orders. Status changes go through `changeOrderStatus()`, so stock and customer totals follow |
| `GET /api/mobile/messages`, `GET/POST /api/mobile/messages/:customerId` | Customer chat |

Auth is a random bearer token issued at sign-in, not the website's cookie. Only its SHA-256 hash is stored, on a
`MobileDevice` row together with that phone's push token. Signing out deletes the row, and that also stops the phone's
pushes. A phone left unopened for 90 days must sign in again. Disabling a user in `/admin` signs out their phones on
the next request.

The business being viewed is sent as an `x-business-id` header. `requireMobileBusiness()` in
`src/lib/mobile/auth.ts` checks membership, suspension and the trial/plan lock on every request, the same gates as
the web.

## Known limits

- **Google-only accounts can't sign in yet.** The app uses email and password, and the website can't currently set a
  first password on an account created with Google.
- **English only.** The web dashboard also speaks Sinhala; the app's copy is the web's English wording.
- **No app icon yet.** Add `expo.icon` and a splash image in `app.json` before a store release.
- **Staff see everything the web shows staff.** The web dashboard doesn't restrict orders or reports by role, so the
  app doesn't either.

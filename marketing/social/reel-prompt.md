You are a senior motion designer and creative technologist. Build a launch reel for **Helabiz** as a single, self-contained HTML artifact. It should play as a vertical 9:16 motion-design video with synthesized sound and be able to export itself as a video file I can upload to Facebook Reels, Instagram Reels and TikTok.

**All on-screen text must be in Sinhala** — natural Sri Lankan social-media Sinhala that mixes in everyday English words (order, website, drag, drop, publish, team) exactly as written below. Use my copy word for word; do not translate it or "correct" it.

---

## 1. What Helabiz is

- **Helabiz** (helabiz.lk) is a platform built for Sri Lankan small businesses, especially people who sell through a Facebook page, Instagram or WhatsApp and take orders in the inbox. They want their own website, but cheaply and without a developer.
- It has two halves that share one database:
  1. **A no-code website builder.** Pick a template, drag and drop sections (Hero, product grid, gallery, slider, testimonials, contact; 40+ sections), change text, colours and photos however you like, then publish. It comes with a free `yourshop.helabiz.lk` address, a cart and a Sri-Lankan-friendly checkout (cash on delivery, bank transfer). Costs very little. No code, no developer.
  2. **Business management.** Orders (website, WhatsApp and walk-in orders in one list), stock/inventory, customers, expenses and costs, finance and real profit, invoices, team members/users with roles, analytics and reports.
- **The magic:** an order placed on the website automatically becomes a real order, a customer record and a stock deduction in the dashboard. Products added in the dashboard show up on the website straight away. Nothing gets typed twice.
- **Launch offer:** the **first month is completely free** and needs no card. The message: try it and see for yourself.
- **We help if you want:** customers who don't want to build the website themselves can ask the Helabiz team, and we'll help create it for them.

---

## 2. Brand guidelines (follow these strictly)

**Logo.** I've attached the logo files. Match them exactly:
- `C:\Users\Chami pana\Documents\Helabiz\marketing\social\logo\lockup-dark.png`: the full logo (mark + "Helabiz") on dark. Use it for the end card.
- `C:\Users\Chami pana\Documents\Helabiz\marketing\social\logo\lockup-light.png`: the full logo on light.
- `C:\Users\Chami pana\Documents\Helabiz\marketing\social\logo\mark-transparent-1024.png`: the mark alone.

The mark as SVG, for drawing and animating on the canvas (on light backgrounds, use fill `#14776B` and stroke `#fff`):
`<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="10" fill="#2FBFAC"/><g transform="translate(7 7) scale(0.75)" stroke="#11201D" stroke-width="2" stroke-linecap="round" fill="none"><path d="M4 7.5h16"/><path d="M6.5 11v6.5"/><path d="M17.5 11v6.5"/><path d="M6.5 14.2h11"/></g></svg>`

Wordmark: "Hela" in white (Ink on light), "biz" in jade, bold Geist with −0.03em letter-spacing.

**Logo rules.** Never stretch, recolour, outline or skew the logo. You may animate it in, but its final resting state must be exact. Keep clear space of at least half the tile size around it.

**Colours**
| Role | Hex |
|---|---|
| Jade (primary) | `#14776B` |
| Jade Bright (primary on dark) | `#2FBFAC` |
| Ink (dark background) | `#11201D` |
| Paper (light background) | `#F7F6F2` |
| Gold accent (only for the offer and highlights, use sparingly) | `#E0A43A` |
| Success green (new order, profit up) | `#2E9E6A` |
| Warm red (only in the "problem" scene) | `#D9534F` |

Use mostly Ink backgrounds with Jade Bright energy, plus one Paper-coloured scene for contrast (the website builder). No purple gradients and no generic neon.

**Type**
- **Sinhala:** "Noto Sans Sinhala" from Google Fonts, weights 500, 700 and 900. Load it and wait for `document.fonts.load(...)` before drawing the first frame, so Sinhala never renders in a fallback font. Headlines are weight 900 and large (at least 72px on the 1080-wide frame), with short lines and no more than about 3 lines per card.
- **Latin and numbers:** Geist from Google Fonts. Use tabular figures for counters.

**Personality.** Friendly, confident, local and proud ("ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම හදපු"), never corporate. Use rounded UI cards (about 20px radius), soft shadows and clean, believable app UI.

---

## 3. Format and technical requirements

- 1080×1920 at 30 fps, about **34 seconds** long and loopable.
- Render everything onto **one `<canvas>`** so it can be recorded. Scale the canvas to fit the window while keeping 9:16.
- Drive all animation from one master timeline measured in seconds. Use custom easing (easeOutBack, easeInOutCubic, spring overshoot). Structure the code by scene, with each scene a function of its local time.
- **Reels safe zones:** keep important text and the logo out of the top 220px, the bottom 400px and the right 140px.
- **Controls** go outside the canvas and are hidden while recording: ▶ Play (audio needs a user gesture to start), Replay, a scrubber labelled with the scene names, a mute toggle and "⬇ Export video".
- **Export:**
  - Combine `canvas.captureStream(30)` with the Web Audio output through a `MediaStreamAudioDestinationNode`.
  - Record with `MediaRecorder` at about 12 Mbps. Prefer `video/mp4` if `MediaRecorder.isTypeSupported` reports it, otherwise use `video/webm;codecs=vp9,opus`.
  - When the timeline ends, automatically download the file as `helabiz-launch-reel.mp4` or `.webm`.
- No external images or audio files. Draw every illustration (phones, chat bubbles, notebook, dashboard, charts, icons, confetti) as canvas vector shapes. Don't rely on emoji for important visuals; draw the icons yourself.

---

## 4. Sound design (Web Audio API, fully synthesized)

**Music bed.** 120 BPM, upbeat and modern with a Sri Lankan flavour:
- a synthesized drum pattern inspired by **geta bera / thammattama**: two-tone pitched tom hits with a quick roll before each drop
- layered with a punchy kick, crisp hi-hats, a warm sub bass and a short, catchy pentatonic pluck motif

Build the energy across the reel: sparse during the problem, full groove from the logo reveal, a short breakdown at the twist, and the biggest energy at the offer.

**Beat sync.** Every cut and every text slam lands on a beat (one beat = 0.5s). Write a beat-grid helper and schedule the scenes on it.

**Sound effects.** Mix them under the music and duck the music by about 4dB on big hits.
- **Hook:** messenger/notification pings that speed up and pile on top of each other.
- **Problem:** pen scribble, calculator beeps and a "wrong" buzz.
- **Reveal:** tape-stop or record scratch, then a rising riser into a sub-bass drop.
- **Logo:** a soft click for each logo stroke as it draws, and a satisfying "pop" when the tile lands.
- **Builder:** whooshes on transitions, mouse clicks, a bubbly "plop" on each drag-and-drop, and a shimmer on Publish.
- **Dashboard:** a "ding" for each new order, ticks while numbers count up, and a cash-register "ka-ching" when profit lands.
- **Offer:** a sparkle/confetti burst and a gold chime.
- **End card:** a final low boom with a reverb tail.

**Master.** Put a limiter (DynamicsCompressor) on the master bus so nothing clips, and fade the music out cleanly at the end.

---

## 5. Storyboard

Times are approximate. Snap them to the beat grid.

### Scene 1 — HOOK (0.0–3.0s)
- Ink background. A phone fills the frame, showing a Facebook-page inbox.
- Chat bubbles flood in faster and faster, overlapping and shaking slightly, each with a ping:
  > "Price pls? 🙏" · "PM" · "Available ද?" · "Delivery තියෙනවද?" · "Size එක කීයද?" · "Order කරන්නේ කොහොමද?"
- At 1.0s a headline **slams** in (scale 1.4 → 1 with a camera shake):
  > **තාමත් Inbox එකෙන්ද order ගන්නේ? 😩**
- The very first frame must already be busy and readable. No slow fade-in: this is the scroll-stopper.

### Scene 2 — THE PAIN (3.0–6.0s)
- Fast kinetic cards, one per beat. The scene is desaturated with warm-red accents, and a messy notebook and calculator are drawn in the background.
  > Order ටික WhatsApp, FB අස්සේ විසිරිලා
  > ගිණුම් තාම පොතේ 📒
  > මාසෙ අන්තිමට ලාභය කීයද? 🤷
  > Website එකක් හදන්න ලක්ෂ ගාණක්? 💸
- On the last card, a price tag reading "Rs. 150,000+" gets stamped with a big jade ✕.

### Scene 3 — LOGO REVEAL (6.0–9.0s)
- Tape-stop sound. All the clutter gets sucked into a single jade dot at the centre. A riser plays.
- On the drop:
  - the tile pops in with a spring overshoot
  - the H draws stroke by stroke (awning bar, left leg, right leg, crossbar), with one click per stroke
  - the wordmark slides out from behind the mark, "Hela" in white and "biz" in Jade Bright
- Add a subtle radial glow and particles. Underneath:
  > **ඔබේ ව්‍යාපාරයට, ඔබේම වෙබ් අඩවියක්.**

### Scene 4 — DRAG & DROP BUILDER (9.0–16.0s)
- Switch to a **Paper**-coloured scene showing a tablet or phone mockup of the Helabiz builder. A section library sits on the left (Hero, Products, Gallery, Reviews and Contact as rounded chips with icons) and the page canvas on the right.
- An animated cursor drags each block onto the page. Each one lands with a bouncy settle and a plop.
- Theme swatches then cycle on the beat, and the whole mini website recolours: jade → terracotta → navy → back to jade.
- Three huge lines hit on three consecutive beats:
  > **Drag කරන්න.** → **Drop කරන්න.** → **Publish කරන්න.**
- The cursor clicks a jade Publish button. A shimmer and confetti play, and a URL bar types out:
  > yourshop.helabiz.lk ✓
- Then:
  > **එච්චරයි! ✨**
- Small supporting lines:
  > Code නෑ · Developer නෑ · ලොකු වියදම් නෑ
  > ඔබට ඕන විදිහට design කරගන්න 🎨

### Scene 5 — TWIST (16.0–18.0s)
- The music drops into a breakdown. A hand/stop icon pops up:
  > **ඒත් ඉන්න... 🤚**
  > **මේක website එකක් විතරක් නෙවෙයි!**
- The camera then zooms **through** the phone screen into the dashboard, as a match cut on the jade colour.

### Scene 6 — THE BUSINESS SIDE (18.0–27.0s)
On an Ink background, dashboard cards build into a bento layout, one card every two beats:

1. **Orders.** A customer orders on the website. A notification flies from the site into the dashboard with a ding:
   > අලුත් order එකක්! 🛒

   The order row appears, a customer card saves itself, and a stock counter ticks 12 → 11.
   > Website order එකක් = ඉබේම dashboard එකට ⚡
2. **Finance / ලාභය.** A revenue line chart draws itself and a counter rolls from "Rs. 0" to "Rs. 248,500", ending on a ka-ching.
3. **Costs / වියදම්.** Chips labelled "කුලිය", "පඩි" and "Delivery" drop onto an expense stack, and a profit bar recalculates.
   > සැබෑ ලාභය බලාගන්න
4. **Users / Team.** Three avatars join with role badges (Owner, Staff).
   > ඔබේ team එකටත් access දෙන්න
5. **Analytics & Reports.** A bar chart grows, a donut fills and a report sheet slides out.

To finish the scene, all the cards tighten into one grid and this line lands:
> **Orders · ලාභය · වියදම් · Team · Reports — එකම තැනකින්.**

### Scene 7 — THE OFFER (27.0–31.0s)
- The biggest energy of the reel. A calendar page flips to reveal a giant "1" labelled "මාසය", with a gold burst and confetti.
  > **පළමු මාසය සම්පූර්ණයෙන්ම නොමිලේ! 🎁**
  > Card එකක් ඕන නෑ.
- On the next beat, a jade card slides up with a drawn handshake icon and a warm, reassuring pop:
  > **ඕන නම්, website එක හදාගන්න අපි උදව් කරනවා 🤝**
- This is the only scene that uses gold heavily.

### Scene 8 — CTA / END CARD (31.0–34.0s)
- Ink background with the exact logo lockup centred, and a pulsing Jade Bright pill button:
  > **නොමිලේ පටන් ගන්න →**
- Above the button:
  > අදම try කරලා බලන්න 👉 **helabiz.lk**
- Below it:
  > ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම හදපු 🇱🇰
- And in small text:
  > Link in bio 🔗
- In the last 0.5s, flash a quick echo of the first frame's chat bubble so the reel loops seamlessly.

---

## 6. Motion-design quality bar

- **Easing:** nothing moves linearly. Every element enters with easing, overshoot or a stagger of 30–60ms between siblings. Use anticipation and follow-through.
- **Transitions:** mix the styles — whip pans with drawn motion trails, jade mask wipes, zoom-throughs and match cuts on shapes and colours. Use a quick glitch only in the problem scene.
- **Kinetic type:** words scale or slide in on the beat. Highlight key words with a jade underline or a pill shape behind them.
- **Constant subtle life:** slow drifting background shapes or film grain, gentle parallax on the mockups and a soft "breathing" camera scale.
- **Readability first:** every short line stays on screen for at least 1.2s. Keep contrast high and never put text over busy areas.
- **Performance:** keep a smooth 30fps. Precompute what you can and don't allocate new objects every frame.

---

## 7. Voice-over script

The captions are already on screen, so the reel works on mute. Also write a separate **Sinhala voice-over script** (about 75 words, friendly and energetic) timed to these scenes, so I can record it myself.

---

**Deliver the complete, working artifact.** After it, list the final scene timings and explain how to export the video.

# SDG Electric Landing Page — Design System

Binding rules for this codebase. Read before touching any visual styling.
These rules exist because each was violated once and caused a shipped visual bug.

## Brand tokens (from SDG Electric Brand Guidelines v1.0, March 2025)

| Token | Value | Use |
|---|---|---|
| Accent orange | `#D58C46` | Offsets, highlights, CTAs, bolt |
| Black | `#1B1B1B` | All "black" surfaces/text (mapped to Tailwind `black` in `global.css`) |
| Light gray | `#E5E5E5` | Light neutral surfaces |

Both tokens are set in `src/styles/global.css` under `@theme` (`--color-accent`, `--color-black`).
Never hardcode a new orange or black — use `accent` / `black` utilities or these hex values.

## The accent-offset rule (x/y shifted background)

Every offset backdrop is a **hard box-shadow on the framed element itself**, always
down-right, always both axes equally, always solid `#D58C46`, zero blur, zero spread:

| Element class | Shadow | Example |
|---|---|---|
| Standalone framed media (photos, maps, feature panels) | `shadow-[24px_24px_0px_0px_#D58C46]` | Fleet crew photo, Authority team photo, service-area maps, TrustBar panel |
| Cards / content panels | `shadow-[12px_12px_0px_0px_#D58C46]` | Review cards, NeedPower panel, Comparison table, Incentives card, Authority 100% badge |
| Buttons / chips / small controls | `shadow-[6px_6px_0px_0px_#D58C46]` | CTAs, nav phone button, FAQ chip |
| **Items inside a grid** | **NONE** | Gallery tiles, service card grid, stats grid, trust-badge logos |

**Grid items never get an offset shadow.** In a tiled grid the shadows fill the gaps
and turn into orange noise. Grids stay clean: border only.

Only these three sizes exist: 24 / 12 / 6. Do not invent new ones.

### Shadow COLOR is decided by the surface the shadow lands on

| Context | Shadow color | Examples |
|---|---|---|
| Light section (white/cream) | Solid `#D58C46` | Fleet photo, maps, NeedPower panel, buttons, thank-you card |
| Dark section, **light** element | Solid `#D58C46` (contrast supports the pop) | White review cards on black, team photos on black |
| Dark section, **dark** element | Tint `rgba(213,140,70,0.15)` — a quiet lift, never a solid orange slab | TrustBar stats panel, Comparison table |
| Overlapping badge/element (hangs off a frame) | Follow the surface the **shadow itself** falls on | Authority "100%" badge → shadow lands on the dark section → tint |

Solid orange on a dark-on-dark element is a violation — it reads as a loud slab
(this shipped once on the stats panel and was called out).

## Implementation rules — how this broke before, never again

1. **Never build an offset as an absolutely-positioned `bg-accent` div**
   (`absolute inset-0 bg-accent translate-x-* -z-10`). Negative z-index makes the
   plate's visibility depend on the ancestor stacking context; a CSS change elsewhere
   (see #3) silently sent every plate behind the section background. Box-shadow paints
   with the element and cannot be reordered away.

2. **Nothing that hangs outside a frame may live inside an `overflow-hidden` parent.**
   `overflow-hidden` is allowed only to contain image hover-zoom, and only on a wrapper
   whose decorations are all inside it. The Authority "100%" badge sits *outside* the
   photo frame, so it is a sibling of the overflow-hidden wrapper, not a child.

3. **No paint containment on sections.** `content-visibility: auto` /
   `contain: paint` clips box-shadows and any decoration at the section edge (that's
   how card bottoms lost their shadows). It was removed from `global.css`; do not
   reintroduce it without re-testing every offset shadow at section boundaries.

4. **A section whose last element carries a shadow needs bottom padding ≥ the shadow
   offset** (e.g. Reviews has `pb-6` for its 12px card shadows), otherwise the next
   section's opaque background paints over the shadow.

## Typography scale — display numerals

Section headlines (H1/H2) are the ONLY text allowed above 60px (`text-6xl`).
Everything else caps out below them:

| Element | Scale | Example |
|---|---|---|
| Section headlines | up to `text-7xl` / `lg:text-[72px]` | "YOUR PHOENIX AUTHORITY." |
| Hero-stat strip numerals | `text-4xl sm:text-5xl md:text-6xl` | TrustBar 1.2K+ / 5 / 100% / 24/7 |
| Stat-tile numerals (in grids) | `text-4xl md:text-5xl` | Reviews stats grid |
| Overlay badge numerals | `text-4xl sm:text-6xl` | Authority "100%" badge |

A badge numeral at `text-8xl` (96px) shipped once and dominated its whole
section — that's why this cap exists. Do not exceed `text-6xl` outside headlines.

## Third-party services

- **Booking: SDG's own GHL survey.** Every booking CTA carries the class
  `.schedule-btn-rai` and `href="/book"`. `BookingModal.astro` intercepts the
  click and opens the survey in a `<dialog>`; `/book` renders the same survey
  full-page as the no-JS fallback and as an ad destination. The survey ID lives
  in `src/config.ts` — change it there, nowhere else.
  - The iframe is warmed on hover/touch/focus and again on `requestIdleCallback`
    after `load`, so the click is instant and the survey never competes with LCP.
    Do not move the iframe `src` into the markup.
  - `form_embed.js` is deliberately NOT loaded. The survey is a 9-step,
    one-question-per-screen layout that fills whatever height it is given and
    scrolls internally, so the parent-side height-messaging script buys nothing
    and adds a request plus a race condition.
  - The close/cleanup path does not rely on the dialog `close` event (it does not
    fire in every engine). All exits go through `closeModal()`, which is what
    unlocks body scroll. Do not "simplify" that back to a `close` listener.
- The RecreateAI booking widget/form belonged to another contractor and was
  removed (script, preconnects, and all CTA hrefs). Do not re-add any
  `recreateai.com` reference.
- **Analytics: two things, and only two.**
  - **Google Ads gtag** (`AW-18374148612`, SDG's Ads account) in `Base.astro` —
    page views, remarketing, and the click-to-call conversion. No GA4, no GTM:
    gtag is already loaded, so GA4 is a one-line `gtag('config', 'G-…')` if
    ever wanted; GTM buys nothing when tags ship via git.
  - **First-party tracker** — the inline script at the bottom of `Base.astro`
    `<head>`. ~2KB gzipped, no cookies, no third-party domain, boots on
    `DOMContentLoaded`. Event names follow GA4: `page_view` / `scroll` (25/50/75/100)
    / `section_view` (dwell ms) / `click` / `book_click` / `call_click` /
    `booking_complete` (thank-you view) / `user_engagement` (visible ms).
    Batched to `/api/track` via `sendBeacon`. That endpoint is
    `api/track.ts` (a Vercel function, same origin) writing to Turso
    (`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`). Locally, `node
    scripts/dev-api.ts` serves it on :3999 and `astro dev` proxies `/api` to it,
    writing `.data/landing-events.db`. Read in the Sidehouse dashboard at
    `/landing`. Sections are keyed by `id`, else slugified `aria-label` — keep
    both stable or the dashboard's section history breaks.
  - **Internal traffic:** visiting any page with `?internal=1` sets a permanent
    `localStorage` flag for that browser; every event is then stamped
    `internal=1` and hidden from the dashboard unless it's in Test mode.
    `?internal=0` clears it. `localhost` is always internal. Do this once on
    each of Joe's devices/browsers before testing on the live site.
  - **Button tags:** every CTA carries `data-track="<section>-<action>"`
    (`hero-book`, `sticky-call`, `emergency-book`, …). The tracker reports that
    tag as the click label. A new CTA needs a tag here and a friendly name in
    the dashboard's `src/app/landing/ga.tsx` `ELEMENT_NAMES`.
  - The inherited GTM/GA tags fired into the previous business's accounts and
    were removed. Do not re-add them.

## Phone / identity

- Phone everywhere in the code: 602-905-5281 (`tel:+16029055281`) — the Google PPC
  tracking number, deliberately swapped in across the whole site in commit 1c52597
  (2026-08-31). Do NOT "correct" it back to 480.
- 480-536-9456 (`tel:+14805369456`) is SDG's real, A2P-registered line. It stays out
  of the site code while the PPC tracking number is in use.
- Brand name is "SDG Electric" everywhere. Zero "Dean & Co" references may exist in `src/`.
  Check with: `grep -ri "dean" src/`

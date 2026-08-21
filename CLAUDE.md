# SDG Electric — Phoenix "Electrician Near Me" Landing Page

Single-client Astro 5 conversion landing page for SDG Electric (Phoenix, AZ).
Deployed from `github.com/bookedbuilders/sdgaz` → book.sdgaz.com.

- `npm run dev` — Astro dev server on port 3000
- Pages: `src/pages/index.astro` (the whole landing page) + `thank-you.astro`
- Sections live in `src/components/*.astro` — one component per page section

## STOP — read DESIGN-SYSTEM.md before touching any visual styling

`DESIGN-SYSTEM.md` in this directory is binding. Every rule in it exists because
it was violated once and shipped a visual bug. The two that break most often:

1. **Offset shadows are hard box-shadows on the element itself** — never an
   absolutely-positioned `bg-accent` plate div with negative z-index.
   Only three sizes exist: `24px` (standalone framed media), `12px` (cards/panels),
   `6px` (buttons/chips). Do not invent a fourth.
2. **Grid items never get an offset shadow.** Tiled grids get borders only —
   shadows fill the gaps and turn into orange noise.

Shadow *color* depends on the surface the shadow lands on, not the element:
solid `#D58C46` on light surfaces and for light elements on dark; the
`rgba(213,140,70,0.15)` tint for dark-on-dark. Read the table in DESIGN-SYSTEM.md.

## Brand tokens
`#D58C46` accent orange, `#1B1B1B` black, `#E5E5E5` light gray — defined under
`@theme` in `src/styles/global.css`. Never hardcode a new orange or black.

## Related
This is NOT the BookedBuilders multi-tenant site generator (`~/Documents/booked-builders`),
though its section components are the design precedent for that project.

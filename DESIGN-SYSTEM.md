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

## Phone / identity

- Placeholder tracking number: 480-415-0660 (SDG's real line is 480-536-9456 — not yet swapped in).
- Brand name is "SDG Electric" everywhere. Zero "Dean & Co" references may exist in `src/`.
  Check with: `grep -ri "dean" src/`

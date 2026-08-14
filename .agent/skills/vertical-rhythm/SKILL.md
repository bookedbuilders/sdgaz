# Vertical Rhythm & Seam Rule

This skill defines the standard for managing vertical spacing (padding and margins) between sections in modular web applications to ensure a premium, intentional rhythm.

## 1. Symmetrical Padding Rule (Color Transitions)
When two adjacent sections have **different background colors**, they must have symmetrical top and bottom padding to properly frame the content.
- **Section A (Top)**: Must have a trailing padding (e.g., `pb-24 md:pb-32`).
- **Section B (Bottom)**: Must have a leading padding (e.g., `pt-24 md:pt-32`).
- **Result**: The transition line is perfectly centered between the two content blocks.

## 2. Collapsed Margin Rule (Same Background)
When two adjacent sections share the **same background color**, they should be treated as a single visual block to avoid "double padding."
- **Section A (Preceding)**: Set trailing padding to zero (`pb-0`).
- **Section B (Following)**: Set leading padding to the standard unit (`pt-24 md:pt-32`).
- **Result**: The gap between the content of Section A and Section B is exactly one padding unit (e.g., 96px on mobile), maintaining a consistent vertical rhythm without excessive white space.

## 3. Standard Padding Units
Unless otherwise specified, use the following Tailwind-based units for section spacing:
- **Mobile**: `24` (96px) -> `py-24` or `pt-24 / pb-24`.
- **Desktop**: `32` (128px) -> `py-32` or `pt-32 / pb-32`.

## 4. Implementation Example (Tailwind)
```tsx
{/* SECTION A & B share background color */}
<section className="bg-white pt-24 pb-0 md:pt-32 md:pb-0">...</section>
<section className="bg-white pt-24 pb-24 md:pt-32 md:pb-32">...</section>

{/* SECTION B & C have different background colors */}
<section className="bg-white pt-24 pb-24 md:pt-32 md:pb-32">...</section>
<section className="bg-black pt-24 pb-24 md:pt-32 md:pb-32">...</section>
```

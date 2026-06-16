# Philemon — Platform Design Language

Applies to **every** Philemon app. Strict, minimal, technical — the look of a
modern developer-tool site (Linear / Vercel). This is a visual layer only.

> **Hard rule:** style is subordinate to information. Never summarize, omit, reorder,
> truncate, or restructure content to fit the style. If a styling choice would hide or
> drop any data, don't apply it — readability and completeness always win.

## Color — strict monochrome
- **Pure black** page background (`#000`). **No** colored backgrounds.
- **Panels/cards share the page color** (`#000`) — they are separated from the
  background **only by a hairline border**, never by a fill.
- **Pure white** primary text (`#fff`); zinc grays (`#a1a1aa`, `#71717a`) for secondary.
- Hairline borders: subtle white-alpha (`rgba(255,255,255,0.12)`).
- **No accent hue — no blue, no color.** The "accent" is white (links, selection,
  focus). The single primary action is a **white button with black text**.
- Status is conveyed by **grayscale brightness** + label, not hue.
- Dark only.

## Shape — flat
**90° corners everywhere.** Border-radius is `0`. No rounded cards, inputs, buttons, or pills.

## Typography
**Geist Mono** throughout (loaded from Google Fonts), fallback `ui-monospace`. Tight
headings (low line-height, slightly negative letter-spacing). Mono/small-uppercase
"kicker" labels over decorative headers.

## Borders & surfaces
1px hairline white-alpha borders are the primary separator. No fills, no heavy shadows —
content boxes sit directly on the black page, outlined by their border.

## Spacing & layout
Generous whitespace, clear vertical rhythm, comfortable line-height, readable max width.

## Components (styled, not invented)
- **Tables:** hairline borders, subtle header row, monospace numeric/ID columns.
- **Code:** bordered block, monospace; inline code = faint bordered pill (flat).
- **Badges:** flat monospace pills with a hairline border, grayscale.
- **Buttons:** one solid **white** primary (black text); others ghost/outline; links white.
- **Key–value:** muted gray keys, monospace values.

## Motion & detail
Minimal and precise — subtle hover + gentle fade-ins. No bounce, no decorative imagery.

## Implementation
Design tokens + primitives in `packages/ui`. Reference this before building any UI.

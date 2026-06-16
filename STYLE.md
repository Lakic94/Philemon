# Philemon — Platform Design Language

Applies to **every** Philemon app. A refined, minimalist, technical aesthetic — the
look of a modern developer-tool site (reference: Better Auth). This is a visual layer only.

> **Hard rule:** style is subordinate to information. Never summarize, omit, reorder,
> truncate, or restructure content to fit the style. If a styling choice would hide or
> drop any data, don't apply it — readability and completeness always win.

## Color
Monochrome-first, **Linear/Vercel** flavour. **Rich black** page (`#0a0a0a`, range
`#000`–`#0a0a0a`), **deep charcoal** surfaces (`#0e0e11` → `#1c1c21`), **pure white**
primary text (`#fff`); zinc grays (`#a1a1aa`, `#71717a`) for secondary text. Hairline
borders are subtle white-alpha (`rgba(255,255,255,0.08)`). **Dark mode default.**
The **primary action is a white button with black text** (Vercel-style). At most **one**
restrained accent (a soft blue) — used only for links, selection, and focus. Secondary
text is muted gray, never pure white.

## Typography
Clean geometric sans (Inter, Geist, or `system-ui`) for headings + body. Monospace
(`ui-monospace`, "JetBrains Mono") for code, inline tags, labels, keys, IDs, version
numbers, and any technical token. **The sans-vs-mono contrast is core** — lean on it to
distinguish prose from data. Headings tight (low line-height, slightly negative
letter-spacing), clearly larger than body. Body small-to-normal, comfortable. Use
small-uppercase or monospace "kicker" labels above sections instead of decorative headers.

## Borders & surfaces
1px hairline borders in low-contrast gray to separate/group. Prefer thin borders + subtle
background-shade differences over heavy shadows. Small-to-medium radius (≈6–10px) on cards,
code blocks, inputs, buttons — rounded, not bubbly. Cards/panels sit on a surface only
slightly lighter/darker than the page.

## Spacing & layout
Generous whitespace, clear vertical rhythm between blocks. Comfortable line-height. Let
content breathe. Consistent padding inside cards/panels. Constrain text to a readable max width.

## Components (styled, not invented)
- **Tables:** hairline borders, subtle header row, monospace numeric/ID columns, comfortable row padding.
- **Code:** dark block, small radius, monospace; syntax-color the code only (one of the few places color appears); inline code gets a faint background pill.
- **Lists:** tight, clean, minimal bullets.
- **Labels/tags/badges:** small monospace pills with hairline border or faint fill.
- **Buttons/links:** one solid primary (high contrast); others ghost/outline; links in the single accent color.
- **Key–value / field data:** align cleanly, monospace the values, muted gray for the keys.

## Motion & detail
Minimal and precise — at most subtle hover states and gentle fade-ins. No bounce, no
decorative imagery, no stock illustrations. Reads as engineered and exact, not playful.

## Implementation
Lives as design tokens + primitives in `packages/ui` (imported by every app). Reference
this file before building any UI.

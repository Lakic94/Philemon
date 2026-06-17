# Philemon UI — how to build with it

`@philemon/ui` is a **strict monochrome, dark-only** design system (the look of a
modern dev tool — Linear / Vercel). Pure-black canvas, white text, hairline
borders, flat 90° corners, Geist Mono throughout. There is **no color/hue** — status
is conveyed by grayscale brightness + label, and the one solid action is a white
button with black text.

## Setup — no provider, but you MUST paint a dark surface

There is **no `ThemeProvider`** and no wrapper to mount. Components are styled by the
stylesheet (`styles.css`, which loads tokens, component CSS, and the Geist Mono
webfont). Just import and render:

```tsx
import { Card, Kicker, Button, Stack, Row, Badge } from "@philemon/ui";
```

**The single biggest gotcha:** components render light-on-dark — white text, faint
white-alpha borders. On a default (white) page they are nearly invisible. Always
set the page/container to the dark tokens:

```tsx
<div style={{ background: "var(--ph-bg)", color: "var(--ph-text)",
              fontFamily: "var(--ph-font-mono)", minHeight: "100vh" }}>
  {/* your screen */}
</div>
```

## Styling idiom — components + tokens, NOT utility classes

This is **not** a utility-class system (no Tailwind-style `bg-*`/`gap-*`). Two rules:

1. **Compose the exported components** for all UI parts. Don't hand-write the
   internal `ph-*` class names — render the component that owns them.
2. **For your own layout glue, use inline styles referencing the `--ph-*` CSS
   variables.** Never introduce a raw color — pull from tokens so the monochrome
   stays intact.

Token vocabulary (all defined in the stylesheet):

| Group | Variables |
|---|---|
| Surfaces | `--ph-bg` (#000), `--ph-surface`, `--ph-surface-2`, `--ph-surface-3` |
| Borders | `--ph-border` (hairline), `--ph-border-strong` |
| Text | `--ph-text` (#fff), `--ph-muted`, `--ph-muted-2` |
| Accent (white) | `--ph-accent`, `--ph-primary`, `--ph-on-primary` (#000) |
| Status (grayscale) | `--ph-needed`, `--ph-ordered`, `--ph-bought` |
| Spacing | `--ph-space-1`…`--ph-space-7` (4 / 8 / 12 / 16 / 24 / 32 / 48 px) |
| Type | `--ph-font-mono`, `--ph-text-xs`…`--ph-text-2xl` |
| Shape | `--ph-radius` = **0** (90° corners everywhere — never round anything) |

## The component kit

- **Surfaces:** `Card` (bordered box), `Panel` + `PanelHeader` + `PanelBody` (titled
  box), `Kicker` (mono uppercase eyebrow label).
- **Layout:** `Stack` (vertical rhythm), `Row` (horizontal; `between` for
  space-between).
- **Actions:** `Button` — `variant="primary"` (white, solid) | `"ghost"` |
  `"outline"` | `"danger"`; `size="sm" | "md"`.
- **Status:** `Badge` (`variant="needed" | "ordered" | "bought" | "accent"`, `dot`)
  and `StatusBadge` (`status="needed" | "ordered" | "bought"`). Use these for status —
  never a colored pill.
- **Forms:** `Field` (label wrapper) around `Input` (`mono` for numeric/IDs),
  `Textarea`, `Select`.
- **Data:** `Table` (use the `numCell` class on right-aligned numeric/ID cells),
  `TableWrap` (table inside a panel), `KeyValue` (`rows={[{k, v}]}`), `Progress`
  (`value`/`max`), `CodeBlock`, `InlineCode`. `formatEuro(cents)` formats money.

Read each component's `<Name>.d.ts` for its exact props and `<Name>.prompt.md` for
usage; `styles.css` (and `_ds_bundle.css`) are the source of truth for the look.

## Idiomatic example

```tsx
import { Card, Kicker, Row, Progress, Badge } from "@philemon/ui";

export function RoomCard() {
  return (
    <div style={{ background: "var(--ph-bg)", color: "var(--ph-text)",
                  fontFamily: "var(--ph-font-mono)", padding: "var(--ph-space-5)" }}>
      <Card style={{ maxWidth: 360 }}>
        <Row between style={{ marginBottom: "var(--ph-space-3)" }}>
          <Kicker>Living room</Kicker>
          <Badge variant="ordered" dot>In progress</Badge>
        </Row>
        <Progress value={5240} max={8000} />
      </Card>
    </div>
  );
}
```

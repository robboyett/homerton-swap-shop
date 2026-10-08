# No component kit: the design is one font at one size, in plain CSS

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** The earlier pilot (ADR 0001) made Nuxt UI its component backbone and spent real effort keeping agents inside it: an allow-list that denies every other kit by name, a whole pass in `REVIEW.md` about hand-rolled buttons, and a `docs/ui.md` mapping design hexes to theme tokens.

This design does not want that. Rob's canvas is white ground, `#262626` ink, IBM Plex Mono at 12px on 18px, **one size everywhere**, no bold. Buttons are a 1px border and left-aligned text. The only selected state in the whole product is an underline. A component kit's value is its defaults — type scale, elevation, focus rings, a colour ramp — and every one of those defaults is something this design would have to switch off.

**Decision.**

1. **Plain CSS in `app/assets/css/main.css`,** with the tokens and rules written out in `docs/ui.md`. No Nuxt UI, no Tailwind, no utility framework.
2. **The canvas in `docs/design/` is the visual truth for styling.** `docs/ui.md` wins on the rules; where a shipped page differs from a board, it goes in the divergence table in `docs/ui.md`, not in a new ADR.
3. **`@nuxt/ui`, `tailwindcss`, `vuetify`, `primevue` and `element-plus` are on the denied list** in `docs/allowed-deps.txt`, each with the reason on its line, so the block reads as a conversation and not a typo.

**Consequences.** We hand-write a handful of elements: a cover, a grid section, a filter row, a bordered button, a checkbox row. That is most of the product's surface and it is about a page of CSS. `REVIEW.md` loses the pilot's Nuxt UI pass. Accessibility is ours to get right rather than inherited, so the floor is written down: 44px minimum tap targets reached with padding, real `<button>` and `<a>` elements, `aria-pressed` on the filters, and visible focus.

What it costs: no free dark mode, no free focus management, and if this ever grows a date picker or a combobox we will be writing it or reopening this.

What it does not change: the canvas is still reference, never app code. `support.js` is Claude Design's runtime and is never imported by the app.

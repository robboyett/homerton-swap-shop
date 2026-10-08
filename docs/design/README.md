# The design canvas

**Parent:** [AGENTS.md](../../AGENTS.md) · **The rules:** [../ui.md](../ui.md) · **Decision:** [ADR 0003](../adr/0003-no-component-kit.md)

Visual truth for styling. Behaviour comes from [../plan.md](../plan.md); how the look is written down is [../ui.md](../ui.md). **Nothing here is app code.** Biome and the `seams` check ignore `docs/`.

**Source:** a Claude design canvas, "Homerton swap shop", created 8 Oct 2026. `canvas.json` holds the board layout and titles. If the canvas moves on, re-export and replace these files; do not edit them here.

## The boards

| File | Screen | Size |
|---|---|---|
| `Main.dc.html` | browse, desktop — the age filter works, reserved covers fade | 1280 × 1880 |
| `Browse-phone.dc.html` | browse, phone | 390 × 844 |
| `Book-desktop.dc.html` | book detail, desktop, with the demo row for the five states | 1280 × 1000 |
| `Book.dc.html` | book detail, phone, same states | 390 × 933 |
| `Scan.dc.html` | add books, scanning, with the pile and publish | 390 × 844 |
| `How-it-works.dc.html` | how it works, desktop | 1280 × 900 |
| `How-it-works-phone.dc.html` | how it works, phone | 390 × 900 |

## To click through them

Open any `.dc.html` in a browser. `support.js` is Claude Design's runtime: generated, not ours, and never imported by the app. It loads React from a CDN and the pages pull IBM Plex Mono from Google Fonts, so it needs network.

The markup is inline styles with `{{ }}` holes and `sc-if` / `sc-for` bindings; the data and the state class are in the `<script data-dc-script>` at the end. Grep a board for an exact hex or size, then map it to a rule in [../ui.md](../ui.md) before using it — the boards are where a value came from, `ui.md` is where it is decided.

## To screenshot one

For the self-check in [../ui.md](../ui.md). Chrome headless against the file:

```
chrome --headless --window-size=1280,900 --virtual-time-budget=12000 \
  --screenshot=main.png docs/design/Main.dc.html
```

Phone boards are `--window-size=500,900`, not 390: headless Chrome will not make a window narrower than about 500px, and a smaller `--window-size` silently lays out at 500 and crops the picture (docs/runbook.md). 500 is still below the app's 700px breakpoint, so it does exercise the phone layout. The boards themselves are fixed-width divs, so they are unaffected either way. To capture a different state, copy the board and edit the initial `state` in its script — `Book-desktop.dc.html` takes `scene` of `available` | `mine` | `other` | `owner` | `collected`, and `Main.dc.html` takes `age` of `all` | `0-3` | `4-6` | `7-9` | `10+`.

## Two things to know when reading them

- **The "[demo]" row is not a feature.** It switches the five book states for the mock-up. It does not ship (ADR 0004).
- **The covers are invented.** Coloured CSS shapes, and the titles, authors and people (`priya`, `sam`) are samples. Real covers come from the Open Library lookup. Fixtures keep the CSS shapes so Phase 1 needs no network.

# The look

**Parent:** [AGENTS.md](../AGENTS.md) · **Canvas:** [design/](design/) · **Decision:** [ADR 0003](adr/0003-no-component-kit.md)

Deliberately plain. Hierarchy comes from spacing and grouping only. No component kit, no utility framework: the whole stylesheet fits on a page.

## The rule

One font, one size, one weight, two colours. If a change needs a second size or a bold, it is the wrong change. Reach for spacing instead.

## Tokens

| | |
|---|---|
| Ground | `#ffffff` |
| Ink | `#262626` |
| Type | IBM Plex Mono 400, **12px on 18px line height**, everywhere. No bold, no size changes |
| Page padding | Desktop 32px top, 48px sides. Phone 24px |

## Copy

Lowercase, plain, British English, sentence case for titles, no emoji. "I'd like this" keeps its capital I. Say what will happen, not what the button is called: "this reserves it for you, so nobody else can ask."

## Covers

Covers lead. Everything else is text.

- Ratio 2:3, radius 2px
- Shadow `0 1px 1px rgba(0,0,0,0.08), 0 3px 8px rgba(0,0,0,0.10)`
- A 5% dark spine strip down the left: `rgba(0,0,0,0.14)`
- No text on covers in the grid. While a pointer is over one, a slim bar drops in from the top of the viewport, full width, ink at 88% (`--ink-veil`) with ground text, names it: title, then author, one line. Moving to another cover replaces the text; leaving clears it. Hover only; touch screens never see it
- Reserved covers drop to `opacity: 0.35`

## Grids

- Desktop `repeat(auto-fill, minmax(96px, 1fr))`, 20px gap
- Phone 3 columns, 14px gap
- Genre sections 48px apart on desktop, 40px on phone
- Each section: its name and a count, then 16px to the grid

## Buttons and links

- Primary: 1px solid `#262626`, white fill, min-height 44px, padding 12px 14px, **text left-aligned**
- Secondary: plain underlined text
- The active filter is underlined, and so is the nav item for the page you are on. That is the only selected state in the product
- Primary buttons are at least 44px high, reached with padding, never with height
- The age filters are padded on a phone and tight on desktop, as the canvas draws them. Secondary text actions follow the canvas at 8px padding, which is 34px. Revisit if anyone struggles to hit one on a phone

## Sample genres

picture books · early readers · chapter books · fantasy and adventure · science and nature · young adult

## Screenshot self-check (before "done" on any page)

1. Run the page, screenshot it at 1280 wide and at 390 wide.
2. Open the matching board in `docs/design/` in a browser and screenshot the same width.
3. Put them side by side and check: one type size, no bold, covers at 2:3 with the spine strip, 44px tap targets, lowercase copy.
4. Show Rob both images. Don't claim a page matches the design without looking at both.

## Divergences from the canvas

Where a shipped page differs from `docs/design/`, add a row here with the reason. Don't write an ADR for a divergence.

| Page | Divergence | Why |
|---|---|---|
| Browse | The filters sit in a plain `<details>`, closed by default: one line, "show filters", then what is set, with "clear filters" beside it. Open, three rows: age, section, and "whose" (everyone's / just mine) | Rob asked for a type filter and a way to see just his own books, without flooding the screen, folded away with the active filters still visible when closed (9 Oct, ADR 0017 amended). Same size as everything else; the underline marks the active choice as it does elsewhere |
| How it works | The copy is about books only: the intro no longer says toys and clothes, the giving steps say how adding works today, and collections are not mentioned | Rob asked for it (9 Oct). Toys, clothes and collections are Phase 4 and the page describes what exists |
| Browse, book detail | A bar that drops in from the top of the viewport names the hovered cover | Rob found small or absent titles hard to read on the shelf and asked for it (9 Oct). It exists only while a pointer is over a cover, so the canvas's clean grid is what you see at rest. At the top, not the foot, because the browser shows the link's address at the foot |
| Browse, book detail | A book with no cover art draws one of the canvas's fifty cover designs, chosen by a hash of its id | Rob asked that blank covers stay colourful like the mocks (8 Oct). Real art replaces it as soon as a book has a `cover_url` or `photo_url` |
| Add books | The corner marks sit at the frame's edges and the caption 16px up; the board draws an inner target box with the caption 24px up | The camera fills the frame, so there is no inner box to mark. Four corners at the edge say the same thing in less |
| Book detail, add books | "add a photo of the cover" under a cover with no art; a photo replaces the coloured shapes | Rob asked that anyone could fill the gaps (9 Oct, ADR 0015). Not on the canvas |
| Welcome | No board exists. The first sign-in: what this is, how it works, and the one box for the mobile number, drawn from the rules alone | Rob asked for something short on first sign-in (9 Oct, ADR 0014). A page shown once, not a pop-up |
| Requests | No board exists. Two lists grouped by person, each group a name, one WhatsApp button and its books with "asked for … ago"; drawn from the rules alone | Rob described the screen and asked for it plain (9 Oct, ADR 0013) |
| Add books | The typed number box stays underneath the camera frame, labelled "or type the number under the barcode" | A bent paperback in a dim hallway (docs/plan.md). When there is no camera or no permission the frame disappears and the box is the only way in |
| Add books | The chosen book in the pile shows section and age pickers, drawn like the age filter | The board shows them as text, pre-filled. A real lookup only guesses them, and the pile is where the person corrects the guess |
| Add books | "no barcode? photograph the cover" is not shown; "not found? type the title and author" is | Photographing a cover is Phase 4. Typing is the fallback until then |

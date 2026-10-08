# Homerton swap shop

An invite-only local site where Homerton neighbours give away kids' books (later toys and clothes) for free. Rob is the admin and moderator. A WhatsApp group runs alongside it for community and support; the site is where things are listed and reserved.

Read this file first. The screens are in `design/project/` (see "Design files" below).

## Decided

- **Free only.** No selling, no money anywhere.
- **Invite only.** Rob creates accounts by hand and hands them out. Being on the site assumes being in the WhatsApp group.
- **No addresses on the site, ever.** People share addresses privately in WhatsApp.
- **No condition or quality field.** If it is readable, it is good enough.
- **Reserve model.**
  1. Tapping "I'd like this" reserves the item at once, so nobody else can ask.
  2. The owner's WhatsApp link then appears for the requester. It is up to the requester to get in touch and collect.
  3. Either the owner or the requester can put it back on the shelf at any time.
  4. The requester ticks "we've collected it" and the item comes off the shelf. It can be undone ("not collected after all").
- **Add flow.** Scan the barcode with the phone camera; the book is looked up (title, author, cover, blurb, genre, age band) and dropped into a pile. Review the pile, then publish in one go. No barcode: photograph the cover. A collection or series goes up as one post with a photo and a rough count.
- **Browse.** All covers at once in a grid, sectioned by genre, filtered by age band (0-3, 4-6, 7-9, 10+). Reserved items stay in the grid, faded.

## Open questions

- Can invited households add their own items, or only Rob at first? Not yet confirmed.
- Reservations have no expiry. Option: a gentle nudge after a week. Not designed.
- Toys and clothes: same data model, different filters. Not designed.
- "requests", the signed-in profile, and the admin invite screen appear in the nav but have no design yet.
- Consent to share WhatsApp numbers: proposed at invite time, so reserving never surprises anyone.

## Proposed stack (not confirmed)

- Nuxt and Supabase: invite-only auth, Postgres with row-level security, storage for collection photos.
- Barcode scanning in the browser with a small JavaScript library. The built-in `BarcodeDetector` does not work on iPhone Safari.
- Lookups from Open Library (and Google Books as a fallback). Covers come from Open Library's cover service.
- A vision model reads title and author from a cover photo when there is no barcode, then feeds the same lookup.
- WhatsApp: plain `wa.me` click-to-chat links with a pre-filled message. No Business API.

## Data model sketch

`profiles`: id, first_name, whatsapp_number, is_admin, invited_by, created_at

`items`: id, owner_id, kind (`book` or `collection`), isbn, title, author, blurb, genre, age_band, cover_url, photo_url, approx_count, status (`available`, `reserved`, `collected`), reserved_by, reserved_at, collected_at, created_at

Rules:
- Reserving must be atomic: set `reserved` and `reserved_by` only if status is currently `available`, so two people cannot both win.
- Release (owner or `reserved_by`) returns to `available` and clears `reserved_by`.
- While reserved, the requester sees the owner's WhatsApp number and the owner sees the requester's first name and number. Everyone else sees only that it is reserved, not by whom.
- Never store or display addresses.

## Design

The look is deliberately plain. Hierarchy comes from spacing and grouping only.

- **Ground and ink:** white `#ffffff`, text `#262626`.
- **Type:** IBM Plex Mono 400, **one size everywhere: 12px on 18px line height**. No bold, no size changes.
- **Copy:** lowercase, plain, British English, sentence case for titles, no emoji. "I'd like this" keeps its capital I.
- **Covers lead.** Ratio 2:3, radius 2px, shadow `0 1px 1px rgba(0,0,0,0.08), 0 3px 8px rgba(0,0,0,0.10)`, a 5% dark spine strip on the left (`rgba(0,0,0,0.14)`). No text on covers in the grid. Reserved covers drop to opacity 0.35.
- **Grids:** desktop `repeat(auto-fill, minmax(96px, 1fr))` with 20px gap; phone 3 columns with 14px gap. Genre sections are 48px apart on desktop and 40px on phone. Each section has its name and a count, then 16px to the grid.
- **Buttons:** 1px solid `#262626`, white fill, min height 44px, padding 12px 14px, text left-aligned. Secondary actions are plain underlined text. The active filter is underlined.
- **Page padding:** desktop 32px top, 48px sides; phone 24px.
- **Sample genres:** picture books, early readers, chapter books, fantasy and adventure, science and nature, young adult.

## Design files

`design/project/*.dc.html` are pages from a Claude design canvas. They are visual and behavioural reference, not production code: they use a template syntax (`{{ }}` holes, `<sc-for>`, `<sc-if>`) and a `support.js` runtime that is not included. `design/project/canvas.json` holds the canvas layout and artboard names.

| File | Screen |
| --- | --- |
| `Main.dc.html` | browse, desktop (age filter works, reserved faded) |
| `Browse-phone.dc.html` | browse, phone |
| `Book-desktop.dc.html` | book detail, desktop, with a demo row to switch between the five states |
| `Book.dc.html` | book detail, phone, same states |
| `Scan.dc.html` | add books, scanning, with the pile and publish button |
| `How-it-works.dc.html` | how it works, desktop |
| `How-it-works-phone.dc.html` | how it works, phone |

The five book states are: available; reserved by you; reserved by someone else; the owner's view of a reservation; collected. The "[demo]" row in the designs is for the mock-up only and is not a feature.

The mock covers are coloured CSS shapes and the titles, authors and people (priya, sam) are invented samples. Real covers come from the lookup.

## Suggested build order

1. Scaffold, invite-only auth, and an admin screen for Rob to create accounts.
2. Items table, seed data, and the browse grid with the age filter and genre sections.
3. Book detail and the reserve, release and collected flow, with the atomic reserve rule.
4. Add flow: barcode scan, lookup, pile, publish; then cover-photo fallback and collection posts.
5. How it works page, then toys and clothes filters.

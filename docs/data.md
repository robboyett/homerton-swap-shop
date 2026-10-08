# Data shape

**Parent:** [AGENTS.md](../AGENTS.md) · **Decisions:** [plan.md](plan.md)

From Phase 1, `shared/schema.ts` is the truth and this file explains it. Until then this file is the sketch.

Two tables. If a third looks necessary, say why before adding it.

**There is also a `neon_auth` schema in the database that is not ours.** Provisioning Neon through the Vercel Marketplace created nine tables implementing a managed auth system — `user`, `session`, `account`, `organization`, `member`, `invitation`, `jwks`, `verification`, `project_config`. We did not ask for it and we do not use it: accounts are `profiles` with scrypt hashes, and `docs/allowed-deps.txt` denies `better-auth` on the grounds that invite-only accounts made by hand are a table and a hash, not a framework. Nothing in `server/` reads or writes that schema. It is left in place because dropping a schema the provider manages risks breaking the integration, not because we want it. See the open question at the foot of this file.

---

## 1. profiles

The people. Rows are made by Rob on the admin screen, never by sign-up.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `first_name` | text | First name only. It is what the other person sees |
| `whatsapp_number` | text | E.164, e.g. `+447700900123`. Shown only to the other side of a live reservation |
| `password_hash` | text | scrypt. Set from a one-time password Rob hands over |
| `is_admin` | boolean | Rob, and nobody else at first |
| `invited_by` | uuid → profiles.id | Who vouched for them |
| `created_at` | timestamptz | |

No email, no address, no surname, no postcode, no last-seen. If a field isn't here, we aren't holding it.

## 2. items

A book, or a collection posted as one.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `owner_id` | uuid → profiles.id | Who is giving it away |
| `kind` | `book` \| `collection` | A collection is one post with a photo and a rough count |
| `isbn` | text, null | Null for a collection, or a book with no barcode |
| `title` | text | From the lookup, or read off the cover, or typed |
| `author` | text, null | |
| `blurb` | text, null | From the lookup. Not written by the owner |
| `genre` | text | One of the sections in the grid |
| `age_band` | `0-3` \| `4-6` \| `7-9` \| `10+` | The only filter |
| `cover_url` | text, null | Open Library's cover service |
| `photo_url` | text, null | Vercel Blob, for a collection or a book with no cover |
| `approx_count` | integer, null | Collections only. "about 12" |
| `status` | `available` \| `reserved` \| `collected` | |
| `reserved_by` | uuid → profiles.id, null | |
| `reserved_at` | timestamptz, null | |
| `collected_at` | timestamptz, null | |
| `created_at` | timestamptz | |

No condition, no quality, no price, no location, no view count.

---

## The rules the database holds, not the UI

1. **Reserving is atomic.** One statement: set `status = 'reserved'`, `reserved_by = me`, `reserved_at = now()` **where `id = ? and status = 'available'`**. If it updates no rows, someone else won; say so plainly. Two people tapping at the same moment cannot both win.
2. **Releasing** is allowed to the owner or to `reserved_by`, and only from `reserved`. It returns `available` and clears `reserved_by` and `reserved_at`.
3. **Collecting** is allowed to `reserved_by`, and only from `reserved`. Undoing it returns to `reserved` with `reserved_by` intact.
4. **Numbers are never shown to the wrong person.** While reserved, the requester sees the owner's number and the owner sees the requester's first name and number. Everyone else sees that it is reserved, not by whom. An available or collected item shows nobody's number.
5. **Never store or display an address.** There is no field for one, and that is the point.

Authorisation is in `server/services/`, not in the pages, and not in the database: Neon has no row-level security in this design, so the service layer is the only gate. That is the cost of [ADR 0002](adr/0002-neon-not-supabase.md), and it is why rule 4 gets tests.

## Seed data

Fixtures and seeds use invented first names (`priya`, `sam`) and WhatsApp numbers from the Ofcom drama range `07700 900000`–`07700 900999`. `pnpm check` blocks anything else. Cover art in fixtures is the coloured CSS shapes from the design canvas, not real covers.

## Open questions

- The unused `neon_auth` schema above: turn the feature off in the Neon or Vercel dashboard, or leave it. Leaving it means a parallel, empty auth system sits beside ours in the same database.
- Does a collection need its own count of what's left as items go, or is "about 12" enough for its whole life? Assume the latter.
- Toys and clothes: the assumption is the same `items` table with a different `genre` vocabulary and a different filter. Nothing designed yet.

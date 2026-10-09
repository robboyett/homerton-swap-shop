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
| `email` | text, unique | The username, lower-cased. An identifier and nothing else: never shown to another member, never written to ([ADR 0009](adr/0009-sign-in-with-email.md)) |
| `first_name` | text | First name only. It is what the other person sees |
| `whatsapp_number` | text, null | E.164, e.g. `+447700900123`. Null until the person gives it at their first sign-in ([ADR 0014](adr/0014-first-sign-in-collects-the-number.md)); without one they can browse but not reserve or publish. Shown only to the other side of a live reservation |
| `password_hash` | text | scrypt. Set from a password Rob hands over, shown to him once; he sets a new one from the admin screen |
| `is_admin` | boolean | Rob, and nobody else at first |
| `invited_by` | uuid → profiles.id | Who vouched for them |
| `removed_at` | timestamptz, null | Out of the shop ([ADR 0012](adr/0012-removing-keeps-the-record.md)): cannot sign in, books removed, reservations released. An admin can let them back in |
| `created_at` | timestamptz | |

No address, no surname, no postcode, no last-seen. The email is the username and is used for nothing else. If a field isn't here, we aren't holding it.

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
| `photo_url` | text, null | Vercel Blob. Set once, by any member, on a book that has no `cover_url` and no photo yet ([ADR 0015](adr/0015-anyone-can-fill-a-missing-cover.md)); cleared only by an admin. Collections with a photo are Phase 4 |
| `approx_count` | integer, null | Collections only. "about 12" |
| `status` | `available` \| `reserved` \| `collected` \| `removed` | `removed` is set by an admin, or by the owner taking their own book down (ADR 0018); never by anyone else |
| `reserved_by` | uuid → profiles.id, null | |
| `reserved_at` | timestamptz, null | |
| `collected_at` | timestamptz, null | |
| `removed_at` | timestamptz, null | Set by an admin, or by the owner ([ADR 0018](adr/0018-owners-look-after-their-own-books.md)); the book is off the shelf for everyone and the record stays ([ADR 0012](adr/0012-removing-keeps-the-record.md)) |
| `removed_reason` | text, null | Optional note for the admin's own memory. Shown to admins only |
| `created_at` | timestamptz | |

No condition, no quality, no price, no location, no view count.

---

## The rules the database holds, not the UI

1. **Reserving is atomic.** One statement: set `status = 'reserved'`, `reserved_by = me`, `reserved_at = now()` **where `id = ? and status = 'available'`**. If it updates no rows, someone else won; say so plainly. Two people tapping at the same moment cannot both win.
2. **Releasing** is allowed to the owner or to `reserved_by`, from `reserved` **or from `collected`** (ADR 0008). It returns `available` and clears `reserved_by`, `reserved_at` and `collected_at`: a book on the shelf carries no memory of a collection that did not happen.
3. **Collecting** is allowed to `reserved_by` alone, and only from `reserved`: the person who turned up is the one who knows. **Undoing it is open to the owner as well** (ADR 0008), so a mistaken tick is not a dead end, and returns to `reserved` with `reserved_by` intact.
4. **Numbers are never shown to the wrong person.** While reserved, the requester sees the owner's number and the owner sees the requester's first name and number. Everyone else sees that it is reserved, not by whom. An available or collected item shows nobody's number.
5. **Never store or display an address.** There is no field for one, and that is the point.
6. **Removing keeps the record** ([ADR 0012](adr/0012-removing-keeps-the-record.md)). A removed book is `status = 'removed'` with `reserved_by` cleared; it is on no shelf, no page and in no "more like this", and only an admin's list shows it. A removed person has `removed_at` set; sign-in and every signed-in request treat them as nobody from that moment, their books are removed and what they held is released. Both are reversible by an admin. Nothing is deleted.

Authorisation is in `server/services/`, not in the pages, and not in the database: Neon has no row-level security in this design, so the service layer is the only gate. That is the cost of [ADR 0002](adr/0002-neon-not-supabase.md), and it is why rule 4 gets tests.

## Seed data

Fixtures and seeds use invented first names (`priya`, `sam`) and WhatsApp numbers from the Ofcom drama range `07700 900000`–`07700 900999`. `pnpm check` blocks anything else. A book with no cover art draws one of the coloured designs from the design canvas (`shared/covers.ts`), never a real cover we do not have.

## Open questions

- The unused `neon_auth` schema above: turn the feature off in the Neon or Vercel dashboard, or leave it. Leaving it means a parallel, empty auth system sits beside ours in the same database.
- Does a collection need its own count of what's left as items go, or is "about 12" enough for its whole life? Assume the latter.
- Toys and clothes: the assumption is the same `items` table with a different `genre` vocabulary and a different filter. Nothing designed yet.

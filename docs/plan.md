# Working plan

**Parent:** [AGENTS.md](../AGENTS.md)
**Status:** live. Update the decisions table as choices change.

An invite-only local site where Homerton neighbours give away kids' books (later toys and clothes) for free. Rob is the admin and moderator. A WhatsApp group runs alongside it for community and support; the site is where things are listed and reserved.

The data shape is in [data.md](data.md). The look is in [ui.md](ui.md), and the screens are in [design/](design/). Decisions and their reasons are in [adr/](adr/).

---

## Decided

This table is closed. Changing a row is a conversation with Rob and an ADR, not a PR.

| Decision | Choice | Why |
|---|---|---|
| Money | None, anywhere. Free only | It's a neighbourly swap, not a marketplace. Money changes what people expect of each other |
| Who can join | Invite only. Rob creates accounts by hand | Being on the site assumes being in the WhatsApp group. Hand-made accounts are a hundred people, not a growth problem |
| Who can add items | Any invited household, from the start | A swap, not Rob's shop. Rob-only cannot answer the one thing we most need to learn: whether anyone gives a book away unasked ([ADR 0006](adr/0006-any-household-can-add.md)) |
| Addresses | Never on the site | People share them privately in WhatsApp when they choose to. Nothing to leak if we never hold it |
| Condition or quality | No field | If it is readable, it is good enough. A quality field invites judgement nobody needs |
| Reserving | Immediate on tapping "I'd like this" | Two people asking for the same book is the thing that sours a swap. First tap wins, visibly |
| After reserving | The owner's WhatsApp link appears for the requester | The site hands over to the conversation. It never tries to be the conversation |
| Undoing | Either side can put it back on the shelf, any time, including after it was marked collected | Plans change, and "we've collected it" is one tap on a phone. A book nobody but one quiet person can put back is the worse failure ([ADR 0008](adr/0008-either-side-can-undo.md)) |
| Removing a book | Rob can take any book off the shelf. The record stays; it can go back | Moderation is Rob's job (ADR 0006). Keeping the record means a mistake is undone in one tap and a pattern stays visible to him ([ADR 0012](adr/0012-removing-keeps-the-record.md)) |
| Removing an account | Rob can put someone out of the shop: they cannot sign in, their books come off the shelf, what they held goes back. Reversible. One admin, who cannot remove himself | A neighbourhood site needs a door that closes without burning the records ([ADR 0012](adr/0012-removing-keeps-the-record.md)). Editing a name or number comes with it; a second admin does not |
| Reserving your own book | Allowed | Harmless: you see only your own number and can release it again. Not worth a rule nobody would have guessed ([ADR 0008](adr/0008-either-side-can-undo.md)) |
| Collecting | The requester ticks "we've collected it"; undoable | The person who knows is the person who turned up |
| Reservation expiry | None | A nudge after a week is an option, not a decision. See the open questions |
| Adding a book | Scan the barcode, look it up, review a pile, publish in one go | The barcode is the only thing that makes giving away twenty books bearable |
| No barcode | Photograph the cover; a vision model reads title and author, then the same lookup | Rare enough to be the fallback, common enough to need one |
| A series or collection | One post, a photo, a rough count | Twelve Beast Quest books are one decision, not twelve |
| Browsing | All covers at once in a grid, sectioned by genre, filtered by age band | Covers are how a parent chooses. Age is the only filter that matters |
| Reserved items | Stay in the grid, faded | Seeing what has gone is part of seeing the shelf |
| Age bands | 0-3, 4-6, 7-9, 10+ | Matches how people actually talk about kids' books |
| Look | Deliberately plain. One font, one size. Hierarchy from spacing alone | See [ADR 0003](adr/0003-no-component-kit.md) |
| Database | Neon Postgres with Drizzle, migration files from the first table | See [ADR 0002](adr/0002-neon-not-supabase.md) |
| Auth | Our own `profiles` table, scrypt hashes, invites by hand. The username is an email address, used for nothing else | Invite-only with no sign-up is a table and a cookie. A framework would be more code, not less. Email because everyone has one and it makes the WhatsApp number do only its one job ([ADR 0009](adr/0009-sign-in-with-email.md)) |
| Repo | Public, MIT | Other neighbourhoods should be able to take it. It also keeps us honest about what we store |

## Open questions

Rob's to answer. An agent that needs one of these answered stops and asks.

| Question | Where it stands |
|---|---|
| Should a reservation get a gentle nudge after a week? | Decided against expiry. A nudge is undesigned |
| Toys and clothes: same model, different filters? | Same data model is the assumption. Undesigned |
| Consent to share WhatsApp numbers | Proposed at invite time, so reserving never surprises anyone. Not built |
| Should people be able to change their own password? | Today the password Rob hands over is theirs until he sets another; there is no change screen (ADR 0009). Undecided |
| "requests", the signed-in profile, the admin invite screen | In the nav in the design, no screens drawn. Rob asked for them drawn plainly from `ui.md` (8 Oct): sign-in, the profile (`/account`) and the invite screen (`/admin`, with passwords Rob hands over) are built; "requests" is still undesigned |

---

## The phases

The table in [AGENTS.md](../AGENTS.md) is the enforced version; `docs/phase.md` holds the current number. What each one is for:

| Phase | What it proves |
|---|---|
| **0** | The workplace: one contract, one command, a review, and the design in the repo. No product code |
| **1** | The shelf on a URL. The grid, the age filter, genre sections, book detail in all five states, how it works. Fixture items, no database, no accounts |
| **2** | It remembers, and it's ours. Neon, sign-in, real items, and the reserve / release / collected flow |
| **3** | Adding a book is one scan, for anyone. Typed ISBN first, then the camera, then the admin invite screen ([ADR 0010](adr/0010-adding-books-before-the-invite-screen.md)). Open Library, the pile, publish |
| **4** | The long tail. Cover photos through a vision model, collections, toys and clothes |

**Phase 1 is the shelf, not accounts,** which reverses the order in the original brief. The reason is in [ADR 0004](adr/0004-the-shelf-before-accounts.md): the look is the risky part, and an invite-only site with no shelf can't be shown to anyone.

## How a reservation works

The five states a book can be in, which are the five states the design draws:

1. **available** — anyone signed in sees "I'd like this".
2. **reserved by you** — you see the owner's WhatsApp link, a "we've collected it" tick, and "put it back on the shelf".
3. **reserved by someone else** — you see that it is reserved. Not by whom.
4. **reserved, and you are the owner** — you see the requester's first name, their WhatsApp link, and "put it back on the shelf".
5. **collected** — off the shelf, with "not collected after all" to undo.

The rule that matters: **reserving is atomic.** One statement sets `reserved` and `reserved_by` only if the status is still `available`, so two people tapping at the same moment cannot both win. It gets a test before it gets a UI.

## Things we'll find out the hard way

- Whether people tick "we've collected it" at all, or whether books sit reserved forever.
- Whether Open Library has covers for British children's books from the 1990s.
- Whether a phone camera can read a barcode on a bent paperback in a dim hallway.
- Whether anyone gives away a book without Rob asking them to.

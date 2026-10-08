# Phase 1 is the shelf on a URL, before accounts

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct) · **Amended by:** [ADR 0010](0010-adding-books-before-the-invite-screen.md) (8 Oct): invites move after the first add slice

**Context.** The brief's suggested build order starts with "scaffold, invite-only auth, and an admin screen for Rob to create accounts", then the items table and the browse grid. Built in that order, the first two or three pieces of work produce nothing anyone can look at: a sign-in box in front of an empty room.

The earlier pilot (ADR 0001) learned this and built in that order deliberately: its first phase was a handful of pages on a live URL with seeded data and no database at all, and persistence did not arrive until the phase after. The reasoning it recorded was that wiring up infrastructure before anything is clickable buys dependencies rather than progress.

The risky part of this project is not the reserve logic, which is one conditional `UPDATE`. It is whether a grid of 2:3 covers at one type size, with no colour and no hierarchy beyond spacing, actually reads as a shelf a parent wants to browse. That question can only be answered by looking at it, on a phone, with sixty covers in it.

**Decision.**

1. **Phase 1 is the shelf with fixture items:** the browse grid with the age filter and genre sections, book detail in all five states, how it works, on one Vercel URL. No database, no accounts, no sign-in.
2. **Phase 2 is Neon, invites, sign-in, real items, and the reserve / release / collected flow.** The atomic reserve rule gets its test here, before its UI.
3. **The five book states are driven in Phase 1 the way the canvas drives them** — a demo switch — and that switch is removed in Phase 2. It is a mock-up affordance, never a feature.

**Consequences.** The phase table in `AGENTS.md` and `docs/plan.md` departs from the brief's numbered order, and `docs/plan.md` says so where the order is listed. Fixture items live in `shared/` and use the drama-range numbers (ADR 0005) and the canvas's coloured CSS shapes, not real covers. Phase 1 code that reads items is written against the shape in `shared/schema.ts` so Phase 2 swaps the source and not the pages.

What it costs: the fixture layer is thrown away in Phase 2, perhaps half a day. Buying a look we can judge before any of it is wired to a database is worth more than that.

What it does not change: the phases after this follow the brief — adding a book is Phase 3, and the cover-photo fallback, collections, toys and clothes are Phase 4.

**Amended 8 October 2026 (ADR 0010): invites leave Phase 2.** Decision 2 above listed invites in Phase 2. Rob moved the admin invite screen behind the first add-a-book slice, for the same reason this ADR exists: nobody should be shown an empty room, and an invitee to a shelf with nothing on it is one. Phase 2 now ends with the shelf on the database and the reserve flow live. What it costs and what it does not change are in ADR 0010. Still the shelf before accounts; the accounts simply arrive one slice later.

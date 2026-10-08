# Adding books comes before the invite screen

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** With sign-in merged (#7, ADR 0009), Phase 2 had two pieces left: the shelf and book pages reading the database with the reserve flow live, and the admin invite screen. Adding a book was all of Phase 3.

Rob asked, while #7 was being built, whether he could soon sign in and add books from his own collection. The honest answer was three PRs away, with the invite screen in the middle. He chose to move adding ahead of invites (8 Oct): the first thing he wants to do with the site is load his own shelf, and nobody can be invited to an empty one.

The option turned down was finishing Phase 2 as written. It keeps the phase table tidy and it means strangers could be invited sooner, but to a shelf with nothing on it, which is the situation ADR 0004 was written to avoid.

**Decision.**

1. **Phase 2 ends when the shelf reads the database and the reserve flow is live.** Sign-in is done; that is the one piece left.
2. **Phase 3 starts with adding by typed ISBN.** Type the number from the back of the book, look it up, review the pile, publish. That is the decided flow (`docs/plan.md`, "Adding a book") with the camera step done by hand. The camera scanner is the second slice, on top of the same lookup, pile and publish.
3. **The admin invite screen is the third slice of Phase 3,** before anyone other than Rob is invited. Until then there is one account, which is fine: the point of the order is that his shelf is full before the first neighbour arrives.
4. **`docs/phase.md` goes to 3 in the PR that starts the add slice,** not before. Nothing from Phase 3 is pulled into the shelf PR.

**Consequences.** The Phase 2 and Phase 3 rows in `AGENTS.md` and `docs/plan.md` move the invite screen one row down. `docs/plan.md`'s open-questions row for the undrawn screens says where the invite screen now sits.

What it costs: Phase 3's requirement that adding works for someone who has never seen it, on their own phone, cannot be tried on a stranger until the invite screen exists. The first add slice will be tested by the person who built it and by Rob, which is exactly the blind spot ADR 0006 warns about. The camera and invite slices follow close behind, so the gap is short, and the order is reversible at any point.

What it does not change: the Decided table. Adding is still by scan; typing the ISBN is the same lookup with the barcode read by eye. Still invite only, still free, still two tables.

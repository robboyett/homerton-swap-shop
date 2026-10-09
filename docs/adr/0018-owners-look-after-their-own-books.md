# An owner can take their own book off the shelf and correct its section or age

**Date:** 9 October 2026 · **Status:** accepted (Rob, 9 Oct)

**Context.** Until now a listing, once published, could be changed by nobody and taken down only by an admin (ADR 0012). Before the first neighbours arrive, that is the gap most likely to bite first: a book given away at the school gate stays on the shelf until Rob is asked; a section or age the lookup guessed wrong stays wrong. Rob agreed to close it (9 Oct) as part of the pre-launch list.

**Decision.**

1. **An owner can take their own book off the shelf.** It is the same move as the admin's removal: status `removed`, record kept, reservation ended, reason "taken down by the owner". The guard is `owner_id = viewer` in the WHERE clause, like every other rule. An owner cannot put it back; the admin screen can, and nothing stops the owner adding it again.
2. **An owner can change their own book's section or age band.** The same two pickers as the pile. Nothing else is editable: title, author, blurb and cover came from the lookup or from the person at the time, and a wrong one is a reason to take the book down and add it again.
3. **Both sit on the book page, for the owner only,** as text actions under the reservation block, the way the admin's sit. "take it off the shelf" asks once more before it acts, as the admin screen does. The admin's own button hides on a book they own, since the owner's does the same.

**Consequences.** Two services, `withdrawItem` and `reshelve`; two routes, `POST /api/items/:id/withdraw` and `PATCH /api/items/:id`; a Decided row in `docs/plan.md` under "Removing a book"; a runbook row. The book page already knows which books are yours (ADR 0017).

What it costs: a second way a book leaves the shelf, which the admin list shows with its reason, and a change of section that moves a book between grid sections without a trace. Neither is worth a history table for a hundred people. What it does not change: nobody can edit anyone else's listing; a removed book is still off the shelf for everyone; rule 4 is untouched.

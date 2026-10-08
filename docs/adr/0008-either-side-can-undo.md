# Either side can undo at any point, and an owner may reserve their own book

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** The reservation rules were implemented in `server/services/items.ts` and then read back by a fresh-session review, which found two things the documents did not settle.

The first was a contradiction. `docs/plan.md` has said since the brief that undoing is open to *"either the owner or the requester… at any time"*, and the book detail page offers "not collected after all" to whoever is looking. But the code restricted `uncollect` to `reserved_by` and refused `release` from `collected` at all. So the moment someone ticked "we've collected it" — including by accident, which is one tap on a phone — the owner had no move left. If that person then went quiet, the book was stuck off the shelf and only they could unstick it. For a swap that runs on neighbours being relaxed about chasing each other, that is the wrong failure.

The second was simply undecided: nothing said whether an owner may reserve their own book, and the guard is on status alone, so they could. A test asserted it and called it harmless, which is a test deciding product behaviour.

Rob settled both on 8 Oct, reviewing the first implementation.

**Decision.**

1. **Either side may undo, at every point.** `uncollect` accepts the owner as well as `reserved_by`. The person who turned up is the one who knows whether they did; the owner is the one who can rescue a book from a mistaken tick.
2. **`release` works from `collected` as well as `reserved`.** An owner can put a wrongly-collected book straight back on the shelf in one move rather than undoing and then releasing. It clears `collected_at` along with the rest: a book on the shelf carries no memory of a collection that did not happen.
3. **An owner may reserve their own book.** No extra condition joins the WHERE clause. It is visible rather than accidental now, and it is harmless: they see only their own number, and they can release it again like anyone else.

**Consequences.** `release` and `uncollect` each gain the owner to their `or(...)`, and `release` widens from one status to two. `docs/data.md` rules 2 and 3 are rewritten to match, and `docs/plan.md` gains a row for point 3. Three tests change and two are added: release-from-collected now succeeds for either side and is still refused to a bystander, and uncollect now succeeds for the owner.

What it costs: two ways out of `collected` instead of one, which is a little more surface to hold in your head and two more tests to keep true. The alternative cost was a book that nobody but one quiet person could put back, which is worse.

A loose end this creates: `bookState` in `shared/schema.ts` returns `collected` for every viewer, so the page cannot yet tell who may undo. The button is offered to everyone and a bystander's tap would simply return false. Fail-closed, but the page should stop offering it; that belongs with the PR that wires the page to the database.

What it does not change: reserving is still the one atomic guard, and still `status = 'available'` and nothing else. A bystander still cannot release, collect or undo anything. Nobody's number is shown to anyone outside a live reservation.

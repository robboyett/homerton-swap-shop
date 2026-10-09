# "requests" is everything live between you and each other person, grouped by them and dated

**Date:** 9 October 2026 · **Status:** accepted (Rob, 9 Oct)

**Context.** The canvas nav has carried "requests" since the first board, with no screen behind it. `docs/plan.md` listed it as an open question. Rob asked what the plan was and, offered a sketch, described the screen he meant (9 Oct):

> group the things you've asked for … by household or person that you've asked them from, so when you walk around you can collect them all in one go and tick them off from there … and a similar thing for ones that people have requested from you … date stamped as well, so if someone's spent six weeks not coming you can release that book again.

That is a different cut of data the site already holds. A book page is about one book and whoever is on the other side of it. Requests is about a person and all the books between you and them.

**Decision.**

1. **Two lists: "you've asked for" and "asked of you".** The first is every book you hold a live reservation on; the second is every book of yours someone else holds. Only `reserved` books appear: collected ones have left the conversation, available ones have no other person in them.
2. **Grouped by the other person,** owner on the first list, requester on the second, so one walk collects one household's books and one message arranges it. Each group carries the person's first name, their WhatsApp number as one link for the whole group, and their books. Rule 4 holds exactly as on a book page: these are the `mine` and `owner` states and nobody else's number ever appears.
3. **Every book is dated from when it was asked for,** in plain words: "asked for today", "asked for 6 weeks ago". No nudge, no expiry, no colour: the date is there so a person can decide (`docs/plan.md`, "Reservation expiry"). Groups are ordered oldest-ask first, so the one that has waited longest is at the top.
4. **The same moves, from the list.** "we've collected it" and "put it back on the shelf" on the first list; "put it back on the shelf" on the second. They call the same four routes as a book page. A book ticked as collected stays in the list, marked, with "not collected after all", until the list next reloads, so a slip is one tap to undo; a book put back disappears from its group without a reload, so the ticked ones stay put.
5. **Reserving your own book** (ADR 0008) shows under "you've asked for", grouped under yourself, and not under "asked of you". One line in one place rather than two.

**Consequences.** `server/services/items.ts` gains one read, `requestsFor`, which is a projection like `bookPage`; `GET /api/requests`; `app/pages/requests.vue`; the nav item becomes a link and the phone footer gains it. `docs/plan.md`'s open-questions row loses "requests" and the Decided table gains a row. Drawn plainly from `docs/ui.md`, with no canvas board, which is how Rob asked for the undrawn screens (8 Oct).

What it costs: a second place the four moves can be made from, so the book page and this list can each be stale about the other for the length of a tap; both answer a refused move with the current state, as they already did. And a page that, for most people most of the time, says "nothing live".

What it does not change: no expiry, no nudge, no new data. Numbers are shown only to the two sides of a live reservation. A removed book is on neither list.

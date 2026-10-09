# Rob can take a book off the shelf or an account out of the shop, and both keep their records

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** ADR 0006 made Rob moderator of other people's posts the moment anyone could post, and `docs/plan.md` has always called him admin and moderator. Until now the admin screen could only make accounts (#12). Rob asked, the same evening, for the other half: *"an admin screen to manage accounts and remove books from people's accounts."*

Two choices were put to him and he answered both (8 Oct):

- **A removed book: delete it, or take it off the shelf and keep the record?** Deleting is simpler and leaves nothing to leak. Keeping the record means a new status and a note, but a mistaken removal can be undone, and a pattern of posts worth removing stays visible to the person moderating. Rob chose to keep the record.
- **What does "manage accounts" mean?** Remove an account, edit a first name or number, make a second admin. Rob chose the first two and not the third: still one admin.

**Decision.**

1. **A book can be removed by an admin, and removal is a status, not a deletion.** `items.status` gains `removed`, with `removed_at` and an optional `removed_reason` for Rob's own memory. A removed book is off the shelf for everyone, its page is a 404, and any reservation on it ends: the holder's view simply stops showing it. Only the admin screen lists it, with "put it back on the shelf", which returns it as available.
2. **An account can be removed by an admin, and that too is a mark, not a deletion.** `profiles.removed_at` set means: they cannot sign in, their cookie stops working on its next request, every book they own becomes removed (reason "account removed"), and anything they had reserved goes back on the shelf. "Let them back in" clears the mark; their books stay removed until Rob restores them one by one, on purpose.
3. **An admin can correct a first name or a WhatsApp number.** Nothing else about a person is editable from the screen; the email is the username and changes only with a new account.
4. **An admin cannot remove themself, and there is still one admin.** The route refuses the admin's own id. A second admin is a conversation, not a tick box.
5. **Removing an account is three statements, not one transaction.** Reservations released, books removed, account marked, in that order, each a single UPDATE. Neon over HTTP has no transactions (ADR 0002) and the three are idempotent, so a half-done removal is finished by pressing the button again.

**Consequences.** Migration `0003` adds the enum value and three nullable columns; `shared/schema.ts`'s `STATUSES` gains `removed`, and every read of the shelf excludes it as it excludes `collected`. `docs/data.md` gains the fields and a sixth rule. `docs/plan.md`'s Decided table gains two rows. The admin screen gains a books list and, per member, edit and remove. A book page shows an admin an extra text button, "take it off the shelf".

What it costs: a fourth status in a set that was proud of having three, and two "soft delete" columns, which is exactly the kind of field this project turns down when it is for a future that is not in the table. Here it is for a decision Rob made, with the alternative in front of him. The other cost is that removed books and removed people are still in the database: a public repo with a private database was always the arrangement, and nothing removed is ever shown to a neighbour.

What it does not change: rule 4. A removed book shows nobody's number, because it shows nobody anything. Still invite only, still free, still two tables, still one admin.

**Amended 9 October 2026 (the fresh review of this PR): three things said plainly.** First, "their cookie stops working on its next request" was not true as first written: only the admin routes checked the database, and the ordinary ones trusted the sealed cookie, so a removed neighbour with an open tab could have kept publishing and reserving until a reload. Now every signed-in request looks the person up (`requireViewer` in `server/utils/session.ts`), one small query each, and the sentence is true. Second, "keeps the record" keeps the book, not its reservation history: removing a book clears who held it and whether it was collected, and restoring it puts it back as available with no reason attached. The pattern an admin might want to see is the removed books themselves, while they stay removed. Third, the edit form asks for a new number only if there is one; it never shows the old one, because rule 4 keeps numbers off the admin screen too.

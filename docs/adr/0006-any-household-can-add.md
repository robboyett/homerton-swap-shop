# Any invited household can add items, not only Rob

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** The original brief left this open: *"Can invited households add their own items, or only Rob at first? Not yet confirmed."* It stayed open through Phase 0 and Phase 1, and `docs/plan.md` listed it as Rob's to answer.

It had to be settled before Phase 2, because it decides what the admin screen is for. If only Rob can post, `/admin` is where items are created and the invite screen is a side feature. If anyone can, `/admin` is only ever about invites, and `owner_id` is whoever was signed in.

Rob was asked directly and chose any invited household, from the start (8 Oct). The reason he gave: a swap where only one person can post is a catalogue of one loft, and the WhatsApp group would still be doing the real work. The site exists to take that job off the group.

Turned down: Rob-only at first, widening later. It is the smaller Phase 2 and easy to widen, but it would have made the pilot a different product — one where neighbours receive rather than swap — and the thing we most need to find out is whether anyone gives a book away without being asked (`docs/plan.md`, "things we'll find out the hard way"). Rob-only cannot answer that question.

**Decision.**

1. **Anyone signed in can add an item, and owns it.** There is no separate contributor role. `owner_id` is the person who posted it; `is_admin` governs invites and moderation, nothing else.
2. **"From the start" means from the moment adding exists, which is Phase 3.** It pulls nothing into Phase 2. Phase 2's admin screen is about invites only.
3. **The add flow has to work for someone who has never seen it**, on their own phone, in a hallway, with a stack of books. That requirement is now in the Phase 3 row of the `AGENTS.md` phase table, because it changes what "done" means for that phase rather than adding anything to it.

**Consequences.** `docs/plan.md`'s "Decided" table gains a row and its "Open questions" table loses one. Phase 2 gets slightly smaller: no item-creation UI in `/admin`. Phase 3 gets harder in a way that is not visible in its dependency list, which is why it is written into the phase table as a requirement.

What it costs: the scan flow can no longer be good enough for the person who built it. It needs the error states a stranger hits — a barcode that will not read, a book the lookup does not know, a cover photographed in bad light — and those are most of the work in Phase 3. Moderation also becomes real: Rob is moderator of other people's posts, not just author of his own.

What it does not change: still invite-only, so "anyone" means anyone Rob has let in. Still free, still no addresses, still no condition field. Still two tables: `owner_id` already exists in `shared/schema.ts` and already supports this, and `bookState` already distinguishes the owner's view, so no schema change falls out of this.

**On the record of this decision.** A fresh-session review of the first attempt at this change could not verify that Rob had decided it: the row cited him, but nothing in the repo did, and `AGENTS.md` reserves both answering an open question and changing the Decided table to Rob. The reviewer was right to stop. Decisions reached in conversation leave no trace a reviewer or a stranger can check, and `docs/plan.md` already says a Decided-table row changes by "a conversation with Rob and an ADR, not a PR". This file is that ADR, and writing it is what makes the attribution checkable.

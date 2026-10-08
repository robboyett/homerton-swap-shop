# Any invited household can add items, not only Rob

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct) · **Amended by:** [ADR 0010](0010-adding-books-before-the-invite-screen.md) (8 Oct): the invite screen now follows the first add slice

**Context.** The original brief left this open: *"Can invited households add their own items, or only Rob at first? Not yet confirmed."* It stayed open through Phase 0 and Phase 1, and `docs/plan.md` listed it as Rob's to answer.

It had to be settled before Phase 2, because it decides what the admin screen is for. If only Rob can post, `/admin` is where items are created and the invite screen is a side feature. If anyone can, `/admin` is only ever about invites, and `owner_id` is whoever was signed in.

Rob was asked directly and chose any invited household, from the start (8 Oct), while reviewing the Phase 1 shelf (#4, #5). The reason he gave: a swap where only one person can post is a catalogue of one loft, and the WhatsApp group would still be doing the real work. The site exists to take that job off the group.

Turned down: Rob-only at first, widening later. It is the smaller Phase 2 and easy to widen, but it would have made the pilot a different product — one where neighbours receive rather than swap — and the thing we most need to find out is whether anyone gives a book away without being asked (`docs/plan.md`, "things we'll find out the hard way"). Rob-only cannot answer that question.

**Decision.**

1. **Anyone signed in can add an item, and owns it.** There is no separate contributor role. `owner_id` is the person who posted it; `is_admin` governs invites and moderation, nothing else.
2. **"From the start" means from the moment adding exists, which is Phase 3.** It pulls nothing into Phase 2. Phase 2's admin screen is about invites only.
3. **The add flow has to work for someone who has never seen it**, on their own phone, in a hallway, with a stack of books. That requirement is now in the Phase 3 row of the `AGENTS.md` phase table, because it changes what "done" means for that phase rather than adding anything to it.

**Consequences.** `docs/plan.md`'s "Decided" table gains a row and its "Open questions" table loses one. Phase 3 gets harder in a way that is invisible in its dependency list, which is why it goes into the phase table as a requirement rather than an allowance. Phase 2 is unchanged: its admin screen was always about invites.

What it costs: the scan flow can no longer be good enough for the person who built it. It needs the error states a stranger hits — a barcode that will not read, a book the lookup does not know, a photo that fails to upload — and those are most of the work in Phase 3. Reading a cover with a vision model stays in Phase 4; this is not licence to pull it forward. Moderation also becomes real: Rob is moderator of other people's posts, not just author of his own.

What it does not change: still invite-only, so "anyone" means anyone Rob has let in. Still free, still no addresses, still no condition field. Still two tables: `owner_id` already exists in `shared/schema.ts` and already supports this, and `bookState` already distinguishes the owner's view, so no schema change falls out of this.

**On the record of this decision.** A fresh-session review of the first attempt (#4) could not verify that Rob had decided it: the row cited him, but nothing in the repo did, and `AGENTS.md` reserves both answering an open question and changing the Decided table to Rob. The reviewer was right to stop.

This file does not fix that, and it would be dishonest to claim otherwise. An ADR records a claim; it does not evidence one. "Accepted (Rob, 8 Oct)" is prose, written by the agent, in the same commit as the change — from inside the repo it is indistinguishable from an invention. The second review said so plainly and was right.

What the ADR does is narrower and still worth having: it puts the claim where a reader looks for it, with a date, the reasoning Rob gave, and the option that was turned down, so that anyone who later disagrees argues with a specific paragraph instead of a table cell. That is the most the repo's own convention offers (`skills/write-adr`: "record what he said, with the date"), and ADRs 0002 and 0005 rest on exactly the same footing. Decisions taken in conversation leave no artefact; this is the artefact, not the proof.

**Amended 8 October 2026 (ADR 0010): the invite screen is a Phase 3 slice.** Decision 2 above said Phase 2's admin screen is about invites only. It still is about invites only, but it is no longer in Phase 2: Rob put adding books ahead of it, so his shelf is full before the first neighbour arrives. Point 3's requirement, that adding works for someone who has never seen it, is therefore tested on a stranger a little later than written; ADR 0010 names that as the cost. Still any invited household can add, from the moment adding exists.

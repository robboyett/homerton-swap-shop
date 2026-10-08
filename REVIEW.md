# REVIEW.md: fresh-session checklist

**When:** From Phase 1, on every PR, **in a new session**, not the one that wrote the code.
**Who merges:** Claude, when this comes back clean and `pnpm check` is green. Rob reads the merged history.

The session that held the plan is the worst judge of whether the plan was right. Same reason you don't proofread your own copy.

No severity levels. Three passes. If something fails, say what and where, then fix it or write an ADR. If a pass turns up a product question, stop and ask Rob — that's the one thing a green check can't settle.

Passes 1 and 2 are partly enforced by `pnpm check`. Here you confirm the gate ran green and catch what it can't: a later-phase *capability* that needed no new dependency, or a seam that exists but was bypassed by copy-paste.

---

## Passes

1. **Later phase, or more engineering than asked for?**
   Does this add a capability belonging to a later phase than `docs/phase.md`? Dependencies are already gated; look at new folders, services and routes. Then the softer half: is there an abstraction, config layer, or "for later" field here that nothing in the phase table needs? Simplicity over engineering is a rule, not a mood.

2. **Seams, and invented product behaviour?**
   Does anything outside `server/services/` reach a vendor, or redo what a service already does? Then: is the behaviour the one `docs/plan.md` decided? Items are free, always. A reservation is immediate, releasable by either side, and undoable after collection. No condition field, no expiry, no money, no addresses.

3. **Anything that shouldn't be public?**
   This repo is open. Real phone numbers (the gate catches UK mobiles; read the diff for international ones), real email addresses (no gate yet; seeds and tests use `@example.com`, ADR 0009), real names beyond invented first names, addresses, `.env` contents, API keys, session tokens, a real person's WhatsApp link.

---

## How to run

1. Open a **fresh** session on the PR branch.
2. "Run REVIEW.md on this change."
3. Read the three answers. Fix, ADR, or ask Rob. Merge only when all three are clean.

Automate on every PR later if the checklist stops changing. Hand-run first.

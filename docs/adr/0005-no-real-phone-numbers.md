# No real phone numbers in the repo, held by a gate and not a rule

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** Rob is making this repo public so other neighbourhoods can take it. The product's entire job is handing one neighbour's WhatsApp number to another, so phone numbers are the main thing it touches, and a reserve flow is hard to build without an example number in front of you — in a fixture, a seed, a test, a doc, a commented-out line.

A number committed to a public repo is public forever. Rewriting history does not reach forks, caches or the GitHub events API. There is no undo, which makes this different in kind from every other rule in `AGENTS.md`: the others cost a revert.

Ofcom reserves `07700 900000`–`07700 900999` for use in drama and fiction. The numbers are permanently unallocated, so one cannot ring a real person.

**Decision.**

1. **Every number in the tree comes from the Ofcom drama range.** Seeds, fixtures, tests, docs, examples.
2. **`scripts/no-real-numbers.mjs` is part of `pnpm check`.** It walks the text files, matches UK mobiles written any way (`07…`, `+44 7…`, `447…`, with spaces, dots, dashes or brackets), and blocks anything outside the range, naming the file and line. Lookbehind and lookahead keep it off longer digit runs, so ISBNs do not trip it — which matters, since this repo is full of them.
3. **Real numbers exist only in the database,** entered by the person they belong to, shown only to the other side of a live reservation (`docs/data.md`, rule 4).

**Consequences.** `pnpm check` gains a third house script and a test file that pins both the range boundaries and the ISBN cases. An agent that reaches for a plausible-looking number is stopped while it is still in the chair rather than at review. The runbook's first row is the block message.

What it costs: the gate only knows UK mobiles. An international number, a landline, or a number split across two lines of source would pass, so `REVIEW.md`'s third pass still reads the diff with human eyes.

What it does not change: addresses have no field at all, which is a stronger guarantee than a gate (`docs/plan.md`). Phone numbers need the gate because, unlike addresses, we genuinely do store them.

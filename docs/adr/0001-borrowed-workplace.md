# The workplace is borrowed from an earlier client pilot, shrunk to one builder

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** Rob has run two recent projects worth copying from: a bench repo for an LLM experiment, and a client product pilot. The bench's spine is "run it many times, score the output against hand-written ground truth", and four of its seven documents exist only to serve that. This project is a small product build, so the pilot is the closer match: same stack (Nuxt, TypeScript, pnpm), same working mode (a non-engineer steering coding agents), and a design that came out of a Claude canvas.

The pilot's own summary of why it works is one line in its `AGENTS.md`: *skills advise, `pnpm check` enforces, humans judge*. Its two gate scripts exist because prose rules didn't hold — an agent would quietly `pnpm add` something, or have a page talk to the database directly.

But the pilot is sized for a client engagement with two builders: 18 ADRs, six planning documents, a 200-line runbook, a weekly upkeep ritual with its own skill. Taken whole, that apparatus would be the largest thing in this repo.

**Decision.**

1. **Take the gates, not the ceremony.** `AGENTS.md` as the single contract with `CLAUDE.md` pointing at it, `docs/phase.md` as one number, `docs/allowed-deps.txt` with `scripts/deps-allowed.mjs`, a one-seam version of `scripts/seams.mjs`, lefthook, the committed Stop hook, `REVIEW.md`, and the runbook's symptom/cause/what-to-do format.
2. **Shrink what we take.** `REVIEW.md` is three passes, not five: the Nuxt UI pass doesn't apply (ADR 0003), and the phase and seam passes fold together. One seam (`server/services/`), not three. The pilot's three planning documents become one `docs/plan.md`.
3. **Drop the weekly ceremony.** The jot list in `docs/notes.md` is kept, because "explain twice, write it down" is the habit that compounds. The Friday `upkeep` skill and its log are not: a weekly ritual for a neighbourhood book site is theatre. The list getting long is the signal instead.
4. **Drop the client artefacts.** The pilot's security overview, GxP review, platform planning, pipeline decomposition, sprint docs, test-asset folders, and the two explainer pages written for a second builder. There is no second builder and no client.
5. **Add one gate the pilot has no need for:** `scripts/no-real-numbers.mjs` (ADR 0005).

**Consequences.** `pnpm check` is `biome + nuxt typecheck + vitest + deps-allowed + seams + no-real-numbers`, and it has real tests from Phase 0 because the three scripts are tested. The workplace is about 15 files. Adding a dependency is a visible line in a PR, and a later-phase dependency fails the command rather than getting a comment.

What it costs: three small scripts to maintain, and a phase number that has to be bumped deliberately. What it rules out: discovering in week three that the repo grew a component library, a config layer and an analytics vendor while nobody was looking.

What it does not change: the pilot repo is never imported, vendored, or linked. Files were copied once and adapted, and nothing client-specific survived the copying. That repo is private and under client confidentiality, so it is not named here and neither is anything it was built for; what is borrowed is a way of working, which belongs to nobody.

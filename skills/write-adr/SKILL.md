---
name: write-adr
description: Write or amend a decision record in docs/adr/. Use before the code for any non-trivial choice (a new vendor or dependency, new persistence, a phase bump, a change to what a reservation means, a change to what we store or show about a person), and whenever AGENTS.md says "write an ADR and stop". One markdown file, why not what.
---

# Write an ADR

An ADR records a choice and the reason for it, so the next session does not reopen it by accident or undo it without knowing what it cost. It is not a design document and not a changelog. Half a page is normal.

Read `docs/adr/0002-neon-not-supabase.md` and `docs/adr/0005-no-real-phone-numbers.md` first, for the voice.

## Before you write

1. **Whose decision is it?** Product behaviour is Rob's, never yours (`AGENTS.md`: don't invent product behaviour). The "Decided" and "Open questions" tables in `docs/plan.md` are his. If the choice hasn't been made, stop and ask; then record what he said, with the date: "Rob chose Neon (8 Oct)".
2. **New record, or an amendment?** A new decision gets a new file. One that changes an existing decision amends that file. If it is big enough to stand alone but changes an old one, do both: a new file saying **Amends:** the old one, and a line in the old file's header pointing forward.
3. **Does it touch what we store or show about a person?** Then `docs/data.md` changes in the same PR, and so does `docs/plan.md` if a row in "Decided" moves.

## The file

`docs/adr/NNNN-short-kebab-title.md`, numbered from the last one. The title is the decision itself, as a sentence someone could disagree with: "Data is Neon with Drizzle, and migrations are files from the first table", not "Database choice".

```markdown
# <The decision, as a statement>

**Date:** 8 October 2026 · **Status:** accepted

**Context.** What forced a choice, in plain words: the test, the conversation, the thing that broke, with its PR number. What was on the table and what each option cost. Name who chose and when.

**Decision.**

1. **The rule, in bold, as one sentence.** Then a sentence or two on what it means in practice.
2. …

**Consequences.** What changes in the repo, by path. What it costs: a dependency, a bit of hand-written code, a thing a reader will now see. What it rules out. End by saying what it does not change.
```

Status is `accepted`, or `accepted (Rob, 8 Oct)` when the say-so matters. We don't use proposed or superseded: an ADR that was never accepted is a PR comment, and one that is overtaken is amended.

## Amending

Add a dated paragraph at the foot of the ADR it changes. Never rewrite the original decision; the history is the point.

```markdown
**Amended 15 October 2026 (#12): <what changed, as a phrase>.** What made the original fall short. What is now true. What it costs. End with what did not change ("Still two tables." "Still no addresses.").
```

Then add to the earlier file's header: `· **Amended by:** [ADR 0007](0007-….md) (15 Oct): <one clause>`.

## What makes a good one here

- **Why, not what.** The code says what. Put in what the code cannot: the options turned down, who decided, what went wrong first.
- **Evidence over argument.** Quote the thing that happened — a runbook row, a measurement, a failed run.
- **Say what it costs.** Every decision here has a price. If you can't name one, you haven't understood the decision.
- **Say what it does not change.** The closed sets matter: free only, invite only, no addresses, no condition field, two tables. If yours leaves them alone, say so. If it touches one, that is the headline.
- **Plain words.** British English. This repo is public and strangers will read it.
- **Short.** If it needs three pages, it is a section in `docs/plan.md` with an ADR pointing at it.

## In the same PR

- The ADR lands **with or before** the code it decides, never after.
- A new dependency also goes in `docs/allowed-deps.txt` with its phase.
- A new way to fail gets a row in `docs/runbook.md`.
- Say in the PR description which paragraph is the decision, so the reviewer reads that before the diff.

## Not an ADR

A bug fix, a refactor, wording, a test, a divergence from the canvas (that is a row in `docs/ui.md`'s table). When unsure, ask: would someone a month from now wonder why we did this, and be tempted to undo it? If yes, write it.

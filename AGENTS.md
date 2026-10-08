# AGENTS.md: Homerton swap shop

`CLAUDE.md` is one line: `@AGENTS.md`. One contract, not two.

Rob is the only human here. This file is how we stay consistent across sessions. If a habit isn't written here, it isn't a habit.

**Skills advise. `pnpm check` enforces. Rob decides the product.**

---

## What this is

An invite-only site where Homerton neighbours give away kids' books for free. Rob is admin and moderator. A WhatsApp group runs alongside it: the site lists and reserves, WhatsApp arranges.

The product decisions are in [docs/plan.md](docs/plan.md). The data shape is in [docs/data.md](docs/data.md) and `shared/schema.ts`. The look is in [docs/ui.md](docs/ui.md) and the canvas in `docs/design/`.

Read those before writing code. Don't invent product behaviour; the "Decided" table in `docs/plan.md` is closed, and the "Open questions" table is Rob's to answer, not yours.

## How long this code lives

A free site for one neighbourhood, maybe a hundred people. It will not be scaled, sold, or multi-tenanted.

So: **simplicity over engineering.** Boring and legible beats extensible. No abstraction layer, no config system, no "for later" field for a future that isn't in the phase table. If you are reaching for one, stop and ask.

The repo is public so other neighbourhoods can copy it. That is a reason to keep it small and readable, not a reason to make it general.

## The repo is public

- **No real phone numbers, anywhere.** Seeds, fixtures, tests and docs use the Ofcom drama range `07700 900000`–`07700 900999`. `pnpm check` blocks any other UK mobile number in the tree. This is the one rule that cannot be undone once it's pushed.
- **No addresses, ever.** Not in the database, not in the UI, not in a seed. People share addresses privately in WhatsApp.
- **No real names** beyond first names in seed data, and those are invented (`priya`, `sam`).
- Secrets live in `.env`, which is gitignored. `.env.example` names them with no values.

---

## Current phase

Read `docs/phase.md` (one line: `0` | `1` | `2` | `3` | `4`). Don't add a dependency or a capability that belongs to a later phase. If you think we should move, write an ADR and stop.

The dependency side is enforced by `pnpm check` against `docs/allowed-deps.txt`. Prose is not enough.

| Phase | What it proves | Allowed to add |
|---|---|---|
| **0** | The workplace | This file, `CLAUDE.md`, `docs/`, `.claude/`, Biome, lefthook, `pnpm check`, `REVIEW.md`, an empty Nuxt shell |
| **1** | The shelf, on a URL | Pages, the browse grid with the age filter and genre sections, book detail and its five states, how it works, fixture items, `shared/schema.ts`, plain CSS, one Vercel URL |
| **2** | It remembers, and it's ours | Neon, Drizzle with migration files, a `users` table with scrypt hashes, the admin invite screen, real items, and the reserve / release / collected flow with the atomic rule |
| **3** | Adding a book is one scan, for anyone | Barcode scanning in the browser, Open Library lookup, the pile, publish, Vercel Blob for photos. Any invited household can add (ADR 0006), so this has to work for someone who has never seen it before, on their own phone |
| **4** | The long tail | Cover-photo fallback through a vision model, collection posts, toys and clothes filters |

**Out until an ADR says otherwise:** a component kit (ADR 0003), Tailwind, Supabase, selling or money of any kind, public sign-up, addresses on the site, a condition or quality field, the WhatsApp Business API, reservation expiry, analytics.

---

## How we work

- **Small, atomic PRs.** One concern; the description says what and why.
- **Never push straight to `main`.** Branch, PR, preview, merge.
- **Base every PR on `main`, never on another PR's branch.** If one depends on another, wait for the first to merge, then branch from `main`.
- **Fresh-session [REVIEW.md](REVIEW.md) before merge,** in a new session, not the one that wrote the code.
- **Claude merges.** When `pnpm check` is green, the preview looks right, and REVIEW.md comes back clean, merge it. Say in the PR what you checked. Rob reads the merged history, not every diff.
- **But stop and ask Rob** before: answering anything in the "Open questions" table; changing anything in the "Decided" table; adding a dependency; bumping `docs/phase.md`; touching how phone numbers are stored or shown; deleting or migrating live data; making the repo public; anything you can't undo.
- **Don't "fix" a failing test by changing the test.** Fix the code. If the only way to make it pass is to edit the test, say so and stop.
- **Explain twice, write it down.** The second time Rob explains something, it goes in this file or the relevant `docs/` file before work continues.
- **ADRs** in `docs/adr/` for non-trivial choices: a new vendor, new persistence, a phase bump, a change to what a reservation means. One markdown file, why not what. Use `skills/write-adr`.
- **Settings and skills live in this repo**, not only in a personal `~/.claude`. If it's useful to the next session, commit it.
- **One seam.** `server/services/` is the only place a vendor package may be imported. Pages and API routes import from `server/services/` only. Phase 1 implementations are allowed to be stupid (fixtures in memory, no auth).
- **Components: plain CSS, no kit.** The design is one font at one size (ADR 0003). If you want a component library, that's a conversation, not a `pnpm add`.

---

## Mechanical gates: one command

```
pnpm check    # biome + typecheck + tests + deps-allowed + seams + no-real-numbers
```

Three small scripts hold the rules that prose can't:

- **`deps-allowed`**: every dependency in `package.json` must be in `docs/allowed-deps.txt` at or below the current phase. Adding one is a visible line in the PR.
- **`seams`**: no file outside `server/services/` imports `drizzle-orm`, `@neondatabase/serverless`, `@vercel/blob` or `ai`.
- **`no-real-numbers`**: no UK mobile number outside the Ofcom drama range, anywhere in the tree.

Every gate that blocks prints one line starting `BLOCKED: <name>:` with the reason and where to look. Silent gates are the hardest thing to debug.

| Moment | Runner |
|---|---|
| Agent about to report done | Claude Code Stop hook in committed `.claude/settings.json` (guarded on `stop_hook_active`, so it doesn't fire when stopping to ask a question) |
| Local commit | lefthook |
| Every PR | GitHub Actions (Phase 4) |

---

## When it breaks

- One logger, `server/utils/logger.ts`. No `console.log` in product code.
- `docs/runbook.md`: when you add a way something can fail, add a row. Symptom, cause, what to do.
- Jot anything you had to be told twice, or anything the contract should have stopped, at the top of `docs/notes.md`. When that list gets long, turn each line into a rule in `pnpm check` or an edit to a doc.

---

## Agent files

| File | Job |
|---|---|
| `AGENTS.md` (this) | The contract |
| `CLAUDE.md` | `@AGENTS.md` |
| `.claude/settings.json` | Committed: Stop hook + permissions allowlist |
| `REVIEW.md` | Fresh-session review, three passes |
| `docs/README.md` | Repo map. Add a line when you add a top-level folder. |
| `docs/phase.md` | Single current phase number |
| `docs/allowed-deps.txt` | Dependency allow-list, one per line with phase |
| `docs/plan.md` | What we're building and what's decided |
| `docs/data.md` / `shared/schema.ts` | Data shape. The zod schema is the truth from Phase 1; the markdown explains. |
| `docs/ui.md` | The look, and where shipped pages diverge from the canvas |
| `docs/adr/` | Decisions, why not what |
| `docs/runbook.md` | Symptom, cause, what to do |
| `docs/notes.md` | The jot list |
| `docs/design/` | The Claude design canvas. Visual truth for styling; never app code. |
| `skills/` | `write-adr`. Add more only after needing them twice. |
| `biome.jsonc`, `lefthook.yml` | Lint + format; commit gate |

---

## Stack lock

Nuxt 4 + Nitro + TypeScript + pnpm, plain CSS, hosted on Vercel. Data is Neon + Drizzle with migration files (ADR 0002). Files are Vercel Blob from Phase 3. Auth is our own `users` table with scrypt hashes, invite-only, created by Rob. All vendors behind `server/services/`.

Nothing else without a conversation and an ADR.

# Where things live

- `README.md` (root): the human front door, and the instructions for anyone who wants to run their own. `AGENTS.md` (root): the contract. `CLAUDE.md` is one line pointing at it.
- `REVIEW.md` (root): the three-pass review a fresh session runs before a merge.
- `docs/phase.md`: one number. What can be built right now.
- `docs/allowed-deps.txt`: the libraries we've agreed to, with their phase, and the denied list with reasons. Read by `pnpm check`.
- `docs/plan.md`: what we're building. The "Decided" table is closed; "Open questions" is Rob's.
- `docs/data.md`: the two tables, and the five rules the database holds rather than the UI. `shared/schema.ts` becomes the truth in Phase 1.
- `docs/ui.md`: the look, the screenshot self-check, and the table of divergences from the canvas.
- `docs/design/`: the Claude design canvas — seven boards, `canvas.json`, and Claude Design's `support.js` runtime. Visual truth for styling; never app code. Biome and `seams` ignore `docs/`.
- `docs/adr/`: decisions, why not what. Written with `skills/write-adr`.
- `docs/runbook.md`: symptom, cause, what to do. Add a row when you add a way to fail.
- `docs/notes.md`: the jot list. Anything explained twice, or that the contract should have stopped.
- `scripts/`: the three house rules inside `pnpm check` — `deps-allowed.mjs`, `seams.mjs`, `no-real-numbers.mjs` — and their tests in `scripts/__tests__/`.
- `.claude/`: committed settings (permissions allowlist and the Stop hook that runs `pnpm check` before an agent reports done), the hook itself, and `launch.json` so the dev server can be started by name.
- `biome.jsonc`, `lefthook.yml`, `vitest.config.ts` at the root: lint and format, the commit gate, the test runner.
- `app/`: the Nuxt app. `pages/` are the routes (`index.vue` the shelf, `books/[id].vue` the five states, `how-it-works.vue`, `sign-in.vue`, `account.vue`), `components/` the three shared pieces (`BookCover`, `SiteHeader`, `SiteFooter`), `composables/useViewer.ts` the signed-in person, `middleware/signed-in.global.ts` the one rule that invite only means signed in (ADR 0009), and `assets/css/main.css` the whole stylesheet (ADR 0003).
- `shared/`: `schema.ts` is the data truth — the two tables, the closed sets, and `bookState`, which decides who may see whose number. `covers.ts` is the fifty coloured covers from the canvas, for a book with no art. Also the projected shapes a page may receive: `shelfBookSchema` and `bookPageSchema`, which is rule 4 of docs/data.md as a type. Tests in `shared/__tests__/`.
- `server/services/`: the one seam, and the only place a vendor package may be imported; pages and API routes import from here. `items.ts` holds the four moves a reservation can make, each a single conditional UPDATE so the database decides rather than application code, and the reads, each a projection: the shelf carries nothing about people, and a book page carries a WhatsApp number only for the other side of a live reservation. `db/schema.ts` is the Drizzle schema and `db/client.ts` the one Neon client — they sit under `services/` because the seam has no exceptions. `profiles.ts` makes accounts and signs people in, and returns the browser shape, never a row. `server/api/`: routes, thin — validate the body, if there is one, with a schema from `shared/`, call one service, return. `server/utils/`: `password.ts` (scrypt, no library), `session.ts` (the sealed cookie; `requireViewerId` is where every write starts) and `logger.ts`, the one logger.
- `drizzle/`: numbered migration files, generated and committed. Never `db:push` against anything that matters (ADR 0002). Tests apply these same files to Postgres in-process (ADR 0007), so a migration that would fail in production fails in `pnpm check` first.
- `skills/`: `write-adr`, and `screenshot-pages` for the signed-in screenshot check in docs/ui.md. Add another only after needing it twice.

Add a top-level folder, add a line here.

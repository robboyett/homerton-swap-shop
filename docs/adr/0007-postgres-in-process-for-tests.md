# Tests run against Postgres in-process, so the reserve rule is proved by `pnpm check`

**Date:** 8 October 2026 · **Status:** accepted

**Context.** The reservation rules are four conditional UPDATEs (`server/services/items.ts`). Their correctness is entirely in the WHERE clause: `status = 'available'` is what stops two people both winning a book, and `reserved_by = $viewer` is what stops a bystander collecting someone else's. None of that is visible to a unit test with a stubbed database, because a stub would be agreeing with the code rather than checking it. The guard is Postgres's, so the test has to be Postgres's too.

Three ways to do that:

- **Hit the real Neon database** from the tests. Honest, but it needs a network and a connection string, which means `pnpm check` stops working on a plane and stops working for anyone who clones the repo without credentials. It also makes the wall depend on a free-tier database being awake.
- **Stub the database.** Fast and offline, and worthless here: it would test that Drizzle builds the SQL we asked for, not that the SQL does what we think.
- **Run Postgres in-process.** `@electric-sql/pglite` is Postgres compiled to WebAssembly. Real SQL, real enum types, real constraints, no server and no network.

**Decision.**

1. **Tests run against PGlite, inside `pnpm check`.** No network, no connection string, nothing to install beyond a devDependency. Anyone who clones the repo can prove the reserve rule.
2. **They run the committed migration,** not a hand-written schema: `migrate()` applies `drizzle/` exactly as production gets it. A migration that would fail in production fails here first.
3. **The services take a `db` argument** rather than reaching for a module-level client, which is what makes this possible. `server/services/db/client.ts` is the Neon client and is never imported by a test.

**Consequences.** `@electric-sql/pglite` joins `docs/allowed-deps.txt` as a Phase 2 devDependency. `pnpm check` goes from about 0.3 s of tests to about 11 s, because each test gets a fresh database; that is the price of testing the thing that matters, and it is paid once per commit rather than once per push.

What it costs beyond the time: PGlite is a single connection, so it cannot run two transactions at literally the same instant. The race test therefore proves what the code is responsible for — that the second UPDATE matches no row and reports failure — and relies on Postgres for the row-level locking underneath. That is the right division: we are not testing Postgres.

What it does not change: production is Neon over HTTP (ADR 0002), and the one client stays in `server/services/db/client.ts`. Migrations are still generated files, never pushed straight at a database. The seam rule is untouched and has no exception: vendors live in `server/services/` and nowhere else, which is why the Drizzle schema and the Neon client sit under it, and the test sits inside it too.

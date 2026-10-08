# Data is Neon with Drizzle, and migrations are files from the first table

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** The original brief proposed Supabase, for invite-only auth, Postgres with row-level security, and storage in one place. Rob chose Neon instead, for the more generous free tier on a project that will never make money. An earlier project of ours already runs Neon through the Vercel Marketplace, so the route is proven and the marketplace terms are accepted on the team.

That project also shows the cost of its own shortcut. It deferred migrations, pushing the schema straight at the database and applying later changes as hand-run SQL files. Its runbook ended up carrying three separate rows for the same wound: a pull request adds a column, merges, deploys, and every route then returns a 500 saying the column does not exist, because the schema was never pushed. Each one is a production outage with a one-line cause and no mechanism to prevent the next.

**Decision.**

1. **Neon Postgres with Drizzle, provisioned through the Vercel Marketplace** so `DATABASE_URL` is injected into the project environment rather than copied by hand.
2. **Migration files from the very first table.** `drizzle-kit generate` into a committed `drizzle/` folder, applied with `drizzle-kit migrate`. Never `db:push` against a database anything depends on. The migration lands in the same PR as the code that needs it.
3. **Authorisation lives in `server/services/`.** Neon has no row-level security here, so there is no second line of defence behind the service layer. The rules in `docs/data.md` about who may see whose phone number are enforced there, and they get tests.
4. **Files go to Vercel Blob** from Phase 3, not to Supabase storage.

**Consequences.** `drizzle-orm`, `drizzle-kit` and `@neondatabase/serverless` enter the allow-list at Phase 2; `@supabase/supabase-js` is on the denied list. A `drizzle/` folder of numbered SQL is part of the repo, which also means a stranger cloning it can stand the schema up — worth more here than in a private repo.

What it costs: hand-rolled auth (a `users` table and scrypt, roughly 60 lines) where Supabase would have given it free, and no RLS backstop if a service function forgets a check. That is the trade, and point 3 is how we pay for it. A migration file per schema change is slightly more work than `db:push`, and the pilot's runbook is the argument for doing it anyway.

What it does not change: still two tables (`docs/data.md`). Still no addresses, ever.

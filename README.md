# Homerton swap shop

An invite-only site where neighbours in Homerton give away kids' books for free. Someone scans a barcode, the book appears on a shelf everyone can browse, and the first person to tap "I'd like this" gets it. The site hands over a WhatsApp link and stays out of the way after that.

Nobody pays, nothing is for sale, and no address is ever on the site.

It's deliberately plain: white, one font, one type size, and covers doing all the work.

## Status

Phase 0 — the workplace. No product code yet. The current phase is in [docs/phase.md](docs/phase.md).

| Phase | What it proves |
|---|---|
| 0 | The workplace: one contract, one command, a review, the design in the repo |
| 1 | The shelf on a URL. Grid, age filter, book detail in five states. Fixtures, no database |
| 2 | It remembers, and it's ours. Neon, invites, sign-in, and the reserve flow |
| 3 | Adding a book is one scan, for anyone. Camera, barcode, Open Library, publish |
| 4 | Cover photos read by a vision model, collections, toys and clothes |

## Start here

- [docs/plan.md](docs/plan.md) — what we're building, what's decided, and what's still open.
- [docs/ui.md](docs/ui.md) — the look, in rules. The screens are in [docs/design/](docs/design/).
- [docs/data.md](docs/data.md) — two tables, and the five rules about who may see whose phone number.
- [docs/adr/](docs/adr/) — the decisions and what they cost.

## The one rule that matters

**No real phone numbers in this repo.** It's public, and a number pushed once is public forever — rewriting history doesn't reach forks or caches. Every number in a seed, fixture, test or doc comes from the Ofcom drama range `07700 900000`–`07700 900999`, and `pnpm check` blocks anything else ([ADR 0005](docs/adr/0005-no-real-phone-numbers.md)). Real numbers live only in the database, entered by the person they belong to.

## Running it

Node 22+ and pnpm.

```
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # lint, types, tests, and the three house rules. Run before every commit
```

From Phase 2 you'll also need a `.env` — copy [.env.example](.env.example) and fill it in. `DATABASE_URL` comes from Vercel Storage (`vercel env pull .env.local`); the Neon database is provisioned through the Vercel Marketplace.

## Running your own

Take it. It's MIT, and it's built for a few dozen households in one neighbourhood — that's the size it's good at.

What you'd change:

1. **The name and the copy.** "homerton" is in the page title, the footer and `docs/plan.md`. The tone is lowercase and plain on purpose; see [docs/ui.md](docs/ui.md).
2. **The genres and age bands** in `docs/ui.md` and `shared/schema.ts`, if you're swapping something other than kids' books.
3. **Accounts.** There is no sign-up, by design. One admin creates each account by hand and hands over a one-time password, which assumes you already have a group of people who know each other. If you need open sign-up, this is the wrong starting point.
4. **Hosting.** Nuxt on Vercel with a Neon database and Vercel Blob for photos. Nothing stops it running elsewhere; the vendor calls are all in `server/services/`.

What you should keep: the phone-number gate, and the decision not to have an address field at all.

## How it's built

One person (Rob) and a coding agent. The repo is set up to catch what that misses:

- **One contract.** [AGENTS.md](AGENTS.md) is everything an agent needs, read at the start of every session.
- **One wall.** `pnpm check` runs lint, types and tests, plus three house rules: no dependency we didn't agree to, no page talking to the database directly, and no real phone numbers. It runs before an agent can say "done", and again at commit.
- **A second opinion.** A fresh session runs the three passes in [REVIEW.md](REVIEW.md) on every change.
- **One number.** [docs/phase.md](docs/phase.md) says what may be built right now. Later-phase dependencies fail the command rather than getting a comment.

Small PRs, each one concern. Claude merges when the wall is green and the review is clean; product decisions stay with Rob ([AGENTS.md](AGENTS.md) has the stop-and-ask list).

## If you're an agent

Stop reading this and read [AGENTS.md](AGENTS.md).

## Licence

MIT. See [LICENSE](LICENSE).

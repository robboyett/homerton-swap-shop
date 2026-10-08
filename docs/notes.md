# Notes

**Parent:** [AGENTS.md](../AGENTS.md)

One line each, newest at the top: anything Rob had to explain twice, anything an agent tried that the contract should have stopped, anything surprising.

When the list gets long, turn each line into one of three things: a rule in `pnpm check`, an edit to a named doc, or a decision in `docs/adr/`. Then clear the line. There is no weekly ceremony; the list getting long is the signal.

8 Oct, Claude: `git add -A` swept up `docs/original-swapshop-handoff/`, which the previous commit message said was untracked on purpose. It reached the public repo. Stage by path whenever some path is deliberately excluded; `-A` makes an exclusion last exactly one commit. Nothing sensitive was in it, but the commit message had promised otherwise.

8 Oct, Claude: and in the very commit that removed it, the jot above was edited but never staged, so the PR description claimed a change the commit did not contain. Two slips in a row from careless staging, in opposite directions. Read `git diff --cached --name-status` before committing, not after.

8 Oct, Claude: did it a third time, one PR after writing the line above. `git add -A` is reflexive and a note did not stop it. Ignored the folder in `.gitignore` instead. The lesson that generalises: when a rule has failed twice, stop writing it down and make it mechanical — which is what AGENTS.md already says about prose.

8 Oct, review of #6: rule 4 in docs/data.md (numbers are never shown to the wrong person) has no implementation or test in server/services/, because nothing reads yet. The first list or detail query must project the row rather than return it: `bookState` needs `reserved_by` to work out "mine", and `reserved_by` is exactly the field a bystander must not receive. Serialising a whole item row to the client breaks rule 4 the moment it ships.

8 Oct, second review of #6: `nuxt typecheck` had never checked `server/`. The root `tsconfig.json` extended `.nuxt/tsconfig.json`, which is the app project and excludes `../server/**`, so every Phase 2 service file passed the gate untyped: a missing type import in `db/schema.ts` and 28 strict-index errors in the test went unseen. Root tsconfig is now Nuxt 4 project references (`files: []`), which makes typecheck run all four projects. Lesson: when a new top-level folder gets code, prove the gate sees it by breaking something in it on purpose.

8 Oct, Claude, sign-in PR: the runbook said `pnpm dev` reads `.env.local`. It did not; `nuxt dev` reads `.env` and the row was never run. Found when every page 500ed for the session secret. The dev script now passes `--dotenv .env.local`. A runbook row that was not produced by running the command is a guess, and should say so or be run.

8 Oct, Claude, sign-in PR: the Chrome extension could not settle on the local Nuxt dev page (document never idle, twice), so the signed-in pages were checked with curl and the headless screenshots only. If this repeats, the fix is a project skill for screenshots that signs in first, not a third retry.

<!-- add lines above this comment -->

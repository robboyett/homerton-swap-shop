# Notes

**Parent:** [AGENTS.md](../AGENTS.md)

One line each, newest at the top: anything Rob had to explain twice, anything an agent tried that the contract should have stopped, anything surprising.

When the list gets long, turn each line into one of three things: a rule in `pnpm check`, an edit to a named doc, or a decision in `docs/adr/`. Then clear the line. There is no weekly ceremony; the list getting long is the signal.

8 Oct, Claude: `git add -A` swept up `docs/original-swapshop-handoff/`, which the previous commit message said was untracked on purpose. It reached the public repo. Stage by path whenever some path is deliberately excluded; `-A` makes an exclusion last exactly one commit. Nothing sensitive was in it, but the commit message had promised otherwise.

8 Oct, Claude: and in the very commit that removed it, the jot above was edited but never staged, so the PR description claimed a change the commit did not contain. Two slips in a row from careless staging, in opposite directions. Read `git diff --cached --name-status` before committing, not after.

8 Oct, Claude: did it a third time, one PR after writing the line above. `git add -A` is reflexive and a note did not stop it. Ignored the folder in `.gitignore` instead. The lesson that generalises: when a rule has failed twice, stop writing it down and make it mechanical — which is what AGENTS.md already says about prose.

8 Oct, second review of #6: `nuxt typecheck` had never checked `server/`. The root `tsconfig.json` extended `.nuxt/tsconfig.json`, which is the app project and excludes `../server/**`, so every Phase 2 service file passed the gate untyped: a missing type import in `db/schema.ts` and 28 strict-index errors in the test went unseen. Root tsconfig is now Nuxt 4 project references (`files: []`), which makes typecheck run all four projects. Lesson: when a new top-level folder gets code, prove the gate sees it by breaking something in it on purpose.

8 Oct, Claude, sign-in PR: the runbook said `pnpm dev` reads `.env.local`. It did not; `nuxt dev` reads `.env` and the row was never run. Found when every page 500ed for the session secret. The dev script now passes `--dotenv .env.local`. A runbook row that was not produced by running the command is a guess, and should say so or be run.

8 Oct, Claude, sign-in PR: the Chrome extension could not settle on the local Nuxt dev page (document never idle, twice), so the signed-in pages were checked with curl and the headless screenshots only. It repeated on the next PR, so the method is now `skills/screenshot-pages`.

8 Oct, Claude, #11: merged while the preview check was still pending. `gh pr checks --watch` returned at once because the Vercel check had not registered yet, and the merge was chained after it with `;` rather than `&&`, so nothing stopped it. The production deploy was green, by luck not design. Until this fails again: wait for the check to appear and read SUCCESS before merging, and never chain a merge after a watch with `;`.

9 Oct, Claude, #21: the same slip as #11, worse. A chained command ran the gate, failed on a type error, skipped the commit, and still merged, because a `;` after the commit step let the merge run on the old head. The reviewed-and-rejected version went to production for the time it took to fix forward. Second time, so it is mechanical now: `scripts/merge.sh <pr>` is the only way a PR gets merged. It refuses a dirty tree, a head that is not the PR head, a Vercel check that is not SUCCESS, and a red gate, in that order.

9 Oct, Claude: a Finder or sync conflict copy renamed `server/api/lookup/` to `lookup 2` on disk. Git saw the original deleted and ignored the copy; Nitro picked the copy up as a route and typecheck failed in a page that had not changed. The runbook row on `* 2` copies covers it; the clone is in `GitHub.nosync` and still got one. If it happens again, find what is syncing the folder.

<!-- add lines above this comment -->

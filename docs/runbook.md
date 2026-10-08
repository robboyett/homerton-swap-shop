# Runbook

**Parent:** [AGENTS.md](../AGENTS.md)

When something looks broken, read this first. When you add a way something can fail, add a row. Symptom, cause, what to do. Newest at the top. No severity levels.

| Symptom | Cause | What to do |
|---------|-------|------------|
| A phone screenshot looks like the layout overflows to the right | Headless Chrome clamps its window to about 500px wide, so `--window-size=390,844` lays the page out at 500 and then crops the image to 390. Nothing is wrong with the page | Shoot phone widths at `--window-size=500,900`. That is still below the 700px breakpoint, so it exercises the phone layout; it just is not 390. For a true 390 use Chrome's device toolbar by hand. Measured 8 Oct: `.page=500`, `window.innerWidth=500` at a requested 390 |
| `pnpm check` fails with `BLOCKED: no-real-numbers: <file>:<line>` | A UK mobile number outside the Ofcom drama range is in the tree. The repo is public, so a number committed once is public forever | Replace it with one from `07700 900000`–`07700 900999`. If it is a real neighbour's number, it belongs in the database, entered by them, and never in a file. |
| `pnpm check` fails with `BLOCKED: deps-allowed: <name> is phase n, docs/phase.md says m` | A dependency on the allow-list belongs to a later phase | Wait for that phase. If we mean to move now, write an ADR and bump `docs/phase.md` in the same PR. |
| `pnpm check` fails with `BLOCKED: deps-allowed: <name> is not in docs/allowed-deps.txt` | A dependency was added that isn't on the list | If it belongs to this phase, add the line with its phase and why. If not, remove it or write an ADR. |
| `pnpm check` fails with `BLOCKED: deps-allowed: <name> is on the denied list` | A dependency we've already decided against | Read the reason on the line. The answer is plain CSS, a small function, or a conversation with Rob. |
| `pnpm check` fails with `BLOCKED: seams: <file> imports <package>` | A page or API route imports a vendor package directly | Move the call into `server/services/` and import the service instead. |
| Commit refused with lint or type errors | lefthook ran `pnpm check` | Run `pnpm check` yourself, read the first error, fix the code, not the check. |
| Stop hook keeps firing and the agent can't ask a question | The hook isn't guarded on `stop_hook_active` | Fix `.claude/hooks/stop-check.sh`; it should run once per "done", not on every stop. |
| Files like `package 2.json` appear in the repo | Finder, iCloud or Dropbox made conflict copies | Delete them. `.gitignore` refuses `* 2` and `* 2.*`. Keep the clone out of any synced folder; this one lives in `GitHub.nosync` for that reason. |

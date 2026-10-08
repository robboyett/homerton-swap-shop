# Notes

**Parent:** [AGENTS.md](../AGENTS.md)

One line each, newest at the top: anything Rob had to explain twice, anything an agent tried that the contract should have stopped, anything surprising.

When the list gets long, turn each line into one of three things: a rule in `pnpm check`, an edit to a named doc, or a decision in `docs/adr/`. Then clear the line. There is no weekly ceremony; the list getting long is the signal.

8 Oct, Claude: `git add -A` swept up `docs/original-swapshop-handoff/`, which the previous commit message said was untracked on purpose. It reached the public repo. Stage by path whenever some path is deliberately excluded; `-A` makes an exclusion last exactly one commit. Nothing sensitive was in it, but the commit message had promised otherwise.

8 Oct, Claude: and in the very commit that removed it, the jot above was edited but never staged, so the PR description claimed a change the commit did not contain. Two slips in a row from careless staging, in opposite directions. Read `git diff --cached --name-status` before committing, not after.

8 Oct, Claude: did it a third time, one PR after writing the line above. `git add -A` is reflexive and a note did not stop it. Ignored the folder in `.gitignore` instead. The lesson that generalises: when a rule has failed twice, stop writing it down and make it mechanical — which is what AGENTS.md already says about prose.

<!-- add lines above this comment -->

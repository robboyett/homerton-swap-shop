#!/usr/bin/env bash
# merge.sh <pr-number>: merge a PR only when every condition the contract names is true, in one
# place, so a chained shell command can never merge past a failed gate again (docs/notes.md, #11
# and #21). Prints one BLOCKED line and exits 1 otherwise.
set -euo pipefail
pr="${1:?usage: scripts/merge.sh <pr-number>}"
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "BLOCKED: merge: the working tree is not clean. Commit or stash first." >&2; exit 1
fi
local_head=$(git rev-parse HEAD)
pr_head=$(gh pr view "$pr" --json headRefOid -q .headRefOid)
if [ "$local_head" != "$pr_head" ]; then
  echo "BLOCKED: merge: local HEAD ${local_head:0:7} is not PR #$pr's head ${pr_head:0:7}. Push, or check out the PR branch." >&2; exit 1
fi
state=$(gh pr view "$pr" --json state -q .state)
if [ "$state" != "OPEN" ]; then
  echo "BLOCKED: merge: PR #$pr is $state, not OPEN." >&2; exit 1
fi
for _ in $(seq 1 60); do
  check=$(gh pr view "$pr" --json statusCheckRollup -q '[.statusCheckRollup[] | select((.context // .name) == "Vercel") | (.state // .conclusion)] | join(",")')
  case "$check" in
    *SUCCESS*) break ;;
    *FAILURE*|*ERROR*) echo "BLOCKED: merge: the Vercel check on PR #$pr is $check." >&2; exit 1 ;;
  esac
  sleep 10
done
if [ "${check:-}" != "SUCCESS" ]; then
  echo "BLOCKED: merge: the Vercel check on PR #$pr never reached SUCCESS (last: ${check:-none})." >&2; exit 1
fi
if ! pnpm check >/tmp/homerton-merge-check.log 2>&1; then
  tail -30 /tmp/homerton-merge-check.log >&2
  echo "BLOCKED: merge: pnpm check failed on this head. Fix the code, not the check." >&2; exit 1
fi
title=$(gh pr view "$pr" --json title -q .title)
gh pr merge "$pr" --squash --delete-branch --match-head-commit "$pr_head" --subject "$title (#$pr)"
git switch main && git pull --ff-only
echo "merged #$pr: $title"

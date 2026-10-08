#!/usr/bin/env bash
# Stop hook: run pnpm check before the agent reports done.
# Guarded on stop_hook_active so it runs once per "done", not on every stop, which would
# stop the agent being able to pause and ask Rob a question (see docs/runbook.md).
set -u
input=$(cat)
if printf '%s' "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi
cd "$(dirname "$0")/../.." || exit 0
if [ ! -f package.json ] || [ ! -d node_modules ]; then
  exit 0
fi
if ! pnpm check >/tmp/homerton-stop-check.log 2>&1; then
  tail -40 /tmp/homerton-stop-check.log >&2
  echo "BLOCKED: pnpm check failed. Read the first error above, fix the code, not the check." >&2
  exit 2
fi
exit 0

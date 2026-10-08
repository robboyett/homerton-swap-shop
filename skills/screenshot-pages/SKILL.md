---
name: screenshot-pages
description: Screenshot a signed-in page of this site at 1280 and 500 wide for the docs/ui.md self-check, without a browser extension. Use before saying any page is done, and whenever a PR changes something a person sees.
---

# Screenshot the pages

Every page except sign-in and how-it-works needs a cookie, and the Chrome extension cannot settle on the local Nuxt dev page (docs/notes.md, 8 Oct). This is the way that works. It touches no product code.

## The shape of it

1. **Seed throwaway rows, only if the tables are empty.** Two profiles at `@example.com`, drama-range numbers, and a handful of items across the states you need. Insert with SQL through `@neondatabase/serverless` from a one-off node script in the scratchpad, never from the repo. If `profiles` is not empty, stop: the rows are real and so is the first-admin window.
2. **Run the dev server** on a spare port: `pnpm dev --port 3077`.
3. **Sign in with curl** and keep the cookie: `curl -c jar.txt -X POST localhost:3077/api/sign-in -H 'content-type: application/json' -d '{"email":"test@example.com","password":"…"}'`.
4. **Save the server-rendered HTML** of each page with `curl -b jar.txt`, then strip every `<script>` (otherwise hydration asks `/api/me` without the cookie and redirects) and inline `app/assets/css/main.css` into a `<style>` tag in the head (in dev, Nuxt delivers CSS through the scripts you just removed).
5. **Shoot the file with headless Chrome**, once at `--window-size=1280,1000` and once at `--window-size=500,1100` (500 not 390: see the runbook), with `--allow-file-access-from-files --virtual-time-budget=4000 --hide-scrollbars`.
6. **Look at both images** against the matching board in `docs/design/` and the rules in `docs/ui.md`. Say what you saw in the PR.
7. **Delete the throwaway rows** by email, and confirm both tables are back to what they were. Stop the dev server.

## What not to do

- Do not seed into a database that already has real rows, and do not attach test items to Rob's account.
- Do not add a screenshot route, a test-mode flag, or a cookie bypass to the product to make this easier. The whole point is that the product has no back door.
- Do not retry the Chrome extension on the dev server a third time. If it ever works, delete this skill.

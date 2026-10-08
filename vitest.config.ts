import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .claude/worktrees holds other sessions' checkouts of this repo; each runs its own tests.
    exclude: ["**/node_modules/**", ".vercel/**", ".claude/worktrees/**"],
  },
  // Nuxt aliases, so app/ code that imports ~~/shared/* runs under vitest too.
  resolve: {
    alias: {
      "~~": fileURLToPath(new URL(".", import.meta.url)),
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
});

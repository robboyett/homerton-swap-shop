/**
 * The one Neon client, inside the one seam (AGENTS.md).
 *
 * Tests do not use this file. They run the same services against Postgres in-process
 * (ADR 0007), so nothing in `pnpm check` needs a network or a connection string.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { Db } from "./types";

// No `{ schema }`: the services use the query builder, not the relational API, and leaving it
// out is what lets this client and the in-process one in tests share the one `Db` type.
let cached: Db | null = null;

export function db() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env; see docs/runbook.md.");
  }
  cached = drizzle(neon(url));
  return cached;
}

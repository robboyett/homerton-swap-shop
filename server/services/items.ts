/**
 * Items, and the four moves a reservation can make.
 *
 * These four functions are the product. Each is a single conditional UPDATE: the guard lives in
 * the WHERE clause, so the database decides, not a read-then-write in application code. Each
 * returns whether it changed a row, and the caller says so plainly rather than pretending.
 *
 * Authorisation is here and only here. Neon has no row-level security in this design (ADR 0002),
 * so there is nothing behind these checks. docs/data.md holds the rules they implement.
 */
import { and, eq, or } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { items } from "./db/schema";

// biome-ignore lint/suspicious/noExplicitAny: the driver differs by environment — Neon over HTTP
// in production, Postgres in-process in tests (ADR 0007). The schema generic is what varies.
export type Db = PgDatabase<PgQueryResultHKT, any, any>;

/**
 * Reserve, if it is still on the shelf.
 *
 * The whole product turns on this one statement. `status = 'available'` in the WHERE clause means
 * two people tapping at the same moment cannot both win: Postgres serialises the row update, the
 * second finds no row matching and changes nothing. Never read the status and then write it.
 */
export async function reserve(db: Db, itemId: string, viewerId: string): Promise<boolean> {
  const changed = await db
    .update(items)
    .set({ status: "reserved", reservedBy: viewerId, reservedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.status, "available")))
    .returning({ id: items.id });
  return changed.length === 1;
}

/**
 * Put it back on the shelf. Either side may, at any time, and neither has to explain.
 * Only from `reserved`, so releasing a collected item is not a way to undo collection.
 */
export async function release(db: Db, itemId: string, viewerId: string): Promise<boolean> {
  const changed = await db
    .update(items)
    .set({ status: "available", reservedBy: null, reservedAt: null })
    .where(
      and(
        eq(items.id, itemId),
        eq(items.status, "reserved"),
        or(eq(items.ownerId, viewerId), eq(items.reservedBy, viewerId)),
      ),
    )
    .returning({ id: items.id });
  return changed.length === 1;
}

/**
 * "We've collected it", which only the person who turned up can say.
 * `reservedBy` is kept, so undoing returns to a reservation rather than to the shelf.
 */
export async function collect(db: Db, itemId: string, viewerId: string): Promise<boolean> {
  const changed = await db
    .update(items)
    .set({ status: "collected", collectedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.status, "reserved"), eq(items.reservedBy, viewerId)))
    .returning({ id: items.id });
  return changed.length === 1;
}

/** "Not collected after all". Back to reserved, with the same person still holding it. */
export async function uncollect(db: Db, itemId: string, viewerId: string): Promise<boolean> {
  const changed = await db
    .update(items)
    .set({ status: "reserved", collectedAt: null })
    .where(and(eq(items.id, itemId), eq(items.status, "collected"), eq(items.reservedBy, viewerId)))
    .returning({ id: items.id });
  return changed.length === 1;
}

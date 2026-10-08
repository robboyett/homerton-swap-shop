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
import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { type BookPage, bookState, type NewBook, type ShelfBook } from "../../shared/schema";
import { items, profiles } from "./db/schema";
import type { Db } from "./db/types";

export type { Db };

/* ---- reading: every shape that leaves this file is a projection, never a row (rule 4) ---- */

const shelfColumns = {
  id: items.id,
  kind: items.kind,
  title: items.title,
  author: items.author,
  genre: items.genre,
  age_band: items.ageBand,
  status: items.status,
  cover_url: items.coverUrl,
  photo_url: items.photoUrl,
  approx_count: items.approxCount,
};

/**
 * The shelf: everything not yet collected, newest first, then by title so a pile published in
 * one go keeps a steady order. Carries nothing about people.
 */
export async function listShelf(db: Db): Promise<ShelfBook[]> {
  return db
    .select(shelfColumns)
    .from(items)
    .where(ne(items.status, "collected"))
    .orderBy(desc(items.createdAt), items.title);
}

/** Up to ten more from the same section, for the foot of a book page. */
export async function moreInGenre(
  db: Db,
  genre: ShelfBook["genre"],
  exceptId: string,
): Promise<ShelfBook[]> {
  return db
    .select(shelfColumns)
    .from(items)
    .where(and(eq(items.genre, genre), ne(items.status, "collected"), ne(items.id, exceptId)))
    .orderBy(desc(items.createdAt), items.title)
    .limit(10);
}

/**
 * One book, as this viewer may see it. The one place the five states are decided for a page,
 * and the one place a WhatsApp number is attached to anything: only to the other side of a
 * live reservation (docs/data.md, rule 4). Null when there is no such book.
 */
export async function bookPage(db: Db, itemId: string, viewerId: string): Promise<BookPage | null> {
  const owner = alias(profiles, "owner");
  const requester = alias(profiles, "requester");
  const [row] = await db
    .select({
      ...shelfColumns,
      blurb: items.blurb,
      created_at: items.createdAt,
      owner_id: items.ownerId,
      reserved_by: items.reservedBy,
      owner_first_name: owner.firstName,
      owner_number: owner.whatsappNumber,
      requester_first_name: requester.firstName,
      requester_number: requester.whatsappNumber,
    })
    .from(items)
    .innerJoin(owner, eq(items.ownerId, owner.id))
    .leftJoin(requester, eq(items.reservedBy, requester.id))
    .where(eq(items.id, itemId));
  if (!row) return null;

  const state = bookState(row, viewerId);
  const {
    owner_id,
    reserved_by,
    owner_number,
    requester_first_name,
    requester_number,
    created_at,
    ...book
  } = row;

  let contact: BookPage["contact"] = null;
  if (state === "mine")
    contact = { first_name: book.owner_first_name, whatsapp_number: owner_number };
  if (state === "owner" && requester_first_name && requester_number) {
    contact = { first_name: requester_first_name, whatsapp_number: requester_number };
  }

  return {
    ...book,
    created_at: created_at.toISOString(),
    state,
    contact,
    can_undo: state === "collected" && (owner_id === viewerId || reserved_by === viewerId),
  };
}

/* ---- adding ---- */

/**
 * Publish the pile. Whoever is signed in owns every book in it (ADR 0006); each goes on the
 * shelf as available. One INSERT, so a pile of twenty is one round trip. Returns the new ids.
 */
export async function createItems(db: Db, ownerId: string, books: NewBook[]): Promise<string[]> {
  if (books.length === 0) return [];
  const rows = await db
    .insert(items)
    .values(
      books.map((b) => ({
        ownerId,
        kind: "book" as const,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        blurb: b.blurb,
        genre: b.genre,
        ageBand: b.age_band,
        coverUrl: b.cover_url,
      })),
    )
    .returning({ id: items.id });
  return rows.map((r) => r.id);
}

/* ---- the four moves ---- */

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
 * Put it back on the shelf. Either side may, at any time, and neither has to explain
 * (docs/plan.md, "Undoing"; ADR 0008).
 *
 * It works from `collected` as well as `reserved`, so a book ticked off by mistake can be
 * returned in one move rather than undone and then released. `collected_at` is cleared with
 * the rest: a book on the shelf carries no memory of a collection that did not happen.
 */
export async function release(db: Db, itemId: string, viewerId: string): Promise<boolean> {
  const changed = await db
    .update(items)
    .set({ status: "available", reservedBy: null, reservedAt: null, collectedAt: null })
    .where(
      and(
        eq(items.id, itemId),
        inArray(items.status, ["reserved", "collected"]),
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

/**
 * "Not collected after all". Back to reserved, with the same person still holding it.
 *
 * Open to either side (ADR 0008). Only the person who turned up knows whether they did, but
 * only the owner can rescue a book that was ticked off by mistake and then gone quiet on.
 */
export async function uncollect(db: Db, itemId: string, viewerId: string): Promise<boolean> {
  const changed = await db
    .update(items)
    .set({ status: "reserved", collectedAt: null })
    .where(
      and(
        eq(items.id, itemId),
        eq(items.status, "collected"),
        or(eq(items.ownerId, viewerId), eq(items.reservedBy, viewerId)),
      ),
    )
    .returning({ id: items.id });
  return changed.length === 1;
}

/**
 * The reservation rules, against real Postgres running in-process (ADR 0007).
 *
 * These run inside `pnpm check` with no network and no connection string, against the same
 * migration that production runs. The point is that the guards are in the WHERE clause: every
 * test here asks "did it change a row?", because that is the only thing the caller is told.
 */
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { items, profiles } from "../db/schema";
import {
  bookPage,
  collect,
  type Db,
  listShelf,
  moreInGenre,
  release,
  reserve,
  uncollect,
} from "../items";
import { freshDb } from "./pglite";

let db: Db;
let owner: string;
let asker: string;
let bystander: string;
let itemId: string;

/** The one row an insert or select was expected to produce. Throws rather than returns undefined. */
function one<T>(rows: T[]): T {
  const [row] = rows;
  if (!row) throw new Error("expected one row, got none");
  return row;
}

async function freshItem(): Promise<string> {
  const rows = await db
    .insert(items)
    .values({
      ownerId: owner,
      title: "The Lighthouse Mouse",
      author: "J. Alder",
      genre: "picture books",
      ageBand: "4-6",
    })
    .returning({ id: items.id });
  return one(rows).id;
}

beforeEach(async () => {
  db = await freshDb();

  const people = await db
    .insert(profiles)
    .values([
      {
        email: "priya@example.com",
        firstName: "priya",
        whatsappNumber: "+447700900123",
        passwordHash: "x",
      },
      {
        email: "sam@example.com",
        firstName: "sam",
        whatsappNumber: "+447700900456",
        passwordHash: "x",
      },
      {
        email: "alex@example.com",
        firstName: "alex",
        whatsappNumber: "+447700900789",
        passwordHash: "x",
      },
    ])
    .returning({ id: profiles.id });
  const [p0, p1, p2] = people;
  if (!p0 || !p1 || !p2) throw new Error("expected three profiles");
  owner = p0.id;
  asker = p1.id;
  bystander = p2.id;
  itemId = await freshItem();
});

async function statusOf(id: string) {
  return one(await db.select().from(items).where(eq(items.id, id)));
}

describe("reserve", () => {
  it("takes an item off the shelf for the person who asked", async () => {
    expect(await reserve(db, itemId, asker)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("reserved");
    expect(row.reservedBy).toBe(asker);
    expect(row.reservedAt).not.toBeNull();
  });

  it("lets exactly one of two people win", async () => {
    // This proves the state guard, not a race: PGlite is a single connection, so the two
    // statements run one after the other. The second UPDATE finds no row with
    // status = 'available' and changes nothing, which is the part the code is responsible for.
    // The row locking that makes it hold under real concurrency is Postgres's, and ADR 0007
    // says why we do not try to demonstrate it here.
    const first = await reserve(db, itemId, asker);
    const second = await reserve(db, itemId, bystander);
    expect([first, second]).toEqual([true, false]);
    expect((await statusOf(itemId)).reservedBy).toBe(asker);
  });

  it("refuses an item that has already been collected", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await reserve(db, itemId, bystander)).toBe(false);
  });

  // Decided, not accidental: docs/plan.md "Reserving your own book" (ADR 0008). The guard stays
  // on status alone.
  it("lets an owner reserve their own book (ADR 0008)", async () => {
    expect(await reserve(db, itemId, owner)).toBe(true);
  });
});

describe("release", () => {
  it("is allowed to the person holding it", async () => {
    await reserve(db, itemId, asker);
    expect(await release(db, itemId, asker)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("available");
    expect(row.reservedBy).toBeNull();
    expect(row.reservedAt).toBeNull();
  });

  it("is allowed to the owner, so a quiet asker does not strand a book", async () => {
    await reserve(db, itemId, asker);
    expect(await release(db, itemId, owner)).toBe(true);
    expect((await statusOf(itemId)).status).toBe("available");
  });

  it("is refused to anyone else", async () => {
    await reserve(db, itemId, asker);
    expect(await release(db, itemId, bystander)).toBe(false);
    expect((await statusOf(itemId)).reservedBy).toBe(asker);
  });

  it("takes a collected item straight back to the shelf, for either side (ADR 0008)", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await release(db, itemId, owner)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("available");
    expect(row.reservedBy).toBeNull();
    expect(row.reservedAt).toBeNull();
    // A book on the shelf carries no memory of a collection that did not happen.
    expect(row.collectedAt).toBeNull();
  });

  it("is still refused to a bystander on a collected item", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await release(db, itemId, bystander)).toBe(false);
    expect((await statusOf(itemId)).status).toBe("collected");
  });
});

describe("collect", () => {
  it("is for the person who turned up, and nobody else", async () => {
    await reserve(db, itemId, asker);
    expect(await collect(db, itemId, owner)).toBe(false);
    expect(await collect(db, itemId, bystander)).toBe(false);
    expect(await collect(db, itemId, asker)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("collected");
    expect(row.collectedAt).not.toBeNull();
  });

  it("cannot collect something nobody reserved", async () => {
    expect(await collect(db, itemId, asker)).toBe(false);
  });

  it("undoes back to a reservation, not to the shelf", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await uncollect(db, itemId, asker)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("reserved");
    expect(row.reservedBy).toBe(asker);
    expect(row.collectedAt).toBeNull();
  });

  it("is undoable by the owner too, so a mistaken tick is not a dead end (ADR 0008)", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await uncollect(db, itemId, owner)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("reserved");
    expect(row.reservedBy).toBe(asker);
  });

  it("is refused to a bystander", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await uncollect(db, itemId, bystander)).toBe(false);
    expect((await statusOf(itemId)).status).toBe("collected");
  });
});

describe("a whole life", () => {
  it("goes up, is asked for, released, asked for again, and collected", async () => {
    expect(await reserve(db, itemId, asker)).toBe(true);
    expect(await release(db, itemId, asker)).toBe(true);
    expect(await reserve(db, itemId, bystander)).toBe(true);
    expect(await collect(db, itemId, bystander)).toBe(true);
    const row = await statusOf(itemId);
    expect(row.status).toBe("collected");
    expect(row.reservedBy).toBe(bystander);
  });
});

describe("what a page may see (docs/data.md, rule 4)", () => {
  it("the shelf lists what is not collected, newest first, and nothing about people", async () => {
    const second = await freshItem();
    await reserve(db, second, asker);
    await collect(db, second, asker);
    const third = await freshItem();
    const shelf = await listShelf(db);
    expect(shelf.map((b) => b.id)).toEqual([third, itemId]);
    for (const book of shelf) {
      expect(Object.keys(book).sort()).toEqual([
        "age_band",
        "approx_count",
        "author",
        "cover_url",
        "genre",
        "id",
        "kind",
        "photo_url",
        "status",
        "title",
      ]);
    }
  });

  it("shows nobody's number on a book nobody has asked for", async () => {
    const page = await bookPage(db, itemId, bystander);
    expect(page?.state).toBe("available");
    expect(page?.contact).toBeNull();
    expect(page?.owner_first_name).toBe("priya");
    expect(page).not.toHaveProperty("reserved_by");
    expect(page).not.toHaveProperty("owner_id");
    expect(JSON.stringify(page)).not.toContain("+44");
  });

  it("gives the asker the owner's number, and the owner the asker's", async () => {
    await reserve(db, itemId, asker);
    const mine = await bookPage(db, itemId, asker);
    expect(mine?.state).toBe("mine");
    expect(mine?.contact).toEqual({ first_name: "priya", whatsapp_number: "+447700900123" });
    const owners = await bookPage(db, itemId, owner);
    expect(owners?.state).toBe("owner");
    expect(owners?.contact).toEqual({ first_name: "sam", whatsapp_number: "+447700900456" });
  });

  it("tells a bystander only that it is reserved", async () => {
    await reserve(db, itemId, asker);
    const page = await bookPage(db, itemId, bystander);
    expect(page?.state).toBe("other");
    expect(page?.contact).toBeNull();
    expect(JSON.stringify(page)).not.toContain("+44");
    expect(JSON.stringify(page)).not.toContain("sam");
  });

  it("shows no number once collected, and offers undo only to the two sides", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    for (const [viewer, canUndo] of [
      [asker, true],
      [owner, true],
      [bystander, false],
    ] as const) {
      const page = await bookPage(db, itemId, viewer);
      expect(page?.state).toBe("collected");
      expect(page?.contact).toBeNull();
      expect(page?.can_undo).toBe(canUndo);
    }
  });

  it("is null for a book that does not exist", async () => {
    expect(await bookPage(db, "00000000-0000-4000-8000-000000000000", asker)).toBeNull();
  });

  it("more in the genre leaves the book itself out", async () => {
    const second = await freshItem();
    const more = await moreInGenre(db, "picture books", itemId);
    expect(more.map((b) => b.id)).toEqual([second]);
  });
});

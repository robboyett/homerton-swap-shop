/**
 * The reservation rules, against real Postgres running in-process (ADR 0007).
 *
 * These run inside `pnpm check` with no network and no connection string, against the same
 * migration that production runs. The point is that the guards are in the WHERE clause: every
 * test here asks "did it change a row?", because that is the only thing the caller is told.
 */
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { items, profiles } from "../db/schema";
import { collect, type Db, release, reserve, uncollect } from "../items";

let db: Db;
let owner: string;
let asker: string;
let bystander: string;
let itemId: string;

async function freshItem(): Promise<string> {
  const [row] = await db
    .insert(items)
    .values({
      ownerId: owner,
      title: "The Lighthouse Mouse",
      author: "J. Alder",
      genre: "picture books",
      ageBand: "4-6",
    })
    .returning({ id: items.id });
  return row.id;
}

beforeEach(async () => {
  const client = new PGlite();
  db = drizzle(client) as unknown as Db;
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });

  const people = await db
    .insert(profiles)
    .values([
      { firstName: "priya", whatsappNumber: "+447700900123", passwordHash: "x" },
      { firstName: "sam", whatsappNumber: "+447700900456", passwordHash: "x" },
      { firstName: "alex", whatsappNumber: "+447700900789", passwordHash: "x" },
    ])
    .returning({ id: profiles.id });
  owner = people[0].id;
  asker = people[1].id;
  bystander = people[2].id;
  itemId = await freshItem();
});

async function statusOf(id: string) {
  const [row] = await db.select().from(items).where(eq(items.id, id));
  return row;
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
    // The race, run as the database sees it: the second UPDATE finds no row with
    // status = 'available' and changes nothing. This is the rule the product turns on.
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

  it("lets the owner reserve their own item, which is allowed and harmless", async () => {
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

  it("is not a way to undo a collection", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await release(db, itemId, owner)).toBe(false);
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

  it("is only undoable by the person who collected it", async () => {
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    expect(await uncollect(db, itemId, owner)).toBe(false);
    expect(await uncollect(db, itemId, bystander)).toBe(false);
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

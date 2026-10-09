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
  artOf,
  bookPage,
  clearPhoto,
  collect,
  countAskedOfYou,
  createItems,
  type Db,
  listForAdmin,
  listShelf,
  moreInGenre,
  release,
  removeItem,
  requestsFor,
  reserve,
  restoreItem,
  setPhoto,
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
    const shelf = await listShelf(db, bystander);
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
        "yours",
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
    const more = await moreInGenre(db, "picture books", itemId, bystander);
    expect(more.map((b) => b.id)).toEqual([second]);
  });
});

describe("publishing a pile", () => {
  it("puts every book on the shelf as available, owned by whoever published", async () => {
    const ids = await createItems(db, asker, [
      {
        isbn: "9780333710937",
        title: "The Gruffalo",
        author: "Julia Donaldson",
        blurb: "A mouse took a stroll.",
        cover_url: "https://covers.openlibrary.org/b/id/10549185-L.jpg",
        genre: "picture books",
        age_band: "0-3",
      },
      {
        isbn: null,
        title: "A typed-in one",
        author: null,
        blurb: null,
        cover_url: null,
        genre: "chapter books",
        age_band: "7-9",
      },
    ]);
    expect(ids).toHaveLength(2);
    const page = await bookPage(db, ids[0] ?? "", bystander);
    expect(page?.state).toBe("available");
    expect(page?.owner_first_name).toBe("sam");
    expect(page?.cover_url).toContain("covers.openlibrary.org");
    const shelf = await listShelf(db, bystander);
    expect(shelf.map((b) => b.title)).toEqual([
      "A typed-in one",
      "The Gruffalo",
      "The Lighthouse Mouse",
    ]);
  });

  it("publishes nothing from an empty pile", async () => {
    expect(await createItems(db, asker, [])).toEqual([]);
  });
});

describe("moderation (ADR 0012)", () => {
  it("takes a book off the shelf for everyone, ends its reservation, and keeps the record", async () => {
    await reserve(db, itemId, asker);
    expect(await removeItem(db, itemId, "not a kids' book")).toBe(true);
    expect(await listShelf(db, bystander)).toEqual([]);
    expect(await bookPage(db, itemId, asker)).toBeNull();
    expect(await bookPage(db, itemId, owner)).toBeNull();
    expect(
      await moreInGenre(db, "picture books", "00000000-0000-4000-8000-000000000000", bystander),
    ).toEqual([]);
    const [row] = await listForAdmin(db, owner);
    expect(row?.status).toBe("removed");
    expect(row?.removed_reason).toBe("not a kids' book");
    expect(row?.owner_first_name).toBe("priya");
    expect(row?.removed_at).not.toBeNull();
    expect(JSON.stringify(row)).not.toContain("+44");
  });

  it("cannot be reserved while removed, and comes back as available with no memory of it", async () => {
    await removeItem(db, itemId, null);
    expect(await reserve(db, itemId, asker)).toBe(false);
    expect(await removeItem(db, itemId, null)).toBe(false);
    expect(await restoreItem(db, itemId)).toBe(true);
    expect(await restoreItem(db, itemId)).toBe(false);
    const page = await bookPage(db, itemId, bystander);
    expect(page?.state).toBe("available");
    expect((await statusOf(itemId)).removedAt).toBeNull();
  });
});

describe("requests (ADR 0013)", () => {
  it("groups live books by the other person, with their number, oldest ask first", async () => {
    // asker holds two of owner's books and one of bystander's; bystander holds one of owner's.
    const second = await freshItem();
    const bystanders = one(
      await createItems(db, bystander, [
        {
          isbn: null,
          title: "Alex's book",
          author: null,
          blurb: null,
          cover_url: null,
          genre: "chapter books",
          age_band: "7-9",
        },
      ]),
    );
    await reserve(db, itemId, asker);
    await reserve(db, bystanders, asker);
    await reserve(db, second, bystander);
    // Two asks in one millisecond tie; make the first one a day old so "oldest first" is tested,
    // not the clock.
    await db
      .update(items)
      .set({ reservedAt: new Date(Date.now() - 86_400_000) })
      .where(eq(items.id, itemId));

    const mine = await requestsFor(db, asker);
    expect(
      mine.asked_for.map((g) => [g.person.first_name, g.person.whatsapp_number, g.books.length]),
    ).toEqual([
      ["priya", "+447700900123", 1],
      ["alex", "+447700900789", 1],
    ]);
    expect(mine.asked_of_you).toEqual([]);
    expect(mine.asked_for[0]?.books[0]?.reserved_at).toMatch(/^20\d\d-/);

    const owners = await requestsFor(db, owner);
    expect(owners.asked_for).toEqual([]);
    expect(
      owners.asked_of_you.map((g) => [
        g.person.first_name,
        g.person.whatsapp_number,
        g.books.map((b) => b.title),
      ]),
    ).toEqual([
      ["sam", "+447700900456", ["The Lighthouse Mouse"]],
      ["alex", "+447700900789", ["The Lighthouse Mouse"]],
    ]);
  });

  it("shows only reserved books, and nothing of other people's business", async () => {
    const second = await freshItem();
    await reserve(db, itemId, asker);
    await collect(db, itemId, asker);
    await reserve(db, second, asker);
    await removeItem(db, second, null);
    expect(await requestsFor(db, asker)).toEqual({ asked_for: [], asked_of_you: [] });
    // A bystander with no part in anything sees nothing, and no number.
    await restoreItem(db, second);
    await reserve(db, second, asker);
    const nosy = await requestsFor(db, bystander);
    expect(nosy).toEqual({ asked_for: [], asked_of_you: [] });
    expect(JSON.stringify(nosy)).not.toContain("+44");
  });

  it("puts your own book, reserved by you, under what you've asked for and nowhere else", async () => {
    await reserve(db, itemId, owner);
    const r = await requestsFor(db, owner);
    expect(r.asked_for.map((g) => g.person.first_name)).toEqual(["priya"]);
    expect(r.asked_of_you).toEqual([]);
  });
});

describe("a person with no number yet (ADR 0014)", () => {
  it("can look but cannot ask: reserving is refused in the WHERE clause", async () => {
    const rows = await db
      .insert(profiles)
      .values({
        email: "new@example.com",
        firstName: "new",
        whatsappNumber: null,
        passwordHash: "x",
      })
      .returning({ id: profiles.id });
    const newcomer = one(rows).id;
    expect(await reserve(db, itemId, newcomer)).toBe(false);
    expect((await statusOf(itemId)).status).toBe("available");
    await db
      .update(profiles)
      .set({ whatsappNumber: "+447700900321" })
      .where(eq(profiles.id, newcomer));
    expect(await reserve(db, itemId, newcomer)).toBe(true);
  });
});

describe("cover photos (ADR 0015)", () => {
  const url = "https://example.public.blob.vercel-storage.com/covers/x-abc123.jpg";

  it("fills a gap once, for anyone, and never over existing art", async () => {
    expect(await artOf(db, itemId)).toEqual({ has_art: false, photo_url: null, removed: false });
    expect(await setPhoto(db, itemId, url)).toBe(true);
    expect(
      await setPhoto(db, itemId, "https://example.public.blob.vercel-storage.com/second.jpg"),
    ).toBe(false);
    expect((await bookPage(db, itemId, bystander))?.photo_url).toBe(url);
    expect(await artOf(db, itemId)).toEqual({ has_art: true, photo_url: url, removed: false });

    const [withCover] = await createItems(db, owner, [
      {
        isbn: null,
        title: "Has a cover",
        author: null,
        blurb: null,
        cover_url: "https://covers.openlibrary.org/b/id/1-L.jpg",
        genre: "picture books",
        age_band: "0-3",
      },
    ]);
    expect(await setPhoto(db, withCover ?? "", url)).toBe(false);
  });

  it("is refused on a removed book, and an admin can take a photo down", async () => {
    await removeItem(db, itemId, null);
    expect(await setPhoto(db, itemId, url)).toBe(false);
    await restoreItem(db, itemId);
    await setPhoto(db, itemId, url);
    expect(await clearPhoto(db, itemId)).toBe(url);
    expect(await clearPhoto(db, itemId)).toBeNull();
    expect((await bookPage(db, itemId, bystander))?.photo_url).toBeNull();
  });

  it("is null for a book that does not exist", async () => {
    expect(await artOf(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});

describe("the nav count (ADR 0016)", () => {
  it("counts your books others hold, not your own asks or anything collected", async () => {
    const second = await freshItem();
    expect(await countAskedOfYou(db, owner)).toBe(0);
    await reserve(db, itemId, asker);
    await reserve(db, second, owner); // your own book, held by you: not waiting on anyone
    expect(await countAskedOfYou(db, owner)).toBe(1);
    expect(await countAskedOfYou(db, asker)).toBe(0);
    await collect(db, itemId, asker);
    expect(await countAskedOfYou(db, owner)).toBe(0);
  });
});

describe("which shelf books are yours (ADR 0017)", () => {
  it("flags your own and nobody else's, and says nothing about who owns the rest", async () => {
    await createItems(db, asker, [
      {
        isbn: null,
        title: "Sam's book",
        author: null,
        blurb: null,
        cover_url: null,
        genre: "picture books",
        age_band: "0-3",
      },
    ]);
    const forAsker = await listShelf(db, asker);
    expect(forAsker.map((b) => [b.title, b.yours])).toEqual([
      ["Sam's book", true],
      ["The Lighthouse Mouse", false],
    ]);
    const forNosy = await listShelf(db, bystander);
    expect(forNosy.every((b) => b.yours === false)).toBe(true);
    expect(JSON.stringify(forNosy)).not.toContain("owner");
  });
});

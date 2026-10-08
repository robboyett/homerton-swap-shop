/** Accounts and sign-in, against Postgres in-process (ADR 0007). Emails are @example.com only. */

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { items } from "../db/schema";
import type { Db } from "../db/types";
import { bookPage, createItems, listShelf, reserve } from "../items";
import {
  createFirstAdmin,
  createProfile,
  EmailTakenError,
  listMembers,
  meById,
  normaliseEmail,
  removeMember,
  restoreMember,
  setPassword,
  signIn,
  updateMember,
} from "../profiles";
import { freshDb } from "./pglite";

let db: Db;

const rob = {
  email: "Rob@Example.com ",
  password: "a long one-time password",
  first_name: "rob",
  whatsapp_number: "+447700900001",
};

beforeEach(async () => {
  db = await freshDb();
});

describe("the first admin", () => {
  it("is made once, on an empty table, and is an admin", async () => {
    const me = await createFirstAdmin(db, rob);
    expect(me).not.toBeNull();
    expect(me?.is_admin).toBe(true);
    expect(me?.email).toBe("rob@example.com");
    expect(await createFirstAdmin(db, { ...rob, email: "again@example.com" })).toBeNull();
  });
});

describe("sign in", () => {
  beforeEach(async () => {
    await createFirstAdmin(db, rob);
  });

  it("works with the right password, however the email is typed", async () => {
    const me = await signIn(db, "  ROB@example.COM", rob.password);
    expect(me?.first_name).toBe("rob");
  });

  it("refuses a wrong password and an unknown email alike", async () => {
    expect(await signIn(db, rob.email, "not it")).toBeNull();
    expect(await signIn(db, "nobody@example.com", rob.password)).toBeNull();
  });

  it("returns the browser shape, never the row", async () => {
    const me = await signIn(db, rob.email, rob.password);
    expect(Object.keys(me ?? {}).sort()).toEqual(["email", "first_name", "id", "is_admin"]);
  });
});

describe("accounts", () => {
  it("are made by an admin, remember who vouched, and are not admins themselves", async () => {
    const admin = await createFirstAdmin(db, rob);
    const priya = await createProfile(
      db,
      {
        ...rob,
        email: "priya@example.com",
        first_name: " priya ",
        whatsapp_number: "+447700900123",
      },
      { invitedBy: admin?.id ?? null },
    );
    expect(priya.first_name).toBe("priya");
    expect(priya.is_admin).toBe(false);
    expect(await meById(db, priya.id)).toEqual(priya);
  });

  it("cannot share an email, whatever the case", async () => {
    await createFirstAdmin(db, rob);
    await expect(
      createProfile(db, { ...rob, email: "ROB@EXAMPLE.COM" }, { invitedBy: null }),
    ).rejects.toThrow();
  });

  it("normalises the email the one way", () => {
    expect(normaliseEmail("  Priya@Example.Com\n")).toBe("priya@example.com");
  });
});

describe("the admin screen", () => {
  it("lists everyone oldest first, with who vouched for them, and only there with emails", async () => {
    const admin = await createFirstAdmin(db, rob);
    await createProfile(
      db,
      { ...rob, email: "priya@example.com", first_name: "priya", whatsapp_number: "+447700900123" },
      { invitedBy: admin?.id ?? null },
    );
    const members = await listMembers(db);
    expect(members.map((m) => [m.first_name, m.invited_by_first_name, m.is_admin])).toEqual([
      ["rob", null, true],
      ["priya", "rob", false],
    ]);
    expect(Object.keys(members[0] ?? {}).sort()).toEqual([
      "email",
      "first_name",
      "id",
      "invited_by_first_name",
      "is_admin",
      "removed_at",
    ]);
  });

  it("names a taken email plainly", async () => {
    await createFirstAdmin(db, rob);
    await expect(
      createProfile(db, { ...rob, email: " ROB@example.com" }, { invitedBy: null }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("sets a new password, after which only the new one works", async () => {
    const me = await createFirstAdmin(db, rob);
    expect(await setPassword(db, me?.id ?? "", "fox-lamp-river-42")).toBe(true);
    expect(await signIn(db, rob.email, rob.password)).toBeNull();
    expect((await signIn(db, rob.email, "fox-lamp-river-42"))?.first_name).toBe("rob");
    expect(await setPassword(db, "00000000-0000-4000-8000-000000000000", "fox-lamp-river-42")).toBe(
      false,
    );
  });
});

describe("moderation of people (ADR 0012)", () => {
  const book = (title: string) => ({
    isbn: null,
    title,
    author: null,
    blurb: null,
    cover_url: null,
    genre: "picture books" as const,
    age_band: "0-3" as const,
  });

  it("corrects a name or number, and nothing else", async () => {
    const me = await createFirstAdmin(db, rob);
    expect(
      await updateMember(db, me?.id ?? "", {
        first_name: " robert ",
        whatsapp_number: "+447700900002",
      }),
    ).toBe(true);
    const [row] = await listMembers(db);
    expect(row?.first_name).toBe("robert");
    expect(row?.email).toBe("rob@example.com");
    expect(
      await updateMember(db, "00000000-0000-4000-8000-000000000000", {
        first_name: "x",
        whatsapp_number: "+447700900002",
      }),
    ).toBe(false);
  });

  it("removing someone signs them out, removes their books, and releases what they held", async () => {
    const admin = await createFirstAdmin(db, rob);
    const priya = await createProfile(
      db,
      { ...rob, email: "priya@example.com", first_name: "priya", whatsapp_number: "+447700900123" },
      { invitedBy: admin?.id ?? null },
    );
    const [priyas] = await createItems(db, priya.id, [book("Priya's book")]);
    const [robs] = await createItems(db, admin?.id ?? "", [book("Rob's book")]);
    await reserve(db, robs ?? "", priya.id);

    expect(await removeMember(db, priya.id)).toBe(true);

    expect(await signIn(db, "priya@example.com", rob.password)).toBeNull();
    expect(await meById(db, priya.id)).toBeNull();
    expect((await listShelf(db)).map((b) => b.title)).toEqual(["Rob's book"]);
    expect((await bookPage(db, robs ?? "", admin?.id ?? ""))?.state).toBe("available");
    const [removed] = await db
      .select()
      .from(items)
      .where(eq(items.id, priyas ?? ""));
    expect(removed?.status).toBe("removed");
    expect(removed?.removedReason).toBe("account removed");
    expect(
      (await listMembers(db)).find((m) => m.first_name === "priya")?.removed_at,
    ).not.toBeNull();

    // Safe to repeat, and reversible for the person; the books stay removed on purpose.
    expect(await removeMember(db, priya.id)).toBe(true);
    expect(await restoreMember(db, priya.id)).toBe(true);
    expect((await signIn(db, "priya@example.com", rob.password))?.first_name).toBe("priya");
    expect((await listShelf(db)).map((b) => b.title)).toEqual(["Rob's book"]);
  });
});

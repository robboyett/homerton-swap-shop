/** Accounts and sign-in, against Postgres in-process (ADR 0007). Emails are @example.com only. */
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/types";
import { createFirstAdmin, createProfile, meById, normaliseEmail, signIn } from "../profiles";
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

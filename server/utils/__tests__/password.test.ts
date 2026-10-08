import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("passwords", () => {
  it("round-trips, and two hashes of the same password differ", async () => {
    const a = await hashPassword("correct horse battery staple");
    const b = await hashPassword("correct horse battery staple");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$16384$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", a)).toBe(true);
    expect(await verifyPassword("correct horse battery staple", b)).toBe(true);
  });

  it("refuses a wrong password, and anything that is not one of our hashes", async () => {
    const hash = await hashPassword("right");
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("right", "")).toBe(false);
    expect(await verifyPassword("right", "x")).toBe(false);
    expect(await verifyPassword("right", "bcrypt$10$abc$def")).toBe(false);
    expect(await verifyPassword("right", "scrypt$notanumber$00$00")).toBe(false);
    // A key part that is not hex decodes to nothing; that must not verify everything.
    expect(await verifyPassword("right", "scrypt$16384$00$zz")).toBe(false);
    // A cost scrypt rejects must come back false, not thrown.
    expect(await verifyPassword("right", "scrypt$12345$00$00")).toBe(false);
  });
});

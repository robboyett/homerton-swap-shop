import { describe, expect, it } from "vitest";
import { cryptoRandom, onetimePassword } from "../onetime";
import { newProfileSchema } from "../schema";

describe("onetimePassword", () => {
  it("is three words and two digits, and always long enough for the rule", () => {
    for (let i = 0; i < 200; i++) {
      const p = onetimePassword(Math.random);
      expect(p).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d{2}$/);
      expect(newProfileSchema.shape.password.safeParse(p).success).toBe(true);
    }
  });

  it("is deterministic for a fixed source, and crypto gives a number in range", () => {
    expect(onetimePassword(() => 0)).toBe("apple-apple-apple-10");
    const r = cryptoRandom();
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });
});

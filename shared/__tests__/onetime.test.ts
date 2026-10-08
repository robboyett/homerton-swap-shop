import { describe, expect, it } from "vitest";
import { cryptoRandom, onetimePassword, WORD_COUNT } from "../onetime";
import { newProfileSchema } from "../schema";

describe("onetimePassword", () => {
  it("is four words and three digits, and always long enough for the rule", () => {
    for (let i = 0; i < 200; i++) {
      const p = onetimePassword(Math.random);
      expect(p).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+-\d{3}$/);
      expect(newProfileSchema.shape.password.safeParse(p).success).toBe(true);
    }
  });

  it("has at least a million million possibilities, for a sign-in route with no rate limit", () => {
    expect(WORD_COUNT).toBeGreaterThanOrEqual(200);
    expect(WORD_COUNT ** 4 * 900).toBeGreaterThan(1e12);
  });

  it("is deterministic for a fixed source, and crypto gives a number in range", () => {
    expect(onetimePassword(() => 0)).toBe("acorn-acorn-acorn-acorn-100");
    const r = cryptoRandom();
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });
});

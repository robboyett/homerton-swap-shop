import { describe, expect, it } from "vitest";
import { COVERS, coverFor } from "../covers";

describe("coverFor", () => {
  it("is one of the canvas's fifty covers, and the same one every time", () => {
    expect(COVERS.length).toBe(50);
    const a = coverFor("f83f5d50-451d-4e3c-ac8b-fd953477b10b");
    expect(COVERS).toContainEqual(a);
    expect(coverFor("f83f5d50-451d-4e3c-ac8b-fd953477b10b")).toEqual(a);
  });

  it("spreads a shelf of ids across many covers and all six shapes", () => {
    const ids = Array.from(
      { length: 200 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    const seen = new Set(ids.map((id) => coverFor(id).bg + coverFor(id).variant));
    expect(seen.size).toBeGreaterThan(30);
    expect(new Set(ids.map((id) => coverFor(id).variant)).size).toBe(6);
  });
});

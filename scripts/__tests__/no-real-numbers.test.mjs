import { describe, expect, it } from "vitest";
import { findRealNumber, isDramaNumber } from "../no-real-numbers.mjs";

describe("no-real-numbers", () => {
  it("allows the Ofcom drama range, however it is written", () => {
    expect(findRealNumber("whatsapp: 07700 900123")).toBeNull();
    expect(findRealNumber("whatsapp: +44 7700 900999")).toBeNull();
    expect(findRealNumber("whatsapp: 07700900000")).toBeNull();
    expect(findRealNumber("https://wa.me/447700900456")).toBeNull();
  });

  it("blocks a number outside the range", () => {
    expect(findRealNumber("priya: 07000 000000")).toEqual({ line: 1, found: "07000 000000" });
    expect(findRealNumber("priya: +447000000000")?.found).toBe("+447000000000");
    expect(findRealNumber("sam: 07000 000123")?.found).toBe("07000 000123");
  });

  it("reports the line it found it on", () => {
    expect(findRealNumber("one\ntwo\n07000000000\n")?.line).toBe(3);
  });

  it("does not trip on ISBNs, hashes or long digit runs", () => {
    expect(findRealNumber("isbn 9780747532699")).toBeNull();
    expect(findRealNumber("isbn 0747532699")).toBeNull();
    expect(findRealNumber("isbn: 978-0-7475-3269-9")).toBeNull();
    expect(findRealNumber("id 07700900123456789")).toBeNull();
    expect(findRealNumber("sha 4f07000000000abc")).toBeNull();
  });

  // The two near-misses below sit either side of the reserved block and exist only to prove the
  // predicate's edges. Everything else in this file uses 070 personal numbering, all zeros, which
  // is never allocated to a subscriber: an out-of-range number has to appear here by definition,
  // so it should at least be one that cannot belong to anyone (ADR 0005).
  it("knows the range boundaries", () => {
    expect(isDramaNumber("07700900000")).toBe(true);
    expect(isDramaNumber("07700900999")).toBe(true);
    expect(isDramaNumber("447700900500")).toBe(true);
    expect(isDramaNumber("07700901000")).toBe(false);
    expect(isDramaNumber("07700899999")).toBe(false);
  });
});

describe("no-real-numbers boundaries", () => {
  it("still finds a number next to punctuation and markup", () => {
    expect(findRealNumber("tel:07000000000")?.found).toBe("07000000000");
    expect(findRealNumber("https://wa.me/447000000000")?.found).toBe("447000000000");
    expect(findRealNumber("<span>07000 000000</span>")?.found).toBe("07000 000000");
    expect(findRealNumber('{"whatsapp":"+447000000000"}')?.found).toBe("+447000000000");
  });

  it("stays out of alphanumeric tokens", () => {
    expect(findRealNumber("sha512-4f07000000000abc")).toBeNull();
    expect(findRealNumber("integrity: a07000000000z")).toBeNull();
  });
});

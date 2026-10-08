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
    expect(findRealNumber("priya: 07911 123456")).toEqual({ line: 1, found: "07911 123456" });
    expect(findRealNumber("priya: +447911123456")?.found).toBe("+447911123456");
    expect(findRealNumber("sam: 07700 800123")?.found).toBe("07700 800123");
  });

  it("reports the line it found it on", () => {
    expect(findRealNumber("one\ntwo\n07911123456\n")?.line).toBe(3);
  });

  it("does not trip on ISBNs, hashes or long digit runs", () => {
    expect(findRealNumber("isbn 9780747532699")).toBeNull();
    expect(findRealNumber("isbn 0747532699")).toBeNull();
    expect(findRealNumber("isbn: 978-0-7475-3269-9")).toBeNull();
    expect(findRealNumber("id 07700900123456789")).toBeNull();
    expect(findRealNumber("sha 4f07911123456abc")).toBeNull();
  });

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
    expect(findRealNumber("tel:07911123456")?.found).toBe("07911123456");
    expect(findRealNumber("https://wa.me/447911123456")?.found).toBe("447911123456");
    expect(findRealNumber("<span>07911 123456</span>")?.found).toBe("07911 123456");
    expect(findRealNumber('{"whatsapp":"+447911123456"}')?.found).toBe("+447911123456");
  });

  it("stays out of alphanumeric tokens", () => {
    expect(findRealNumber("sha512-4f07911123456abc")).toBeNull();
    expect(findRealNumber("integrity: a07911123456z")).toBeNull();
  });
});

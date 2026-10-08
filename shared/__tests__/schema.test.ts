/**
 * The five states, and who may see whose phone number (docs/data.md, rule 4).
 *
 * This is the rule the whole product turns on, so it is tested before it has a UI. In Phase 2 the
 * same cases are decided in server/services/, which is the only gate: Neon has no row-level
 * security here (ADR 0002), so a missed check has nothing behind it.
 */
import { describe, expect, it } from "vitest";
import { bookState, type Item, showsWhatsApp } from "../schema";

const base: Item = {
  id: "i1",
  owner_id: "owner",
  kind: "book",
  isbn: null,
  title: "The Lighthouse Mouse",
  author: "J. Alder",
  blurb: null,
  genre: "picture books",
  age_band: "4-6",
  cover_url: null,
  photo_url: null,
  approx_count: null,
  status: "available",
  reserved_by: null,
  reserved_at: null,
  collected_at: null,
  created_at: "2026-10-06T09:00:00Z",
};

describe("bookState", () => {
  it("is available to everyone while it is on the shelf", () => {
    expect(bookState(base, "anyone")).toBe("available");
    expect(bookState(base, "owner")).toBe("available");
  });

  it("is mine when I am the one who reserved it", () => {
    const reserved = { ...base, status: "reserved", reserved_by: "me" } as Item;
    expect(bookState(reserved, "me")).toBe("mine");
  });

  it("is the owner's view when I own it and someone else has it", () => {
    const reserved = { ...base, status: "reserved", reserved_by: "me" } as Item;
    expect(bookState(reserved, "owner")).toBe("owner");
  });

  it("tells a bystander only that it is reserved", () => {
    const reserved = { ...base, status: "reserved", reserved_by: "me" } as Item;
    expect(bookState(reserved, "nosy")).toBe("other");
  });

  it("is collected for everyone once it has gone", () => {
    const collected = { ...base, status: "collected", reserved_by: "me" } as Item;
    for (const viewer of ["me", "owner", "nosy"]) {
      expect(bookState(collected, viewer)).toBe("collected");
    }
  });
});

describe("showsWhatsApp", () => {
  it("reveals a number only to the two people in the conversation", () => {
    expect(showsWhatsApp("mine")).toBe(true);
    expect(showsWhatsApp("owner")).toBe(true);
  });

  it("reveals nothing to a bystander, or on a book nobody has asked for", () => {
    expect(showsWhatsApp("other")).toBe(false);
    expect(showsWhatsApp("available")).toBe(false);
    expect(showsWhatsApp("collected")).toBe(false);
  });
});

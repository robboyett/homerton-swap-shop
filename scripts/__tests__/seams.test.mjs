import { describe, expect, it } from "vitest";
import { findVendorImport } from "../seams.mjs";

describe("seams", () => {
  it("finds a vendor import", () => {
    expect(findVendorImport(`import { eq } from "drizzle-orm";`)).toBe("drizzle-orm");
    expect(findVendorImport(`import { put } from "@vercel/blob";`)).toBe("@vercel/blob");
  });

  it("finds a vendor subpath and a scope prefix", () => {
    expect(findVendorImport(`import x from "drizzle-orm/neon-http";`)).toBe(
      "drizzle-orm/neon-http",
    );
    expect(findVendorImport(`import { google } from "@ai-sdk/google";`)).toBe("@ai-sdk/google");
  });

  it("leaves our own imports and near-misses alone", () => {
    expect(findVendorImport(`import { items } from "~~/server/services/items";`)).toBeNull();
    expect(findVendorImport(`import { z } from "zod";`)).toBeNull();
    // The browser barcode reader belongs in app/, so it is not a seam vendor.
    expect(findVendorImport(`import { readBarcodes } from "zxing-wasm/reader";`)).toBeNull();
    // "ai" is a vendor; a path that merely starts with those letters is not.
    expect(findVendorImport(`import { air } from "airtable-ish";`)).toBeNull();
  });

  it("honours an explicit allowance", () => {
    expect(
      findVendorImport(`import { upload } from "@vercel/blob/client";`, ["@vercel/blob/client"]),
    ).toBeNull();
  });
});

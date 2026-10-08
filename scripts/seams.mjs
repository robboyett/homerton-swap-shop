// seams: vendor packages are imported only inside server/services/.
// Walks app/, server/ (minus services) and shared/. Prints one BLOCKED line and exits 1.
//
// zxing-wasm is deliberately absent: the barcode scanner runs in the browser on the camera
// stream, so it belongs in app/, the same way a browser PDF reader would (Phase 3).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const VENDORS = [
  "drizzle-orm",
  "drizzle-kit",
  "@neondatabase/serverless",
  "@vercel/blob",
  "ai",
  "@ai-sdk/",
];

const SOURCE = /\.(ts|js|mjs|vue)$/;
const IMPORT = /(?:from\s*|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

export function findVendorImport(source, allowed = []) {
  for (const match of source.matchAll(IMPORT)) {
    const spec = match[1];
    if (allowed.includes(spec)) continue;
    for (const vendor of VENDORS) {
      if (
        spec === vendor ||
        spec.startsWith(`${vendor}/`) ||
        (vendor.endsWith("/") && spec.startsWith(vendor))
      ) {
        return spec;
      }
    }
  }
  return null;
}

export function walk(dir, files = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (SOURCE.test(entry)) files.push(path);
  }
  return files;
}

export function checkSeams(root) {
  const files = [
    ...walk(join(root, "app")),
    ...walk(join(root, "server")),
    ...walk(join(root, "shared")),
  ];
  for (const file of files) {
    const rel = relative(root, file);
    if (rel.startsWith(join("server", "services"))) continue;
    const spec = findVendorImport(readFileSync(file, "utf8"));
    if (spec) {
      return `BLOCKED: seams: ${rel} imports ${spec}. Move the call into server/services/ and import the service instead.`;
    }
  }
  return null;
}

if (process.argv[1]?.endsWith("seams.mjs")) {
  const blocked = checkSeams(process.cwd());
  if (blocked) {
    console.error(blocked);
    process.exit(1);
  }
  console.log("seams: no vendor imports outside server/services/");
}

// no-real-numbers: no UK mobile number anywhere in the tree except the Ofcom drama range.
//
// The repo is public and the product's whole job is passing people's WhatsApp numbers to each
// other. A real number committed once is public forever, so this is a gate, not a note.
// Ofcom reserves 07700 900000-900999 for fiction; every seed, fixture, test and doc uses it.
// Real numbers live only in the database, entered by the person they belong to.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  ".vercel",
  ".data",
  "dist",
  "worktrees",
]);

const TEXT = /\.(ts|js|mjs|cjs|vue|md|txt|json|jsonc|sql|html|css|ya?ml|sh|example)$/;

// Lockfiles are machine-written integrity hashes, megabytes of them, and nobody types a phone
// number into one. Skipping them is faster and removes the last source of false positives.
const SKIP_FILES = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);

// The one exemption, by exact path: this gate's own test, where an out-of-range number is the
// subject under test. Deliberately not a glob over tests — that would be the hole this closes.
const EXEMPT = join("scripts", "__tests__", "no-real-numbers.test.mjs");

// A UK mobile: optional +44 or leading 0, then 7, then nine more digits, with spaces, dots,
// dashes or brackets allowed between them.
//
// The boundaries exclude letters as well as digits, so a number has to stand on its own rather
// than sit inside a longer token. That keeps ISBNs out (they are preceded by a digit) and also
// hex and base64 hashes, which are full of digit runs: `4f07911123456abc` is not a phone number.
const UK_MOBILE = /(?<![\dA-Za-z+])(?:\+?44[\s.()-]*|0)7(?:[\s.()-]*\d){9}(?![\dA-Za-z])/g;

/** The Ofcom drama range, once separators are stripped: 07700 900000-900999. */
export function isDramaNumber(digits) {
  const national = digits.replace(/^(?:\+?44|0)/, "");
  return /^7700900\d{3}$/.test(national);
}

export function findRealNumber(source) {
  for (const match of source.matchAll(UK_MOBILE)) {
    const digits = match[0].replace(/[\s.()-]/g, "");
    if (!isDramaNumber(digits)) {
      const line = source.slice(0, match.index).split("\n").length;
      return { line, found: match[0].trim() };
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
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(path, files);
    } else if (TEXT.test(entry) && !SKIP_FILES.has(entry)) {
      files.push(path);
    }
  }
  return files;
}

export function checkNumbers(root) {
  for (const file of walk(root)) {
    const rel = relative(root, file);
    if (rel === EXEMPT) continue;
    if (rel.split(sep).some((part) => SKIP_DIRS.has(part))) continue;
    const hit = findRealNumber(readFileSync(file, "utf8"));
    if (hit) {
      return `BLOCKED: no-real-numbers: ${rel}:${hit.line} has ${hit.found}, which is not in the Ofcom drama range. Use 07700 900000-900999 in seeds, fixtures, tests and docs. If this is a real neighbour's number it must never be committed: see AGENTS.md.`;
    }
  }
  return null;
}

if (process.argv[1]?.endsWith("no-real-numbers.mjs")) {
  const blocked = checkNumbers(process.cwd());
  if (blocked) {
    console.error(blocked);
    process.exit(1);
  }
  console.log("no-real-numbers: no UK mobile numbers outside the drama range");
}

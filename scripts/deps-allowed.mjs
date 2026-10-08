// deps-allowed: every dependency in package.json must be in docs/allowed-deps.txt
// at or below the phase in docs/phase.md. Prints one BLOCKED line and exits 1.
import { readFileSync } from "node:fs";

export function parseAllowList(text) {
  const allowed = new Map();
  const denied = new Map();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("!")) {
      const [name, ...why] = line.slice(1).split(/\s+/);
      denied.set(name, why.join(" "));
      continue;
    }
    const [name, phase] = line.split(/\s+/);
    allowed.set(name, Number(phase));
  }
  return { allowed, denied };
}

export function checkDeps({ deps, allowList, phase }) {
  const { allowed, denied } = parseAllowList(allowList);
  for (const name of deps) {
    if (denied.has(name)) {
      return `BLOCKED: deps-allowed: ${name} is on the denied list. ${denied.get(name)}`;
    }
    if (!allowed.has(name)) {
      return `BLOCKED: deps-allowed: ${name} is not in docs/allowed-deps.txt. Add it with its phase, or write an ADR.`;
    }
    const depPhase = allowed.get(name);
    if (depPhase > phase) {
      return `BLOCKED: deps-allowed: ${name} is phase ${depPhase}, docs/phase.md says ${phase}. Wait, or write an ADR and bump the phase.`;
    }
  }
  return null;
}

if (process.argv[1]?.endsWith("deps-allowed.mjs")) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const allowList = readFileSync("docs/allowed-deps.txt", "utf8");
  const phase = Number(readFileSync("docs/phase.md", "utf8").trim());
  const blocked = checkDeps({ deps, allowList, phase });
  if (blocked) {
    console.error(blocked);
    process.exit(1);
  }
  console.log(`deps-allowed: ${deps.length} dependencies ok at phase ${phase}`);
}

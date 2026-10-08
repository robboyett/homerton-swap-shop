import { describe, expect, it } from "vitest";
import { checkDeps } from "../deps-allowed.mjs";

const allowList = `# name  phase  why
nuxt      0   framework
zod       1   schema
!tailwindcss  The design is one font at one size. Talk to Rob; see docs/ui.md.
`;

describe("deps-allowed", () => {
  it("passes deps at or below the phase", () => {
    expect(checkDeps({ deps: ["nuxt"], allowList, phase: 0 })).toBeNull();
    expect(checkDeps({ deps: ["nuxt", "zod"], allowList, phase: 1 })).toBeNull();
  });

  it("blocks a dependency that is not listed", () => {
    expect(checkDeps({ deps: ["inngest"], allowList, phase: 0 })).toMatch(
      /^BLOCKED: deps-allowed: inngest is not in docs\/allowed-deps.txt/,
    );
  });

  it("blocks a later-phase dependency", () => {
    expect(checkDeps({ deps: ["zod"], allowList, phase: 0 })).toMatch(
      /^BLOCKED: deps-allowed: zod is phase 1, docs\/phase.md says 0/,
    );
  });

  it("names a denied dependency as a conversation, with its reason", () => {
    expect(checkDeps({ deps: ["tailwindcss"], allowList, phase: 4 })).toMatch(
      /^BLOCKED: deps-allowed: tailwindcss is on the denied list\. The design is one font/,
    );
  });
});

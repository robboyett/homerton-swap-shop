import { describe, expect, it } from "vitest";
import { ago } from "../ago";

const day = 86_400_000;
const now = Date.parse("2026-10-09T12:00:00Z");
const at = (daysBack: number) => new Date(now - daysBack * day).toISOString();

describe("ago", () => {
  it("speaks in days, then weeks, then months", () => {
    expect(ago(at(0), now)).toBe("today");
    expect(ago(at(1), now)).toBe("yesterday");
    expect(ago(at(5), now)).toBe("5 days ago");
    expect(ago(at(13), now)).toBe("13 days ago");
    expect(ago(at(14), now)).toBe("2 weeks ago");
    expect(ago(at(42), now)).toBe("6 weeks ago");
    expect(ago(at(61), now)).toBe("2 months ago");
  });
});

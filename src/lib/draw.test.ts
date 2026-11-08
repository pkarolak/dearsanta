import { describe, expect, it } from "vitest";
import { checkFeasibility, commitDraw, drawAssignments, DrawError, type Exclusion, type Pair } from "./draw";

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function assertValid(ids: string[], pairs: Pair[], exclusions: Exclusion[] = []) {
  expect(pairs).toHaveLength(ids.length);
  expect(new Set(pairs.map((p) => p.giverId)).size).toBe(ids.length);
  expect(new Set(pairs.map((p) => p.receiverId)).size).toBe(ids.length);
  for (const p of pairs) {
    expect(p.giverId).not.toBe(p.receiverId);
    for (const ex of exclusions) {
      expect(p.giverId === ex.giverId && p.receiverId === ex.receiverId).toBe(false);
      if (ex.bidirectional) expect(p.giverId === ex.receiverId && p.receiverId === ex.giverId).toBe(false);
    }
  }
}

describe("drawAssignments", () => {
  it("never assigns anyone to themselves", () => {
    for (let n = 2; n <= 12; n++) {
      const ids = people(n);
      for (let i = 0; i < 50; i++) assertValid(ids, drawAssignments(ids, []));
    }
  });

  it("respects one-way and two-way exclusions", () => {
    const ids = people(6);
    const exclusions: Exclusion[] = [
      { giverId: "p0", receiverId: "p1", bidirectional: true },
      { giverId: "p2", receiverId: "p3", bidirectional: true },
      { giverId: "p4", receiverId: "p0", bidirectional: false },
    ];
    for (let i = 0; i < 300; i++) assertValid(ids, drawAssignments(ids, exclusions), exclusions);
  });

  it("is uniform over all valid assignments", () => {
    // 4 people have exactly 9 derangements.
    const ids = people(4);
    const counts = new Map<string, number>();
    const runs = 18_000;
    for (let i = 0; i < runs; i++) {
      const key = drawAssignments(ids, [])
        .map((p) => p.receiverId)
        .join(",");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(9);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan((runs / 9) * 0.85);
      expect(count).toBeLessThan((runs / 9) * 1.15);
    }
  });

  it("solves heavily constrained groups via the fallback", () => {
    const ids = people(10);
    // Everyone may only give to the next person: exactly one valid assignment.
    const exclusions: Exclusion[] = [];
    for (let g = 0; g < 10; g++)
      for (let r = 0; r < 10; r++)
        if (r !== g && r !== (g + 1) % 10) exclusions.push({ giverId: ids[g], receiverId: ids[r], bidirectional: false });
    const pairs = drawAssignments(ids, exclusions);
    assertValid(ids, pairs, exclusions);
    for (const p of pairs) expect(p.receiverId).toBe(ids[(ids.indexOf(p.giverId) + 1) % 10]);
  });
});

describe("checkFeasibility", () => {
  it("rejects groups smaller than two", () => {
    expect(checkFeasibility(people(1), [])).toEqual({ ok: false, reason: "too_few", blockedGiverIds: [] });
  });

  it("detects an impossible couple-only group", () => {
    const result = checkFeasibility(["a", "b"], [{ giverId: "a", receiverId: "b", bidirectional: true }]);
    expect(result.ok).toBe(false);
    expect(() => drawAssignments(["a", "b"], [{ giverId: "a", receiverId: "b", bidirectional: true }])).toThrow(DrawError);
  });

  it("names the givers that block the draw", () => {
    // a, b and c may only give to d.
    const ids = ["a", "b", "c", "d"];
    const exclusions: Exclusion[] = ["a", "b", "c"].flatMap((g) =>
      ["a", "b", "c"].filter((r) => r !== g).map((r) => ({ giverId: g, receiverId: r, bidirectional: false })),
    );
    const result = checkFeasibility(ids, exclusions);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.blockedGiverIds.length).toBeGreaterThanOrEqual(2);
  });
});

describe("commitDraw", () => {
  it("produces a stable-length hash with a fresh salt", () => {
    const pairs = drawAssignments(people(5), []);
    const a = commitDraw(pairs);
    const b = commitDraw(pairs);
    expect(a.commitment).toMatch(/^[0-9a-f]{64}$/);
    expect(a.salt).not.toBe(b.salt);
  });
});

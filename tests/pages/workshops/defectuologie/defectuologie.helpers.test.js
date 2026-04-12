import { describe, expect, it } from "vitest";
import {
  buildInitialSubgroupAssignment,
  computeBalancedSubgroupSizes,
  hasTopVoteTie,
  pickSelectedItem,
  rankItemsWithVotes,
} from "../../../../src/pages/workshops/defectuologie/defectuologie.helpers";

describe("computeBalancedSubgroupSizes", () => {
  it("returns a single group when participant count is below minimum", () => {
    expect(computeBalancedSubgroupSizes(3)).toEqual([3]);
  });

  it("splits into balanced subgroup sizes between 4 and 8", () => {
    expect(computeBalancedSubgroupSizes(9)).toEqual([5, 4]);
    expect(computeBalancedSubgroupSizes(16)).toEqual([8, 8]);
    expect(computeBalancedSubgroupSizes(17)).toEqual([6, 6, 5]);
  });
});

describe("buildInitialSubgroupAssignment", () => {
  it("sorts participants by name then id before building groups", () => {
    const participants = [
      { id: "u3", name: "Zoey" },
      { id: "u2", name: "Alice" },
      { id: "u1", name: "Alice" },
      { id: "u4", name: "Ben" },
      { id: "u5", name: "Chris" },
      { id: "u6", name: "Dora" },
      { id: "u7", name: "Evan" },
      { id: "u8", name: "Fay" },
      { id: "u9", name: "Gus" },
    ];

    const assignment = buildInitialSubgroupAssignment(participants);

    expect(Object.keys(assignment.subgroups)).toEqual(["group-1", "group-2"]);
    expect(Object.keys(assignment.subgroups["group-1"].participantIds)).toEqual([
      "u1",
      "u2",
      "u4",
      "u5",
      "u6",
    ]);
    expect(Object.keys(assignment.subgroups["group-2"].participantIds)).toEqual([
      "u7",
      "u8",
      "u9",
      "u3",
    ]);
  });
});

describe("ranking helpers", () => {
  it("ranks by vote count then createdAt then id", () => {
    const items = [
      { id: "b", createdAt: "2026-01-01T10:00:00.000Z", text: "item b" },
      { id: "a", createdAt: "2026-01-01T09:00:00.000Z", text: "item a" },
      { id: "c", createdAt: "2026-01-01T09:00:00.000Z", text: "item c" },
    ];

    const votesByItem = {
      a: new Set(["u1", "u2"]),
      c: new Set(["u3", "u4"]),
      b: new Set(["u5"]),
    };

    const ranked = rankItemsWithVotes(items, votesByItem);

    expect(ranked.map((item) => item.id)).toEqual(["a", "c", "b"]);
    expect(pickSelectedItem(ranked)?.id).toBe("a");
  });

  it("detects top tie only when top score is greater than zero", () => {
    expect(
      hasTopVoteTie([
        { id: "a", voteCount: 2 },
        { id: "b", voteCount: 2 },
      ])
    ).toBe(true);

    expect(
      hasTopVoteTie([
        { id: "a", voteCount: 0 },
        { id: "b", voteCount: 0 },
      ])
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  asObject,
  buildVotesByItem,
  countVotes,
  EMPTY_OBJECT,
  normalizeVotesByParticipant,
  toById,
} from "../../../src/pages/workshops/collaboration.shared.js";

describe("collaboration.shared", () => {
  describe("asObject", () => {
    it("returns EMPTY_OBJECT for nullish values", () => {
      expect(asObject(null)).toBe(EMPTY_OBJECT);
      expect(asObject(undefined)).toBe(EMPTY_OBJECT);
    });

    it("returns the input when it is an object (including arrays)", () => {
      const objectValue = { a: 1 };
      const arrayValue = [];

      expect(asObject(objectValue)).toBe(objectValue);
      expect(asObject(arrayValue)).toBe(arrayValue);
    });
  });

  describe("toById", () => {
    it("builds an id map and ignores missing or empty ids", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "", value: 2 },
        { value: 3 },
        { id: "b", value: 4 },
      ];

      expect(toById(items)).toEqual({
        a: { id: "a", value: 1 },
        b: { id: "b", value: 4 },
      });
    });
  });

  describe("normalizeVotesByParticipant", () => {
    it("keeps only truthy votes and drops empty participants", () => {
      const rawVotes = {
        p1: { n1: true, n2: false },
        p2: { n3: 1 },
        p3: { n4: 0 },
        p4: null,
      };

      expect(normalizeVotesByParticipant(rawVotes)).toEqual({
        p1: { n1: true },
        p2: { n3: true },
      });
    });

    it("filters votes using validIdsSet", () => {
      const rawVotes = {
        p1: { n1: true, n2: true },
        p2: { n3: true },
      };

      expect(
        normalizeVotesByParticipant(rawVotes, { validIdsSet: new Set(["n1", "n3"]) })
      ).toEqual({
        p1: { n1: true },
        p2: { n3: true },
      });
    });
  });

  describe("buildVotesByItem", () => {
    it("groups participant ids by item id", () => {
      const votesByParticipant = {
        p1: { n1: true, n2: true },
        p2: { n1: true },
      };

      const grouped = buildVotesByItem(votesByParticipant);
      expect(grouped.n1).toBeInstanceOf(Set);
      expect(grouped.n2).toBeInstanceOf(Set);
      expect([...grouped.n1]).toEqual(["p1", "p2"]);
      expect([...grouped.n2]).toEqual(["p1"]);
    });

    it("supports validIdsSet filtering and seedIds pre-initialization", () => {
      const votesByParticipant = {
        p1: { n1: true, n2: true },
      };

      const grouped = buildVotesByItem(votesByParticipant, {
        validIdsSet: new Set(["n1", "n3"]),
        seedIds: new Set(["n1", "n2", "n3"]),
      });

      expect(grouped.n1).toBeInstanceOf(Set);
      expect(grouped.n2).toBeUndefined();
      expect(grouped.n3).toBeInstanceOf(Set);
      expect([...grouped.n1]).toEqual(["p1"]);
      expect([...grouped.n3]).toEqual([]);
    });
  });

  describe("countVotes", () => {
    it("counts truthy votes", () => {
      expect(countVotes({ a: true, b: false, c: 1, d: 0 })).toBe(2);
    });

    it("counts only valid ids when a set is provided", () => {
      const votes = { a: true, b: true, c: true };
      expect(countVotes(votes, new Set(["a", "c"]))).toBe(2);
    });
  });
});

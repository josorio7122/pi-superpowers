import { describe, expect, it } from "vitest";
import { truncateEnd, truncateMiddle, visibleLength, wrapLines } from "./truncate.js";

describe("visibleLength", () => {
  it("ignores ANSI escape codes", () => {
    expect(visibleLength("[31mhello[0m")).toBe(5);
  });

  it("counts plain characters", () => {
    expect(visibleLength("hello")).toBe(5);
  });
});

describe("truncateEnd", () => {
  it("returns input unchanged when shorter than width", () => {
    expect(truncateEnd("hi", 10)).toBe("hi");
  });

  it("truncates with ellipsis when longer", () => {
    expect(truncateEnd("abcdefghij", 6)).toBe("abcde…");
  });

  it("handles width <= 1 gracefully", () => {
    expect(truncateEnd("abc", 1)).toBe("…");
    expect(truncateEnd("abc", 0)).toBe("");
  });
});

describe("truncateMiddle", () => {
  it("keeps start and end when long", () => {
    expect(truncateMiddle("abcdefghij", 7)).toBe("abc…hij");
  });

  it("returns input unchanged when short enough", () => {
    expect(truncateMiddle("hi", 10)).toBe("hi");
  });
});

describe("wrapLines", () => {
  it("wraps on word boundaries under width", () => {
    expect(wrapLines("the quick brown fox", 10)).toEqual(["the quick", "brown fox"]);
  });

  it("handles single words longer than width", () => {
    expect(wrapLines("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });
});

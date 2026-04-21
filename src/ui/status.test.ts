import { describe, expect, it } from "vitest";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./status.js";

function mockCtx() {
  const calls: Array<[string, string]> = [];
  return {
    ui: {
      setStatus: (id: string, text: string) => {
        calls.push([id, text]);
      },
    },
    __calls: calls,
  };
}

describe("setSuperpowersStatus", () => {
  it("calls ctx.ui.setStatus with the well-known id and formatted text", () => {
    const ctx = mockCtx();
    setSuperpowersStatus(ctx as never, { text: "active · 15 skills" });
    expect(ctx.__calls).toEqual([["superpowers", "🦸 active · 15 skills"]]);
  });

  it("respects color=false option (ASCII brand in ascii mode)", () => {
    const ctx = mockCtx();
    setSuperpowersStatus(ctx as never, { text: "active", color: false });
    expect(ctx.__calls[0]?.[1]).toBe("[SP] active");
  });
});

describe("clearSuperpowersStatus", () => {
  it("calls setStatus with empty string", () => {
    const ctx = mockCtx();
    clearSuperpowersStatus(ctx as never);
    expect(ctx.__calls).toEqual([["superpowers", ""]]);
  });
});

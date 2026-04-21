import { describe, expect, it } from "vitest";
import { BUILTIN_AGENTS } from "./builtin-agents.js";

describe("BUILTIN_AGENTS", () => {
  it("contains general-purpose", () => {
    expect(BUILTIN_AGENTS.some((a) => a.name === "general-purpose")).toBe(true);
  });

  it("every built-in has non-empty name, description, and body", () => {
    for (const a of BUILTIN_AGENTS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description?.length ?? 0).toBeGreaterThan(0);
      expect(a.body.length).toBeGreaterThan(0);
    }
  });

  it("general-purpose body mentions the prompt-template pattern", () => {
    const gp = BUILTIN_AGENTS.find((a) => a.name === "general-purpose");
    expect(gp?.body.toLowerCase()).toContain("prompt-template");
  });
});

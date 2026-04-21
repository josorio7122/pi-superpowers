import { describe, expect, it } from "vitest";
import { renderPiAddendum } from "./addendum.js";

describe("renderPiAddendum", () => {
  it("contains the pi tool-mapping table", () => {
    const text = renderPiAddendum({ subagentAvailable: true });
    expect(text).toContain("| `Read` | `read` |");
    expect(text).toContain("| `TodoWrite` | `task` |");
    expect(text).toContain("| `Task` | `agent` |");
  });

  it("mentions pi-native /skill:name", () => {
    expect(renderPiAddendum({ subagentAvailable: true })).toContain("/skill:");
  });

  it("warns when subagent is unavailable", () => {
    const text = renderPiAddendum({ subagentAvailable: false });
    expect(text.toLowerCase()).toContain("subagent");
    expect(text.toLowerCase()).toContain("unavailable");
  });

  it("does not warn when subagent is available", () => {
    const text = renderPiAddendum({ subagentAvailable: true });
    expect(text.toLowerCase()).not.toContain("unavailable");
  });
});

describe("renderPiAddendum lists available agent names", () => {
  it("includes agent names when provided", () => {
    const text = renderPiAddendum({
      subagentAvailable: true,
      availableAgents: ["code-reviewer", "general-purpose"],
    });
    expect(text).toContain("code-reviewer");
    expect(text).toContain("general-purpose");
    expect(text.toLowerCase()).toContain("available");
  });

  it("mentions the prompt-template pattern when general-purpose is available", () => {
    const text = renderPiAddendum({
      subagentAvailable: true,
      availableAgents: ["code-reviewer", "general-purpose"],
    });
    expect(text.toLowerCase()).toContain("prompt template");
  });

  it("does not mention prompt-template pattern when general-purpose is absent", () => {
    const text = renderPiAddendum({
      subagentAvailable: true,
      availableAgents: ["code-reviewer"],
    });
    expect(text.toLowerCase()).not.toContain("prompt template");
  });

  it("omits the agent-list section when availableAgents is empty or undefined", () => {
    expect(renderPiAddendum({ subagentAvailable: true }).toLowerCase()).not.toContain("available agents");
    expect(renderPiAddendum({ subagentAvailable: true, availableAgents: [] }).toLowerCase()).not.toContain(
      "available agents",
    );
  });

  it("includes task discipline reminder", () => {
    const text = renderPiAddendum({ subagentAvailable: true });
    expect(text).toMatch(/task discipline/i);
    expect(text).toMatch(/in_progress/);
  });

  it("describes agent tool with single + parallel dispatch", () => {
    const text = renderPiAddendum({ subagentAvailable: true });
    expect(text).toContain("`agent` tool");
    expect(text).toContain("single dispatch");
    expect(text).toContain("parallel");
    expect(text).not.toMatch(/chain/);
  });
});

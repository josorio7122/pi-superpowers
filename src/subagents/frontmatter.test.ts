import { describe, expect, it } from "vitest";
import { parseAgentMarkdown } from "./frontmatter.js";

describe("parseAgentMarkdown", () => {
  it("parses name, description, tools (comma-list), and body", () => {
    const src = `---
name: code-reviewer
description: Review completed implementation against plan
tools: read, grep, bash
model: inherit
---

System prompt body here.
More lines.`;
    const out = parseAgentMarkdown(src);
    expect(out).not.toBeNull();
    expect(out?.name).toBe("code-reviewer");
    expect(out?.description).toBe("Review completed implementation against plan");
    expect(out?.tools).toEqual(["read", "grep", "bash"]);
    expect(out?.model).toBe("inherit");
    expect(out?.body).toContain("System prompt body here.");
  });

  it("parses tools when given as a YAML array", () => {
    const src = `---
name: reviewer
tools:
  - read
  - grep
---

body`;
    const out = parseAgentMarkdown(src);
    expect(out?.tools).toEqual(["read", "grep"]);
  });

  it("returns null when frontmatter lacks name", () => {
    expect(parseAgentMarkdown("---\ndescription: x\n---\nbody")).toBeNull();
  });

  it("returns null with no frontmatter at all", () => {
    expect(parseAgentMarkdown("just a body, no frontmatter")).toBeNull();
  });
});

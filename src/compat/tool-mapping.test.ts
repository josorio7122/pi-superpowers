import { describe, expect, it } from "vitest";
import { renderToolMappingMarkdown, TOOL_MAPPING } from "./tool-mapping.js";

describe("TOOL_MAPPING", () => {
  it("maps every critical CC tool to a pi equivalent", () => {
    expect(TOOL_MAPPING.Read).toBe("read");
    expect(TOOL_MAPPING.Write).toBe("write");
    expect(TOOL_MAPPING.Edit).toBe("edit");
    expect(TOOL_MAPPING.Bash).toBe("bash");
    expect(TOOL_MAPPING.Grep).toBe("grep");
    expect(TOOL_MAPPING.Glob).toBe("glob");
    expect(TOOL_MAPPING.TodoWrite).toBe("task");
    expect(TOOL_MAPPING.Task).toBe("agent");
    expect(TOOL_MAPPING.Skill).toBe("/skill:name (pi-native)");
  });

  it("has no duplicate pi values", () => {
    const values = Object.values(TOOL_MAPPING);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    expect(dupes).toEqual([]);
  });
});

describe("renderToolMappingMarkdown", () => {
  it("produces a markdown table with all mappings", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toContain("| Claude Code | pi equivalent |");
    expect(md).toContain("| `Read` | `read` |");
    expect(md).toContain("| `TodoWrite` | `task` |");
    expect(md).toContain("| `Task` | `agent` |");
  });

  it("includes a note about /skill:name", () => {
    expect(renderToolMappingMarkdown()).toMatch(/\/skill:/);
  });
});

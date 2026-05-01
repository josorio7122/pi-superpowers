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
    expect(TOOL_MAPPING.TodoWrite).toEqual(["task_create", "task_update", "task_list", "task_get"]);
    expect(TOOL_MAPPING.Task).toBe("agent");
  });

  it("does not expose Skill as a model-invokable mapping", () => {
    expect((TOOL_MAPPING as Record<string, unknown>).Skill).toBeUndefined();
  });

  it("has no duplicate pi values across scalar mappings", () => {
    const values = Object.values(TOOL_MAPPING) as Array<string | readonly string[]>;
    const scalars = values.filter((v): v is string => typeof v === "string");
    const dupes = scalars.filter((v, i) => scalars.indexOf(v) !== i);
    expect(dupes).toEqual([]);
  });
});

describe("renderToolMappingMarkdown", () => {
  it("produces a markdown table with all mappings", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toContain("| Claude Code | pi equivalent |");
    expect(md).toContain("| `Read` | `read` |");
    expect(md).toContain("| `TodoWrite` | `task_create` / `task_update` / `task_list` / `task_get` |");
    expect(md).toContain("| `Task` | `agent` |");
  });

  it("does not include a Skill row (not a model-invokable tool)", () => {
    const md = renderToolMappingMarkdown();
    expect(md).not.toContain("| `Skill` |");
  });

  it("directs the model to read SKILL.md at the location listed in <available_skills>", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toContain("<available_skills>");
    expect(md).toContain("<location>");
    expect(md).toContain("`read`");
  });

  it("does not tell the model to invoke /skill:name", () => {
    expect(renderToolMappingMarkdown()).not.toMatch(/\/skill:/);
  });
});

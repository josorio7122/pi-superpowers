import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findAgent, loadAgents } from "./loader.js";

async function fixture(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "pisup-agents-"));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content);
  }
  return dir;
}

describe("loadAgents", () => {
  it("loads valid agents from a dir (plus built-in general-purpose)", async () => {
    const dir = await fixture({
      "code-reviewer.md": "---\nname: code-reviewer\ndescription: x\n---\nbody",
      "other.md": "---\nname: other\n---\nbody",
    });
    const { agents, diagnostics } = await loadAgents({ agentsDir: dir });
    expect(findAgent(agents, "code-reviewer")?.description).toBe("x");
    expect(findAgent(agents, "other")).toBeDefined();
    expect(findAgent(agents, "general-purpose")).toBeDefined();
    expect(diagnostics).toEqual([]);
  });

  it("diagnostics non-markdown and invalid frontmatter", async () => {
    const dir = await fixture({
      "valid.md": "---\nname: valid\n---\nbody",
      "noname.md": "---\ndescription: missing\n---\nbody",
      "readme.txt": "not a markdown",
    });
    const { agents, diagnostics } = await loadAgents({ agentsDir: dir });
    expect(findAgent(agents, "valid")).toBeDefined();
    expect(findAgent(agents, "general-purpose")).toBeDefined();
    expect(diagnostics.some((d) => d.file === "noname.md")).toBe(true);
  });

  it("returns diagnostic when agents dir is missing (still includes built-ins)", async () => {
    const { agents, diagnostics } = await loadAgents({ agentsDir: "/nonexistent/path/xyz" });
    expect(findAgent(agents, "general-purpose")).toBeDefined();
    expect(diagnostics).toHaveLength(1);
  });
});

describe("findAgent", () => {
  it("returns undefined for missing name", () => {
    expect(findAgent([{ name: "a", body: "" }], "missing")).toBeUndefined();
  });
});

describe("loadAgents includes pi-superpowers built-ins", () => {
  it("adds general-purpose when upstream agents dir has no collision", async () => {
    const { agents } = await loadAgents({ agentsDir: "/nonexistent/xyz" });
    expect(agents.some((a) => a.name === "general-purpose")).toBe(true);
  });

  it("upstream agents/*.md wins on name collision with a built-in", async () => {
    const dir = await fixture({
      "general-purpose.md": "---\nname: general-purpose\ndescription: Upstream-authored\n---\nUpstream body wins.",
    });
    const { agents } = await loadAgents({ agentsDir: dir });
    const gp = agents.find((a) => a.name === "general-purpose");
    expect(gp?.body).toContain("Upstream body wins.");
  });
});

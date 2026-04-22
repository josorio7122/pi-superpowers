import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { buildAllAgentConfigs } from "./build-all-configs.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

let sessionDir: string;
let skillsDir: string;

async function writeSkill(opts: { root: string; name: string; description: string }): Promise<void> {
  const dir = join(opts.root, opts.name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "SKILL.md"), `---\nname: ${opts.name}\ndescription: ${opts.description}\n---\n\nBody.\n`);
}

beforeEach(async () => {
  sessionDir = await mkdtemp(join(tmpdir(), "pisup-configs-"));
  skillsDir = await mkdtemp(join(tmpdir(), "pisup-skills-"));
});

describe("buildAllAgentConfigs", () => {
  it("returns an empty array when no agents are provided", async () => {
    const result = await buildAllAgentConfigs({ agents: [], sessionDir, skillsDir });
    expect(result.configs).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it("builds a validated AgentConfig per agent", async () => {
    await writeSkill({ root: skillsDir, name: "brainstorming", description: "Use for creative work." });
    const agents: AgentFrontmatterLike[] = [
      { name: "code-reviewer", body: "You are a reviewer." },
      { name: "general-purpose", body: "You are a worker." },
    ];
    const result = await buildAllAgentConfigs({ agents, sessionDir, skillsDir });
    expect(result.configs).toHaveLength(2);
    expect(result.configs.map((c) => c.frontmatter.name).sort()).toEqual(["code-reviewer", "general-purpose"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("threads scanned skills into every built AgentConfig", async () => {
    await writeSkill({ root: skillsDir, name: "brainstorming", description: "Use for creative work." });
    await writeSkill({ root: skillsDir, name: "writing-plans", description: "Use after a spec." });
    const agents: AgentFrontmatterLike[] = [
      { name: "code-reviewer", body: "You are a reviewer." },
      { name: "general-purpose", body: "You are a worker." },
    ];
    const result = await buildAllAgentConfigs({ agents, sessionDir, skillsDir });
    expect(result.configs).toHaveLength(2);
    for (const cfg of result.configs) {
      expect(cfg.frontmatter.skills).toHaveLength(2);
      const paths = [...(cfg.frontmatter.skills ?? [])].sort();
      expect(paths[0]).toContain("brainstorming/SKILL.md");
      expect(paths[1]).toContain("writing-plans/SKILL.md");
    }
  });

  it("falls back to the using-superpowers skill when the scan yields zero skills", async () => {
    const agents: AgentFrontmatterLike[] = [{ name: "code-reviewer", body: "You are a reviewer." }];
    const result = await buildAllAgentConfigs({ agents, sessionDir, skillsDir: "/nonexistent/path/xyz" });
    expect(result.configs).toHaveLength(1);
    const skills = result.configs[0]?.frontmatter.skills ?? [];
    expect(skills).toHaveLength(1);
    expect(skills[0]).toContain("using-superpowers/SKILL.md");
    expect(result.diagnostics.some((d) => d.message.includes("skills dir missing"))).toBe(true);
  });

  it("records diagnostics for agents that fail pi-agents validation", async () => {
    await writeSkill({ root: skillsDir, name: "brainstorming", description: "Use for creative work." });
    const agents: AgentFrontmatterLike[] = [{ name: "broken", body: "" }];
    const result = await buildAllAgentConfigs({ agents, sessionDir, skillsDir });
    expect(result.configs).toHaveLength(0);
    expect(result.diagnostics.some((d) => /system prompt/i.test(d.message))).toBe(true);
  });
});

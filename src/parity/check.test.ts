import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { loadCommands } from "../commands/loader.js";
import { vendorRoot as realVendorRoot } from "../common/paths.js";
import { BUILTIN_AGENTS } from "../subagents/builtin-agents.js";
import { loadAgents } from "../subagents/loader.js";
import { runParityCheck } from "./check.js";

let tmp: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "pi-parity-"));
  await mkdir(join(tmp, "skills", "brainstorming"), { recursive: true });
  await writeFile(join(tmp, "skills", "brainstorming", "SKILL.md"), "---\nname: brainstorming\n---\n");
  await mkdir(join(tmp, "agents"), { recursive: true });
  await writeFile(join(tmp, "agents", "code-reviewer.md"), "---\nname: code-reviewer\n---\nbody");
  await mkdir(join(tmp, "commands"), { recursive: true });
  await writeFile(join(tmp, "commands", "brainstorm.md"), "---\ndescription: x\n---\n");
});

describe("runParityCheck", () => {
  it("reports zero drift when every vendor surface is registered", async () => {
    const report = await runParityCheck(tmp, {
      registeredSkills: ["brainstorming"],
      registeredAgents: ["code-reviewer"],
      registeredCommands: ["brainstorm"],
      builtinAgents: [],
    });
    expect(report.missing).toEqual({ skills: [], agents: [], commands: [] });
    expect(report.extras).toEqual({ skills: [], agents: [], commands: [] });
    expect(report.unknownCategories).toEqual([]);
    expect(report.hasDrift).toBe(false);
  });

  it("reports missing registrations", async () => {
    const report = await runParityCheck(tmp, {
      registeredSkills: [],
      registeredAgents: [],
      registeredCommands: [],
      builtinAgents: [],
    });
    expect(report.missing.skills).toEqual(["brainstorming"]);
    expect(report.missing.agents).toEqual(["code-reviewer"]);
    expect(report.missing.commands).toEqual(["brainstorm"]);
    expect(report.hasDrift).toBe(true);
  });

  it("reports extras that aren't in vendor", async () => {
    const report = await runParityCheck(tmp, {
      registeredSkills: ["brainstorming", "ghost-skill"],
      registeredAgents: ["code-reviewer"],
      registeredCommands: ["brainstorm"],
      builtinAgents: [],
    });
    expect(report.extras.skills).toEqual(["ghost-skill"]);
    expect(report.hasDrift).toBe(true);
  });

  it("allows builtin agents without flagging them as extras", async () => {
    const report = await runParityCheck(tmp, {
      registeredSkills: ["brainstorming"],
      registeredAgents: ["code-reviewer", "general-purpose"],
      registeredCommands: ["brainstorm"],
      builtinAgents: ["general-purpose"],
    });
    expect(report.extras.agents).toEqual([]);
    expect(report.hasDrift).toBe(false);
  });

  it("flags unknown top-level categories", async () => {
    await mkdir(join(tmp, "mcp-servers"), { recursive: true });
    const report = await runParityCheck(tmp, {
      registeredSkills: ["brainstorming"],
      registeredAgents: ["code-reviewer"],
      registeredCommands: ["brainstorm"],
      builtinAgents: [],
    });
    expect(report.unknownCategories).toContain("mcp-servers");
    expect(report.hasDrift).toBe(true);
  });
});

describe("runParityCheck against real vendor/", () => {
  it("reports zero drift for the current repo", async () => {
    const vendor = realVendorRoot();
    const skillDirs = (await readdir(join(vendor, "skills"))).filter((n) => !n.startsWith("."));
    const { agents } = await loadAgents();
    const commands = await loadCommands(vendor);
    const report = await runParityCheck(vendor, {
      registeredSkills: skillDirs,
      registeredAgents: agents.map((a) => a.name),
      registeredCommands: commands.map((c) => c.name),
      builtinAgents: BUILTIN_AGENTS.map((a) => a.name),
    });
    expect(report.hasDrift, JSON.stringify(report, null, 2)).toBe(false);
  });
});

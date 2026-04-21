import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { scanVendorSkills } from "./scan.js";

let tmp: string;

async function writeSkill(opts: { root: string; name: string; description: string }): Promise<void> {
  const dir = join(opts.root, opts.name);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "SKILL.md"),
    `---\nname: ${opts.name}\ndescription: ${opts.description}\n---\n\nBody of ${opts.name}.\n`,
  );
}

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "pisup-scan-"));
});

describe("scanVendorSkills", () => {
  it("returns every skill directory sorted alphabetically by name", async () => {
    await writeSkill({ root: tmp, name: "writing-plans", description: "Use when you have a spec." });
    await writeSkill({ root: tmp, name: "brainstorming", description: "Use for creative work." });
    await writeSkill({ root: tmp, name: "test-driven-development", description: "Use when implementing." });

    const result = await scanVendorSkills(tmp);

    expect(result.diagnostics).toEqual([]);
    expect(result.skills.map((s) => s.name)).toEqual(["brainstorming", "test-driven-development", "writing-plans"]);
    expect(result.skills[0]).toMatchObject({
      name: "brainstorming",
      path: join(tmp, "brainstorming", "SKILL.md"),
      description: "Use for creative work.",
    });
  });

  it("records a diagnostic when a SKILL.md has unparseable frontmatter and still returns the good ones", async () => {
    await writeSkill({ root: tmp, name: "good-skill", description: "Valid skill." });
    const badDir = join(tmp, "broken-skill");
    await mkdir(badDir, { recursive: true });
    await writeFile(join(badDir, "SKILL.md"), "---\nname: broken\n  bad: [unclosed\n---\nBody.\n");

    const result = await scanVendorSkills(tmp);

    expect(result.skills.map((s) => s.name)).toEqual(["good-skill"]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({ level: "error", filePath: join(badDir, "SKILL.md") });
    expect(result.diagnostics[0]?.message).toMatch(/parse failed/i);
  });

  it("falls back to the directory name when frontmatter omits name", async () => {
    const dir = join(tmp, "no-name");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "SKILL.md"), "---\ndescription: No name field.\n---\nBody.\n");

    const result = await scanVendorSkills(tmp);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]?.name).toBe("no-name");
    expect(result.skills[0]?.description).toBe("No name field.");
  });

  it("returns empty description when frontmatter omits it", async () => {
    const dir = join(tmp, "no-desc");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "SKILL.md"), "---\nname: no-desc\n---\nBody.\n");

    const result = await scanVendorSkills(tmp);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]?.description).toBe("");
  });

  it("silently skips subdirectories without a SKILL.md file", async () => {
    await writeSkill({ root: tmp, name: "real-skill", description: "Real." });
    await mkdir(join(tmp, "shared"), { recursive: true });
    await writeFile(join(tmp, "shared", "README.md"), "not a skill");

    const result = await scanVendorSkills(tmp);

    expect(result.skills.map((s) => s.name)).toEqual(["real-skill"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("returns empty skills and a warn diagnostic when the dir does not exist", async () => {
    const result = await scanVendorSkills("/nonexistent/path/xyz");
    expect(result.skills).toEqual([]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      level: "warn",
      filePath: "/nonexistent/path/xyz",
      message: "skills dir missing",
    });
  });
});

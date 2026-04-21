import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildInjectHandler } from "./inject.js";

async function fixtureSkill(body: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "pisup-boot-"));
  const skillDir = join(dir, "skills", "using-superpowers");
  await mkdir(skillDir, { recursive: true });
  const skillPath = join(skillDir, "SKILL.md");
  await writeFile(skillPath, body);
  return skillPath;
}

function mockCtx(entries: unknown[] = []) {
  return {
    sessionManager: {
      getEntries: () => entries,
    },
    ui: {
      notify: (_m: string, _l?: string) => undefined,
      setStatus: (_id: string, _t: string) => undefined,
    },
  };
}

const priorBootstrapEntry = {
  customType: "superpowers-bootstrap",
  content: "<EXTREMELY_IMPORTANT>\nYou have superpowers.\n…",
};

describe("buildInjectHandler", () => {
  it("injects a persistent message on first turn (only the user prompt in session)", async () => {
    const skillPath = await fixtureSkill("# using-superpowers\n\nBody content");
    const handler = buildInjectHandler({
      usingSkillPath: skillPath,
      subagentAvailable: true,
    });
    // before_agent_start fires AFTER user prompt is entered, so entries is non-empty
    // on the first turn. Detection must not rely on length === 0.
    const out = await handler(
      { prompt: "hi", images: [], systemPrompt: "" },
      mockCtx([{ role: "user", content: "hi" }]),
    );
    expect(out?.message).toBeDefined();
    expect(out?.message?.content).toContain("using-superpowers");
    expect(out?.message?.content).toContain("Body content");
    expect(out?.message?.content).toContain("| `Read` | `read` |");
    expect(out?.message?.customType).toBe("superpowers-bootstrap");
    expect(out?.message?.display).toBe(false);
  });

  it("returns undefined on subsequent turns (prior bootstrap message in history)", async () => {
    const skillPath = await fixtureSkill("# x");
    const handler = buildInjectHandler({ usingSkillPath: skillPath, subagentAvailable: true });
    const out = await handler(
      { prompt: "hi again", images: [], systemPrompt: "" },
      mockCtx([priorBootstrapEntry, { role: "user", content: "first" }, { role: "user", content: "hi again" }]),
    );
    expect(out).toBeUndefined();
  });

  it("injects only the addendum if skill file missing", async () => {
    const handler = buildInjectHandler({ usingSkillPath: "/nope/x.md", subagentAvailable: true });
    const out = await handler(
      { prompt: "hi", images: [], systemPrompt: "" },
      mockCtx([{ role: "user", content: "hi" }]),
    );
    expect(out?.message?.content).toContain("| `Read` | `read` |");
    expect(out?.message?.content.toLowerCase()).toContain("could not load");
  });
});

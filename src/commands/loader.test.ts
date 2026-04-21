import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { loadCommands } from "./loader.js";

let tmp: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "pi-cmds-"));
  await mkdir(join(tmp, "commands"), { recursive: true });
});

describe("loadCommands", () => {
  it("returns empty array when commands dir is missing", async () => {
    const missing = join(tmp, "does-not-exist");
    const result = await loadCommands(missing);
    expect(result).toEqual([]);
  });

  it("parses description from frontmatter and trims body", async () => {
    await writeFile(
      join(tmp, "commands", "brainstorm.md"),
      '---\ndescription: "Deprecated - use skill"\n---\n\nTell the user to use /skill:brainstorming.\n',
    );
    const result = await loadCommands(tmp);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "brainstorm",
      description: "Deprecated - use skill",
      body: "Tell the user to use /skill:brainstorming.",
    });
  });

  it("falls back to file basename when description is missing", async () => {
    await writeFile(join(tmp, "commands", "bare.md"), "just body, no frontmatter\n");
    const [cmd] = await loadCommands(tmp);
    expect(cmd?.name).toBe("bare");
    expect(cmd?.description).toBe("bare");
  });

  it("sorts results by name", async () => {
    await writeFile(join(tmp, "commands", "zebra.md"), "---\ndescription: z\n---\n");
    await writeFile(join(tmp, "commands", "alpha.md"), "---\ndescription: a\n---\n");
    const result = await loadCommands(tmp);
    expect(result.map((c) => c.name)).toEqual(["alpha", "zebra"]);
  });

  it("ignores non-md files", async () => {
    await writeFile(join(tmp, "commands", "README.txt"), "not a command");
    await writeFile(join(tmp, "commands", "ok.md"), "---\ndescription: ok\n---\n");
    const result = await loadCommands(tmp);
    expect(result.map((c) => c.name)).toEqual(["ok"]);
  });
});

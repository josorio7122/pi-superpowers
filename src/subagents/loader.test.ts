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
	it("loads valid agents from a dir", async () => {
		const dir = await fixture({
			"code-reviewer.md": "---\nname: code-reviewer\ndescription: x\n---\nbody",
			"other.md": "---\nname: other\n---\nbody",
		});
		const { agents, diagnostics } = await loadAgents({ agentsDir: dir });
		expect(agents).toHaveLength(2);
		expect(diagnostics).toEqual([]);
		expect(findAgent(agents, "code-reviewer")?.description).toBe("x");
	});

	it("diagnostics non-markdown and invalid frontmatter", async () => {
		const dir = await fixture({
			"valid.md": "---\nname: valid\n---\nbody",
			"noname.md": "---\ndescription: missing\n---\nbody",
			"readme.txt": "not a markdown",
		});
		const { agents, diagnostics } = await loadAgents({ agentsDir: dir });
		expect(agents).toHaveLength(1);
		expect(diagnostics.some((d) => d.file === "noname.md")).toBe(true);
	});

	it("returns diagnostic when agents dir is missing", async () => {
		const { agents, diagnostics } = await loadAgents({ agentsDir: "/nonexistent/path/xyz" });
		expect(agents).toEqual([]);
		expect(diagnostics).toHaveLength(1);
	});
});

describe("findAgent", () => {
	it("returns undefined for missing name", () => {
		expect(findAgent([{ name: "a", body: "" }], "missing")).toBeUndefined();
	});
});

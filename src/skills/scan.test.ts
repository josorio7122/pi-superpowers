import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { scanVendorSkills } from "./scan.js";

let tmp: string;

async function writeSkill(root: string, name: string, description: string): Promise<void> {
	const dir = join(root, name);
	await mkdir(dir, { recursive: true });
	await writeFile(
		join(dir, "SKILL.md"),
		`---\nname: ${name}\ndescription: ${description}\n---\n\nBody of ${name}.\n`,
	);
}

beforeEach(async () => {
	tmp = await mkdtemp(join(tmpdir(), "pisup-scan-"));
});

describe("scanVendorSkills", () => {
	it("returns every skill directory sorted alphabetically by name", async () => {
		await writeSkill(tmp, "writing-plans", "Use when you have a spec.");
		await writeSkill(tmp, "brainstorming", "Use for creative work.");
		await writeSkill(tmp, "test-driven-development", "Use when implementing.");

		const result = await scanVendorSkills(tmp);

		expect(result.diagnostics).toEqual([]);
		expect(result.skills.map((s) => s.name)).toEqual([
			"brainstorming",
			"test-driven-development",
			"writing-plans",
		]);
		expect(result.skills[0]).toMatchObject({
			name: "brainstorming",
			path: join(tmp, "brainstorming", "SKILL.md"),
			description: "Use for creative work.",
		});
	});
});

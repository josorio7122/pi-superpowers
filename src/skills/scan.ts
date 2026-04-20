import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { vendorSkillsDir } from "../common/paths.js";

export type VendorSkill = Readonly<{
	name: string;
	path: string;
	description: string;
}>;

export type ScanDiagnostic = Readonly<{
	level: "error" | "warn";
	filePath: string;
	message: string;
}>;

export type ScanResult = Readonly<{
	skills: ReadonlyArray<VendorSkill>;
	diagnostics: ReadonlyArray<ScanDiagnostic>;
}>;

export async function scanVendorSkills(skillsDir: string = vendorSkillsDir()): Promise<ScanResult> {
	const skills: VendorSkill[] = [];
	const diagnostics: ScanDiagnostic[] = [];

	let entries: string[];
	try {
		entries = await readdir(skillsDir);
	} catch {
		return {
			skills: [],
			diagnostics: [{ level: "warn", filePath: skillsDir, message: "skills dir missing" }],
		};
	}

	await Promise.all(
		entries.map(async (entry) => {
			if (entry.startsWith(".")) return;
			const dir = join(skillsDir, entry);
			const dirStat = await stat(dir).catch(() => null);
			if (!dirStat?.isDirectory()) return;
			const skillFile = join(dir, "SKILL.md");
			const fileStat = await stat(skillFile).catch(() => null);
			if (!fileStat?.isFile()) return;
			try {
				const src = await readFile(skillFile, "utf8");
				const parsed = matter(src);
				const fm = parsed.data as Record<string, unknown>;
				const name = typeof fm.name === "string" && fm.name.trim() ? fm.name.trim() : entry;
				const description = typeof fm.description === "string" ? fm.description.trim() : "";
				skills.push({ name, path: skillFile, description });
			} catch (err) {
				diagnostics.push({
					level: "error",
					filePath: skillFile,
					message: `parse failed: ${(err as Error).message}`,
				});
			}
		}),
	);

	skills.sort((a, b) => a.name.localeCompare(b.name));
	return { skills, diagnostics };
}

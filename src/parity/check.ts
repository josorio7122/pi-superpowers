import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export type RegistrationSnapshot = {
	registeredSkills: string[];
	registeredAgents: string[];
	registeredCommands: string[];
	builtinAgents: string[];
};

export type ParityReport = {
	missing: { skills: string[]; agents: string[]; commands: string[] };
	extras: { skills: string[]; agents: string[]; commands: string[] };
	unknownCategories: string[];
	hasDrift: boolean;
};

const KNOWN_CATEGORIES = new Set(["skills", "agents", "commands", "hooks", "docs", "scripts", "tests", "plugin"]);

async function readDirSafe(dir: string): Promise<string[]> {
	try {
		return await readdir(dir);
	} catch {
		return [];
	}
}

async function listSkillNames(skillsDir: string): Promise<string[]> {
	const entries = await readDirSafe(skillsDir);
	const names: string[] = [];
	for (const entry of entries) {
		const info = await stat(join(skillsDir, entry)).catch(() => null);
		if (info?.isDirectory()) names.push(entry);
	}
	return names.sort();
}

function listMdBasenames(entries: string[]): string[] {
	return entries
		.filter((e) => e.endsWith(".md"))
		.map((e) => e.replace(/\.md$/, ""))
		.sort();
}

type DiffResult = { missing: string[]; extras: string[] };
type DiffInput = { vendor: string[]; registered: string[]; whitelist?: string[] };

function diff(input: DiffInput): DiffResult {
	const vendorSet = new Set(input.vendor);
	const whiteSet = new Set(input.whitelist ?? []);
	const registeredSet = new Set(input.registered);
	const missing = input.vendor.filter((n) => !registeredSet.has(n));
	const extras = input.registered.filter((n) => !vendorSet.has(n) && !whiteSet.has(n));
	return { missing, extras };
}

async function listUnknownCategories(vendorRoot: string): Promise<string[]> {
	const entries = await readDirSafe(vendorRoot);
	const unknown: string[] = [];
	for (const entry of entries) {
		const info = await stat(join(vendorRoot, entry)).catch(() => null);
		if (info?.isDirectory() && !KNOWN_CATEGORIES.has(entry)) unknown.push(entry);
	}
	return unknown.sort();
}

export async function runParityCheck(vendorRoot: string, snap: RegistrationSnapshot): Promise<ParityReport> {
	const vendorSkills = await listSkillNames(join(vendorRoot, "skills"));
	const vendorAgents = listMdBasenames(await readDirSafe(join(vendorRoot, "agents")));
	const vendorCommands = listMdBasenames(await readDirSafe(join(vendorRoot, "commands")));
	const unknownCategories = await listUnknownCategories(vendorRoot);

	const skills = diff({ vendor: vendorSkills, registered: snap.registeredSkills });
	const agents = diff({ vendor: vendorAgents, registered: snap.registeredAgents, whitelist: snap.builtinAgents });
	const commands = diff({ vendor: vendorCommands, registered: snap.registeredCommands });

	const hasDrift =
		skills.missing.length > 0 ||
		skills.extras.length > 0 ||
		agents.missing.length > 0 ||
		agents.extras.length > 0 ||
		commands.missing.length > 0 ||
		commands.extras.length > 0 ||
		unknownCategories.length > 0;

	return {
		missing: { skills: skills.missing, agents: agents.missing, commands: commands.missing },
		extras: { skills: skills.extras, agents: agents.extras, commands: commands.extras },
		unknownCategories,
		hasDrift,
	};
}

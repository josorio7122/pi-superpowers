import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import matter from "gray-matter";

export type CommandDescriptor = {
	name: string;
	description: string;
	body: string;
};

export async function loadCommands(vendorRoot: string): Promise<CommandDescriptor[]> {
	const dir = join(vendorRoot, "commands");
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		return [];
	}

	const descriptors: CommandDescriptor[] = [];
	for (const entry of entries) {
		if (!entry.endsWith(".md")) continue;
		const raw = await readFile(join(dir, entry), "utf8");
		const parsed = matter(raw);
		const name = basename(entry, ".md");
		const description =
			typeof parsed.data.description === "string" && parsed.data.description.trim().length > 0
				? parsed.data.description.trim()
				: name;
		descriptors.push({ name, description, body: parsed.content.trim() });
	}

	descriptors.sort((a, b) => a.name.localeCompare(b.name));
	return descriptors;
}

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { vendorAgentsDir } from "../common/paths.js";
import { BUILTIN_AGENTS } from "./builtin-agents.js";
import { type AgentFrontmatterLike, parseAgentMarkdown } from "./frontmatter.js";

export type LoadAgentsOptions = {
	agentsDir?: string;
};

export type LoadedAgents = {
	agents: AgentFrontmatterLike[];
	diagnostics: Array<{ file: string; reason: string }>;
};

function mergeBuiltins(upstream: AgentFrontmatterLike[]): AgentFrontmatterLike[] {
	const seenNames = new Set(upstream.map((a) => a.name));
	const merged = [...upstream];
	for (const builtin of BUILTIN_AGENTS) {
		if (seenNames.has(builtin.name)) continue;
		merged.push(builtin);
	}
	return merged;
}

export async function loadAgents(opts: LoadAgentsOptions = {}): Promise<LoadedAgents> {
	const dir = opts.agentsDir ?? vendorAgentsDir();
	const agents: AgentFrontmatterLike[] = [];
	const diagnostics: Array<{ file: string; reason: string }> = [];

	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		return { agents: mergeBuiltins(agents), diagnostics: [{ file: dir, reason: "agents dir missing" }] };
	}

	for (const name of entries) {
		if (!name.endsWith(".md")) continue;
		const path = join(dir, name);
		try {
			const src = await readFile(path, "utf8");
			const parsed = parseAgentMarkdown(src);
			if (!parsed) {
				diagnostics.push({ file: name, reason: "missing or invalid frontmatter" });
				continue;
			}
			agents.push(parsed);
		} catch (err) {
			diagnostics.push({ file: name, reason: `read failed: ${(err as Error).message}` });
		}
	}

	return { agents: mergeBuiltins(agents), diagnostics };
}

export function findAgent(agents: AgentFrontmatterLike[], name: string): AgentFrontmatterLike | undefined {
	return agents.find((a) => a.name === name);
}

#!/usr/bin/env tsx
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadCommands } from "../src/commands/loader.js";
import { vendorRoot } from "../src/common/paths.js";
import { runParityCheck } from "../src/parity/check.js";
import { BUILTIN_AGENTS } from "../src/subagents/builtin-agents.js";
import { loadAgents } from "../src/subagents/loader.js";

const vendor = vendorRoot();
const skillDirs = (await readdir(join(vendor, "skills"))).filter((n) => !n.startsWith("."));
const { agents } = await loadAgents();
const commands = await loadCommands(vendor);

const report = await runParityCheck(vendor, {
	registeredSkills: skillDirs,
	registeredAgents: agents.map((a) => a.name),
	registeredCommands: commands.map((c) => c.name),
	builtinAgents: BUILTIN_AGENTS.map((a) => a.name),
});

if (report.hasDrift) {
	console.error("Parity drift detected:");
	console.error(JSON.stringify(report, null, 2));
	process.exit(1);
}

console.log(
	`Parity OK — ${skillDirs.length} skills, ${agents.length} agents (${BUILTIN_AGENTS.length} builtin), ${commands.length} commands`,
);

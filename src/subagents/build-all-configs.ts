import type { AgentConfig, DiscoveryDiagnostic } from "pi-agents";
import { validateAgent } from "pi-agents";
import { vendorUsingSuperpowersSkill } from "../common/paths.js";
import { scanVendorSkills, type VendorSkill } from "../skills/scan.js";
import { buildAgentConfig } from "./agent-config-builder.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

export type BuildAllProps = {
	agents: ReadonlyArray<AgentFrontmatterLike>;
	sessionDir: string;
	skillsDir?: string;
};

export type BuildAllResult = {
	configs: ReadonlyArray<AgentConfig>;
	diagnostics: ReadonlyArray<DiscoveryDiagnostic>;
};

function fallbackSkills(): ReadonlyArray<VendorSkill> {
	return [{ name: "using-superpowers", path: vendorUsingSuperpowersSkill(), description: "" }];
}

export async function buildAllAgentConfigs(props: BuildAllProps): Promise<BuildAllResult> {
	const configs: AgentConfig[] = [];
	const diagnostics: DiscoveryDiagnostic[] = [];

	const scan = await scanVendorSkills(props.skillsDir);
	for (const d of scan.diagnostics) {
		diagnostics.push({
			level: d.level === "warn" ? "warning" : d.level,
			filePath: d.filePath,
			message: d.message,
		});
	}

	// pi-agents' AgentConfig schema requires skills.min(1). If the scan returned nothing
	// (vendor tree missing or empty), fall back to using-superpowers so dispatched
	// agents still validate and at least get the base methodology skill inlined.
	const skills = scan.skills.length > 0 ? scan.skills : fallbackSkills();

	for (const agent of props.agents) {
		const built = await buildAgentConfig(agent, { sessionDir: props.sessionDir, skills });
		const validation = validateAgent({
			frontmatter: built.frontmatter,
			body: built.systemPrompt,
			filePath: built.filePath,
			source: built.source,
		});
		if (validation.ok) {
			configs.push(validation.value);
		} else {
			diagnostics.push(...validation.errors);
		}
	}

	return { configs, diagnostics };
}

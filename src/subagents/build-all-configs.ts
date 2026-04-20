import type { AgentConfig, DiscoveryDiagnostic } from "pi-agents";
import { validateAgent } from "pi-agents";
import { vendorUsingSuperpowersSkill } from "../common/paths.js";
import { buildAgentConfig } from "./agent-config-builder.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

export type BuildAllProps = {
	agents: ReadonlyArray<AgentFrontmatterLike>;
	sessionDir: string;
};

export type BuildAllResult = {
	configs: ReadonlyArray<AgentConfig>;
	diagnostics: ReadonlyArray<DiscoveryDiagnostic>;
};

export async function buildAllAgentConfigs(props: BuildAllProps): Promise<BuildAllResult> {
	const configs: AgentConfig[] = [];
	const diagnostics: DiscoveryDiagnostic[] = [];

	for (const agent of props.agents) {
		// TODO(task-4): replace this shim with scanVendorSkills() result.
		const built = await buildAgentConfig(agent, {
			sessionDir: props.sessionDir,
			skills: [{ name: "using-superpowers", path: vendorUsingSuperpowersSkill(), description: "" }],
		});
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

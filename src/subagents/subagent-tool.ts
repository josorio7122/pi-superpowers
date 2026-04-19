import type { AgentConfig } from "pi-agents";
import { createAgentTool } from "pi-agents/src/tool/agent-tool.js";

export type BuildToolProps = {
	agents: ReadonlyArray<AgentConfig>;
	modelRegistry: unknown;
	cwd: string;
	sessionDir: string;
	conversationLogPath: string;
};

export type SubagentTool = {
	name: string;
	label: string;
	execute: (...args: never[]) => unknown;
	renderCall: (...args: never[]) => unknown;
	renderResult: (...args: never[]) => unknown;
	[key: string]: unknown;
};

export function buildSuperpowersSubagentTool(props: BuildToolProps): SubagentTool {
	const base = createAgentTool({
		agents: props.agents,
		modelRegistry: props.modelRegistry as never,
		cwd: props.cwd,
		sessionDir: props.sessionDir,
		conversationLogPath: props.conversationLogPath,
	}) as unknown as SubagentTool;
	return { ...base, name: "superpowers_subagent", label: "Subagent" };
}

import type { AgentFrontmatterLike } from "./frontmatter.js";

export type RunConfig = {
	name: string;
	systemPrompt: string;
	task: string;
	tools: string[];
	modelHint: string;
};

const DEFAULT_TOOLS = ["read", "grep", "glob", "bash"];
const PI_COMPAT_NOTE = [
	"",
	"---",
	"",
	"**Pi runtime note:** you are running inside pi. Use pi-native tools (`read`, `write`, `edit`, `bash`, `grep`, `glob`).",
	"This agent is dispatched by pi-superpowers via pi-agents; stay focused on the task and return concise results.",
].join("\n");

export type BuildRunConfigProps = {
	agent: AgentFrontmatterLike;
	task: string;
};

export function buildRunConfig(props: BuildRunConfigProps): RunConfig {
	const { agent, task } = props;
	const systemPrompt = `${agent.body}${PI_COMPAT_NOTE}`;
	const tools = agent.tools && agent.tools.length > 0 ? agent.tools : DEFAULT_TOOLS;
	const modelHint = agent.model ?? "inherit";
	return {
		name: agent.name,
		systemPrompt,
		task,
		tools,
		modelHint,
	};
}

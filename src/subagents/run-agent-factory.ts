import type { PiAgentConfig } from "./agent-config-builder.js";

export type PiAgentsRunAgentParams = {
	agentConfig: PiAgentConfig;
	task: string;
	cwd: string;
	sessionDir: string;
	conversationLogPath: string;
	modelRegistry: unknown;
	signal?: AbortSignal;
	onUpdate?: (metrics: unknown) => void;
};

export type PiAgentsRunAgentResult = {
	output: string;
	metrics: unknown;
	error?: string;
};

export type PiAgentsRunAgent = (params: PiAgentsRunAgentParams) => Promise<PiAgentsRunAgentResult>;

export type RunAgentFn = (params: {
	task: string;
	onMetrics?: (m: unknown) => void;
}) => Promise<PiAgentsRunAgentResult>;

export type MakeRunAgentProps = {
	runAgent: PiAgentsRunAgent;
	agentConfig: PiAgentConfig;
	cwd: string;
	sessionDir: string;
	conversationLogPath: string;
	modelRegistry: unknown;
	signal?: AbortSignal;
};

export function makeRunAgent(props: MakeRunAgentProps): RunAgentFn {
	const { runAgent, agentConfig, cwd, sessionDir, conversationLogPath, modelRegistry, signal } = props;
	return async ({ task, onMetrics }) => {
		return runAgent({
			agentConfig,
			task,
			cwd,
			sessionDir,
			conversationLogPath,
			modelRegistry,
			...(signal ? { signal } : {}),
			...(onMetrics ? { onUpdate: onMetrics } : {}),
		});
	};
}

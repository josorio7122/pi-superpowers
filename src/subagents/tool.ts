import { Value } from "@sinclair/typebox/value";
import { writeMarker } from "../common/markers.js";
import { createTheme } from "../ui/theme.js";
import { buildAgentConfig, type PiAgentConfig } from "./agent-config-builder.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";
import { findAgent } from "./loader.js";
import { type RunResult, renderMultiResult, renderSingleResult } from "./render.js";
import { makeRunAgent, type PiAgentsRunAgent, type RunAgentFn } from "./run-agent-factory.js";
import { detectMode, SubagentInputSchema } from "./schema.js";

export type PiAgentsApi = {
	runAgent: PiAgentsRunAgent;
	executeSingle: (params: {
		task: string;
		runAgent: RunAgentFn;
		onMetrics?: (m: unknown) => void;
	}) => Promise<{ output: string; metrics: unknown; error?: string }>;
	executeParallel: (params: {
		tasks: Array<{ task: string; runAgent: RunAgentFn }>;
		maxConcurrency: number;
		signal?: AbortSignal;
	}) => Promise<Array<{ output: string; metrics: unknown; error?: string }>>;
	executeChain: (params: {
		tasks: Array<{ task: string; runAgent: RunAgentFn }>;
		signal?: AbortSignal;
	}) => Promise<Array<{ output: string; metrics: unknown; error?: string }>>;
};

export type SubagentToolCtx = {
	ui: { colorEnabled?: boolean; width?: number };
	cwd: string;
	sessionDir: string;
	modelRegistry: unknown;
	signal?: AbortSignal;
};

export type SubagentToolResult = {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
};

export type ExecuteSubagentProps = {
	input: unknown;
	agents: AgentFrontmatterLike[];
	ctx: SubagentToolCtx;
	piAgentsApi: PiAgentsApi;
};

function errorResult(message: string): SubagentToolResult {
	return {
		content: [{ type: "text", text: message }],
		details: { error: message, mode: "error" },
	};
}

function conversationLogPath(sessionDir: string, agentName: string): string {
	return `${sessionDir}/superpowers/${agentName}-dispatch.jsonl`;
}

function normalizeToolCalls(raw: unknown): number | undefined {
	if (Array.isArray(raw)) return raw.length;
	if (typeof raw === "number") return raw;
	return undefined;
}

function adaptMetrics(raw: unknown): RunResult["metrics"] {
	const m = (raw ?? {}) as Record<string, unknown>;
	const usd = typeof m.cost === "number" ? m.cost : undefined;
	const toolCalls = normalizeToolCalls(m.toolCalls);
	return {
		inTok: Number(m.inputTokens ?? 0),
		outTok: Number(m.outputTokens ?? 0),
		durationMs: Number(m.durationMs ?? 0),
		...(usd !== undefined ? { usd } : {}),
		...(toolCalls !== undefined ? { toolCalls } : {}),
	};
}

function toRunResult(name: string, raw: { output: string; metrics: unknown; error?: string }): RunResult {
	return {
		name,
		text: raw.output,
		metrics: adaptMetrics(raw.metrics),
		...(raw.error ? { error: raw.error } : {}),
	};
}

type RunnerProps = {
	agent: AgentFrontmatterLike;
	ctx: SubagentToolCtx;
	api: PiAgentsApi;
};

async function runnerFor(params: RunnerProps): Promise<RunAgentFn> {
	const agentConfig: PiAgentConfig = await buildAgentConfig(params.agent, {
		sessionDir: params.ctx.sessionDir,
	});
	return makeRunAgent({
		runAgent: params.api.runAgent,
		agentConfig,
		cwd: params.ctx.cwd,
		sessionDir: params.ctx.sessionDir,
		conversationLogPath: conversationLogPath(params.ctx.sessionDir, params.agent.name),
		modelRegistry: params.ctx.modelRegistry,
		...(params.ctx.signal ? { signal: params.ctx.signal } : {}),
	});
}

async function handleSingle(
	input: { agent: string; task: string },
	props: ExecuteSubagentProps,
): Promise<SubagentToolResult> {
	const { agents, ctx, piAgentsApi } = props;
	const theme = createTheme({ color: ctx.ui.colorEnabled !== false });
	const width = ctx.ui.width ?? 80;
	const agent = findAgent(agents, input.agent);
	if (!agent)
		return errorResult(`Unknown agent: "${input.agent}". Available: ${agents.map((a) => a.name).join(", ")}.`);
	try {
		const runner = await runnerFor({ agent, ctx, api: piAgentsApi });
		const raw = await piAgentsApi.executeSingle({ task: input.task, runAgent: runner });
		const result = toRunResult(agent.name, raw);
		const primaryArg = `${agent.name}: "${input.task}"`;
		return {
			content: [{ type: "text", text: renderSingleResult({ result, primaryArg, width, theme }).join("\n") }],
			details: { mode: "single", agent: input.agent, metrics: result.metrics, error: result.error ?? null },
		};
	} catch (err) {
		return errorResult(`Subagent dispatch failed: ${(err as Error).message}`);
	}
}

type HandleMultiParams = {
	mode: "parallel" | "chain";
	tasks: Array<{ agent: string; task: string }>;
	props: ExecuteSubagentProps;
};

async function handleMulti(params: HandleMultiParams): Promise<SubagentToolResult> {
	const { mode, tasks, props } = params;
	const { agents, ctx, piAgentsApi } = props;
	const theme = createTheme({ color: ctx.ui.colorEnabled !== false });
	const width = ctx.ui.width ?? 80;
	const missing = tasks.filter((t) => !findAgent(agents, t.agent)).map((t) => t.agent);
	if (missing.length > 0) return errorResult(`Unknown agent(s): ${missing.join(", ")}.`);
	try {
		const runners = await Promise.all(
			tasks.map(async (t) => {
				const agent = findAgent(agents, t.agent);
				if (!agent) throw new Error(`Unknown agent: ${t.agent}`);
				return { task: t.task, runAgent: await runnerFor({ agent, ctx, api: piAgentsApi }) };
			}),
		);
		const raws =
			mode === "parallel"
				? await piAgentsApi.executeParallel({
						tasks: runners,
						maxConcurrency: 3,
						...(ctx.signal ? { signal: ctx.signal } : {}),
					})
				: await piAgentsApi.executeChain({
						tasks: runners,
						...(ctx.signal ? { signal: ctx.signal } : {}),
					});
		const results = raws.map((r, i) => toRunResult(tasks[i]?.agent ?? "?", r));
		const primaryArg = mode === "parallel" ? `parallel: ${tasks.length} tasks` : `chain: ${tasks.length} steps`;
		return {
			content: [
				{
					type: "text",
					text: renderMultiResult({ mode, results, planned: tasks.length, primaryArg, width, theme }).join("\n"),
				},
			],
			details: {
				mode,
				results: results.map((r) => ({ name: r.name, metrics: r.metrics, error: r.error ?? null })),
			},
		};
	} catch (err) {
		return errorResult(`${mode} dispatch failed: ${(err as Error).message}`);
	}
}

export async function executeSubagent(props: ExecuteSubagentProps): Promise<SubagentToolResult> {
	const { input } = props;
	if (!Value.Check(SubagentInputSchema, input)) return errorResult("Invalid subagent input.");

	const mode = detectMode(input);
	void writeMarker("subagent-dispatched", { mode });

	if (mode === "single") {
		return handleSingle(input as { agent: string; task: string }, props);
	}
	if (mode === "parallel") {
		return handleMulti({
			mode: "parallel",
			tasks: (input as { tasks: Array<{ agent: string; task: string }> }).tasks,
			props,
		});
	}
	return handleMulti({
		mode: "chain",
		tasks: (input as { chain: Array<{ agent: string; task: string }> }).chain,
		props,
	});
}

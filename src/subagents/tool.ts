import { Value } from "@sinclair/typebox/value";
import { createTheme } from "../ui/theme.js";
import {
	aggregateMetrics,
	dispatchChain,
	dispatchParallel,
	dispatchSingle,
	type RunAgentFn,
	type RunResult,
} from "./dispatch.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";
import { findAgent } from "./loader.js";
import { renderMultiResult, renderSingleResult } from "./render.js";
import { detectMode, SubagentInputSchema } from "./schema.js";
import { buildRunConfig } from "./transform.js";

export type SubagentToolCtx = {
	ui: { colorEnabled?: boolean; width?: number };
	signal?: AbortSignal;
};

export type SubagentToolResult = {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
};

function errorResult(message: string): SubagentToolResult {
	return {
		content: [{ type: "text", text: message }],
		details: { error: message },
	};
}

export type ExecuteSubagentProps = {
	input: unknown;
	agents: AgentFrontmatterLike[];
	runAgent: RunAgentFn;
	ctx: SubagentToolCtx;
};

export async function executeSubagent(props: ExecuteSubagentProps): Promise<SubagentToolResult> {
	const { input, agents, runAgent, ctx } = props;
	if (!Value.Check(SubagentInputSchema, input)) return errorResult("Invalid subagent input.");

	const mode = detectMode(input);
	const theme = createTheme({ color: ctx.ui.colorEnabled !== false });
	const width = ctx.ui.width ?? 80;

	const single = (agentName: string, task: string) => {
		const agent = findAgent(agents, agentName);
		if (!agent) return null;
		return buildRunConfig({ agent, task });
	};

	if (mode === "single") {
		const obj = input as { agent: string; task: string };
		const cfg = single(obj.agent, obj.task);
		if (!cfg) return errorResult(`Unknown agent: "${obj.agent}". Available: ${agents.map((a) => a.name).join(", ")}.`);
		const result = await dispatchSingle({ runAgent, config: cfg, ...(ctx.signal ? { signal: ctx.signal } : {}) });
		return {
			content: [{ type: "text", text: renderSingleResult({ result, width, theme }).join("\n") }],
			details: {
				mode,
				agent: obj.agent,
				metrics: result.metrics,
				cancelled: result.cancelled ?? false,
				error: result.error,
			},
		};
	}

	if (mode === "parallel") {
		const obj = input as { tasks: Array<{ agent: string; task: string }> };
		const configs = obj.tasks.map((t) => single(t.agent, t.task));
		const missing = obj.tasks.filter((_, i) => configs[i] === null).map((t) => t.agent);
		if (missing.length > 0) return errorResult(`Unknown agent(s): ${missing.join(", ")}.`);
		const results = await dispatchParallel({
			runAgent,
			configs: configs.filter((c): c is NonNullable<typeof c> => c !== null),
			...(ctx.signal ? { signal: ctx.signal } : {}),
		});
		return {
			content: [
				{
					type: "text",
					text: renderMultiResult({ mode, results, planned: obj.tasks.length, width, theme }).join("\n"),
				},
			],
			details: { mode, results: results.map(serializeResult), total: aggregateMetrics(results) },
		};
	}

	const obj = input as { chain: Array<{ agent: string; task: string }> };
	const configs = obj.chain.map((t) => single(t.agent, t.task));
	const missing = obj.chain.filter((_, i) => configs[i] === null).map((t) => t.agent);
	if (missing.length > 0) return errorResult(`Unknown agent(s): ${missing.join(", ")}.`);
	const results = await dispatchChain({
		runAgent,
		configs: configs.filter((c): c is NonNullable<typeof c> => c !== null),
		...(ctx.signal ? { signal: ctx.signal } : {}),
	});
	return {
		content: [
			{
				type: "text",
				text: renderMultiResult({ mode: "chain", results, planned: obj.chain.length, width, theme }).join("\n"),
			},
		],
		details: { mode, results: results.map(serializeResult), total: aggregateMetrics(results) },
	};
}

function serializeResult(r: RunResult): Record<string, unknown> {
	return {
		name: r.name,
		metrics: r.metrics,
		cancelled: r.cancelled ?? false,
		error: r.error ?? null,
	};
}

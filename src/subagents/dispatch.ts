import type { RunConfig } from "./transform.js";

export type RunMetrics = {
	inTok: number;
	outTok: number;
	durationMs: number;
	usd?: number;
	toolCalls?: number;
};

export type RunResult = {
	name: string;
	text: string;
	metrics: RunMetrics;
	cancelled?: boolean;
	error?: string;
};

// Injected runAgent dependency — shape matches pi-agents' runAgent minimally.
export type RunAgentFn = (props: {
	config: RunConfig;
	signal?: AbortSignal;
	onUpdate?: (partial: { text?: string; metrics?: Partial<RunMetrics> }) => void;
}) => Promise<{ text: string; metrics: RunMetrics }>;

type SafeRunProps = {
	runAgent: RunAgentFn;
	config: RunConfig;
	signal?: AbortSignal;
};

async function safeRun(props: SafeRunProps): Promise<RunResult> {
	const { runAgent, config, signal } = props;
	try {
		const out = await runAgent({ config, ...(signal ? { signal } : {}) });
		return { name: config.name, text: out.text, metrics: out.metrics };
	} catch (err) {
		const e = err as Error;
		const cancelled = e.name === "AbortError" || signal?.aborted === true;
		const base: RunResult = {
			name: config.name,
			text: cancelled ? "" : e.message,
			metrics: { inTok: 0, outTok: 0, durationMs: 0 },
			error: e.message,
		};
		if (cancelled) return { ...base, cancelled: true };
		return base;
	}
}

export type DispatchSingleProps = {
	runAgent: RunAgentFn;
	config: RunConfig;
	signal?: AbortSignal;
};

export async function dispatchSingle(props: DispatchSingleProps): Promise<RunResult> {
	return safeRun({ runAgent: props.runAgent, config: props.config, ...(props.signal ? { signal: props.signal } : {}) });
}

export type DispatchParallelProps = {
	runAgent: RunAgentFn;
	configs: RunConfig[];
	signal?: AbortSignal;
};

export async function dispatchParallel(props: DispatchParallelProps): Promise<RunResult[]> {
	return Promise.all(
		props.configs.map((cfg) =>
			safeRun({ runAgent: props.runAgent, config: cfg, ...(props.signal ? { signal: props.signal } : {}) }),
		),
	);
}

export type DispatchChainProps = {
	runAgent: RunAgentFn;
	configs: RunConfig[];
	signal?: AbortSignal;
};

export async function dispatchChain(props: DispatchChainProps): Promise<RunResult[]> {
	const results: RunResult[] = [];
	let previous = "";
	for (const cfg of props.configs) {
		const withPrev: RunConfig = {
			...cfg,
			task: cfg.task.includes("{previous}") ? cfg.task.replace(/\{previous\}/g, previous) : cfg.task,
		};
		const result = await safeRun({
			runAgent: props.runAgent,
			config: withPrev,
			...(props.signal ? { signal: props.signal } : {}),
		});
		results.push(result);
		if (result.error || result.cancelled) break;
		previous = result.text;
	}
	return results;
}

export function aggregateMetrics(results: RunResult[]): RunMetrics {
	const acc: RunMetrics = { inTok: 0, outTok: 0, durationMs: 0, usd: 0, toolCalls: 0 };
	for (const r of results) {
		acc.inTok += r.metrics.inTok;
		acc.outTok += r.metrics.outTok;
		acc.durationMs = Math.max(acc.durationMs, r.metrics.durationMs);
		if (r.metrics.usd) acc.usd = (acc.usd ?? 0) + r.metrics.usd;
		if (r.metrics.toolCalls) acc.toolCalls = (acc.toolCalls ?? 0) + r.metrics.toolCalls;
	}
	return acc;
}

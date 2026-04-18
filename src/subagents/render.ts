import { spinnerFrame } from "../ui/progress.js";
import type { Theme } from "../ui/theme.js";
import { branch, bullet, indent } from "../ui/tree.js";
import type { SubagentMode } from "./schema.js";

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

export type CallHeaderProps = {
	mode: SubagentMode;
	primaryArg: string;
	theme: Theme;
	width?: number;
};

export function renderSubagentCallHeader(props: CallHeaderProps): string {
	const label = `superpowers_subagent(${props.theme.dim(props.primaryArg)})`;
	return bullet({ label, theme: props.theme, ...(props.width !== undefined ? { width: props.width } : {}) });
}

function formatMetricsLine(m: RunMetrics, theme: Theme): string {
	const parts = [`${(m.durationMs / 1000).toFixed(1)}s`];
	if (m.inTok || m.outTok) parts.push(`${m.inTok.toLocaleString()} in / ${m.outTok.toLocaleString()} out`);
	if (typeof m.toolCalls === "number") parts.push(`${m.toolCalls} tools`);
	if (typeof m.usd === "number") parts.push(`$${m.usd.toFixed(3)}`);
	return theme.dim(parts.join(" · "));
}

export type RenderSingleProps = {
	result: RunResult;
	primaryArg: string;
	theme: Theme;
	width: number;
	running?: boolean;
	spinnerTick?: number;
};

export function renderSingleResult(props: RenderSingleProps): string[] {
	const { result, primaryArg, theme, width, running, spinnerTick } = props;
	const header = renderSubagentCallHeader({ mode: "single", primaryArg, theme, width });

	if (running) {
		const spin = theme.accent(spinnerFrame(spinnerTick ?? 0, { color: theme.color }));
		const tok = result.metrics.inTok + result.metrics.outTok;
		const text = `${spin} running · ${(result.metrics.durationMs / 1000).toFixed(1)}s · ${tok} tok`;
		return [header, branch({ text: theme.dim(text), theme, width })];
	}

	if (result.cancelled) {
		return [header, branch({ text: `${theme.warn("⏸")} cancelled`, theme, width })];
	}

	if (result.error) {
		return [header, branch({ text: `${theme.error("✗")} error: ${result.error}`, theme, width })];
	}

	const doneLine = branch({
		text: `${theme.success("✓")} done · ${formatMetricsLine(result.metrics, theme)}`,
		theme,
		width,
	});
	const body = result.text ? indent(result.text, 5).split("\n") : [];
	return [header, doneLine, ...body];
}

export type RenderMultiProps = {
	mode: "parallel";
	results: RunResult[];
	planned: number;
	primaryArg: string;
	theme: Theme;
	width: number;
};

function computeNameWidth(results: RunResult[], planned: number): number {
	const nameLengths = results.map((r) => r.name.length);
	const queued = planned - results.length;
	const placeholderLengths = Array.from({ length: queued }, () => 10);
	return Math.min(18, Math.max(0, ...nameLengths, ...placeholderLengths));
}

export function renderMultiResult(props: RenderMultiProps): string[] {
	const { mode, results, planned, primaryArg, theme, width } = props;
	const header = renderSubagentCallHeader({ mode, primaryArg, theme, width });
	const rows: string[] = [];
	const nameWidth = computeNameWidth(results, planned);

	for (let i = 0; i < planned; i++) {
		const r = results[i];
		if (!r) {
			const queued = `${theme.dim("☐")} ${"agent".padEnd(nameWidth)} · queued`;
			rows.push(branch({ text: theme.dim(queued), theme, width }));
			continue;
		}
		if (r.cancelled) {
			rows.push(branch({ text: `${theme.warn("⏸")} ${r.name.padEnd(nameWidth)} · cancelled`, theme, width }));
			continue;
		}
		if (r.error) {
			rows.push(branch({ text: `${theme.error("✗")} ${r.name.padEnd(nameWidth)} · ${r.error}`, theme, width }));
			continue;
		}
		rows.push(
			branch({
				text: `${theme.success("✓")} ${r.name.padEnd(nameWidth)} · ${formatMetricsLine(r.metrics, theme)}`,
				theme,
				width,
			}),
		);
	}

	// Total line — only when at least one result completed
	if (results.some((r) => !r.error && !r.cancelled)) {
		const total = results.reduce(
			(a, r) => ({
				inTok: a.inTok + r.metrics.inTok,
				outTok: a.outTok + r.metrics.outTok,
				durationMs: Math.max(a.durationMs, r.metrics.durationMs),
				usd: (a.usd ?? 0) + (r.metrics.usd ?? 0),
				toolCalls: (a.toolCalls ?? 0) + (r.metrics.toolCalls ?? 0),
			}),
			{ inTok: 0, outTok: 0, durationMs: 0, usd: 0, toolCalls: 0 },
		);
		rows.push(branch({ text: `total · ${formatMetricsLine(total, theme)}`, theme, width }));
	}

	return [header, ...rows];
}

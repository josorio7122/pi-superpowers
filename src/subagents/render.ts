import { panel } from "../ui/box.js";
import { spinnerFrame } from "../ui/progress.js";
import type { Theme } from "../ui/theme.js";
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
	agentLabel: string;
	durationMs?: number;
	tokensSoFar?: number;
	spinnerTick?: number;
	theme: Theme;
};

export function renderSubagentCallHeader(props: CallHeaderProps): string {
	const { mode, agentLabel, durationMs, tokensSoFar, spinnerTick, theme } = props;
	const spin = typeof spinnerTick === "number" ? `${spinnerFrame(spinnerTick, { color: theme.color })} ` : "";
	const dur = typeof durationMs === "number" ? `${(durationMs / 1000).toFixed(1)}s` : "";
	const tok = typeof tokensSoFar === "number" ? `${tokensSoFar.toLocaleString()} tok` : "";
	const suffix = [spin + dur, tok].filter(Boolean).join(" · ");
	return `${theme.icon("agent")} ${agentLabel} · ${mode}${suffix ? ` · ${suffix}` : ""}`;
}

function formatMetrics(m: RunMetrics): string {
	const parts = [
		`${(m.durationMs / 1000).toFixed(1)}s`,
		`${m.inTok.toLocaleString()} in / ${m.outTok.toLocaleString()} out`,
	];
	if (typeof m.toolCalls === "number") parts.push(`${m.toolCalls} tools`);
	if (typeof m.usd === "number") parts.push(`$${m.usd.toFixed(3)}`);
	return parts.join(" · ");
}

function stateBadge(result: RunResult, theme: Theme): string {
	if (result.cancelled) return theme.icon("paused");
	if (result.error) return theme.icon("err");
	return theme.icon("ok");
}

function resultGlyph(result: RunResult | undefined, theme: Theme): string {
	if (!result) return theme.icon("pending");
	if (result.cancelled) return theme.icon("paused");
	if (result.error) return theme.icon("err");
	return theme.icon("done");
}

export type RenderSingleProps = {
	result: RunResult;
	width: number;
	theme: Theme;
};

export function renderSingleResult(props: RenderSingleProps): string[] {
	const { result, width, theme } = props;
	const body = (result.text || (result.error ?? "")).split("\n");
	const rows = [...body, "", formatMetrics(result.metrics)];
	return panel({
		title: result.name,
		icon: theme.icon("agent"),
		badge: stateBadge(result, theme),
		width,
		rows,
		theme,
	});
}

export type RenderMultiProps = {
	mode: "parallel" | "chain";
	results: RunResult[];
	planned: number;
	width: number;
	theme: Theme;
};

export function renderMultiResult(props: RenderMultiProps): string[] {
	const { mode, results, planned, width, theme } = props;
	const done = results.filter((r) => !r.cancelled && !r.error).length;
	const rows = Array.from({ length: planned }, (_, i) => {
		const r = results[i];
		const glyph = resultGlyph(r, theme);
		if (!r) return `${glyph}     queued`;
		let summary: string;
		if (r.cancelled) summary = "cancelled";
		else if (r.error) summary = r.error;
		else summary = formatMetrics(r.metrics);
		return `${glyph} ${r.name.padEnd(18)} ${summary}`;
	});
	const totalMetrics = results.reduce(
		(a, r) => ({
			inTok: a.inTok + r.metrics.inTok,
			outTok: a.outTok + r.metrics.outTok,
			durationMs: Math.max(a.durationMs, r.metrics.durationMs),
			usd: (a.usd ?? 0) + (r.metrics.usd ?? 0),
			toolCalls: (a.toolCalls ?? 0) + (r.metrics.toolCalls ?? 0),
		}),
		{ inTok: 0, outTok: 0, durationMs: 0, usd: 0, toolCalls: 0 },
	);
	const footer = formatMetrics(totalMetrics);
	return panel({
		title: `${mode} (${planned})`,
		icon: theme.icon("agent"),
		badge: `${done}/${planned}`,
		width,
		rows: [...rows, "", footer],
		theme,
	});
}

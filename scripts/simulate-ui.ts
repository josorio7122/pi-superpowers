/**
 * Simulates pi-superpowers TUI rendering with ANSI colors and streaming updates.
 * Usage: npx tsx scripts/simulate-ui.ts [todos|subagent-single|subagent-parallel|widget|all]
 * Default: all
 */
import { clearAndPrint, randomMetrics, sleep, theme as bannerTheme } from "./simulate-helpers.js";
import { renderTodosError, renderTodosResult } from "../src/todos/render.js";
import type { TodoItem } from "../src/todos/schema.js";
import { renderMultiResult, renderSingleResult, type RunResult } from "../src/subagents/render.js";
import { renderTodosWidget } from "../src/ui/compact-todo.js";
import { createTheme } from "../src/ui/theme.js";

const theme = createTheme({ color: true });
const WIDTH = process.stdout.columns || 100;

function banner(text: string): void {
	console.log(bannerTheme.fg("accent", `\n━━━ ${text} ━━━\n`));
}

function printState(lines: string, prev: { value: number }): void {
	prev.value = clearAndPrint(lines.split("\n"), prev.value);
}

async function simulateTodos() {
	banner("TODOS");
	let items: TodoItem[] = [];
	const lc = { value: 0 };
	const render = (action: string) => {
		const panel = renderTodosResult({ items, action, theme, width: WIDTH }).join("\n");
		const widget = renderTodosWidget({ items, theme, width: WIDTH });
		const widgetSection = widget.length > 0 ? ["", bannerTheme.fg("dim", "WIDGET:"), ...widget].join("\n") : "";
		return panel + widgetSection;
	};

	// t=0: empty state
	printState(render("list"), lc);
	await sleep(1000);

	// add alpha
	items = [{ id: "1", content: "alpha — first task", status: "pending" }];
	printState(render("add"), lc);
	await sleep(1000);

	// add beta
	items = [...items, { id: "2", content: "beta — second task", status: "pending" }];
	printState(render("add"), lc);
	await sleep(1000);

	// add high-priority review
	items = [...items, { id: "3", content: "review with Jesse", status: "pending", priority: "high" }];
	printState(render("add"), lc);
	await sleep(1200);

	// complete alpha
	items = items.map((i) => (i.id === "1" ? { ...i, status: "completed" as const } : i));
	printState(render("complete"), lc);
	await sleep(1000);

	// update beta to in_progress
	items = items.map((i) => (i.id === "2" ? { ...i, status: "in_progress" as const } : i));
	printState(render("update"), lc);
	await sleep(1800);

	// complete beta
	items = items.map((i) => (i.id === "2" ? { ...i, status: "completed" as const } : i));
	printState(render("complete"), lc);
	await sleep(1500);

	// error case — print error inline (not replacing prior frame) then clear
	const errorLines = renderTodosError({
		action: "complete",
		message: "no prior todos in session — use 'add' or 'replace' first",
		theme,
		width: WIDTH,
	});
	console.log(`\n${errorLines.join("\n")}`);
	await sleep(1500);

	// clear
	items = [];
	lc.value = 0;
	console.log(`\n${render("clear")}`);
	await sleep(500);
}

async function simulateSubagentSingle() {
	banner("SUBAGENT · SINGLE");
	const lc = { value: 0 };
	const primaryArg = 'code-reviewer: "review step 2"';
	let tick = 0;
	let running = true;
	let result: RunResult = { name: "code-reviewer", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 0 } };

	// Running animation — spinner + climbing metrics
	for (let elapsed = 0; elapsed < 5; elapsed++) {
		const m = randomMetrics(elapsed + 1, (elapsed + 1) * 0.6);
		result.metrics = {
			inTok: m.inputTokens,
			outTok: m.outputTokens,
			durationMs: (elapsed + 1) * 800,
		};
		tick = (tick + 1) % 8;
		const frame = renderSingleResult({
			result,
			primaryArg,
			theme,
			width: WIDTH,
			running,
			spinnerTick: tick,
		}).join("\n");
		printState(frame, lc);
		await sleep(600);
	}

	// Final frame — done
	running = false;
	const finalMetrics = randomMetrics(5, 4);
	result = {
		name: "code-reviewer",
		text: "Changes look good. One nit: consider extracting the loop into a helper for clarity.",
		metrics: {
			inTok: finalMetrics.inputTokens,
			outTok: finalMetrics.outputTokens,
			durationMs: 4200,
			usd: 0.018,
			toolCalls: 4,
		},
	};
	printState(
		renderSingleResult({ result, primaryArg, theme, width: WIDTH }).join("\n"),
		lc,
	);
	await sleep(1500);
}

async function simulateSubagentParallel() {
	banner("SUBAGENT · PARALLEL");
	const lc = { value: 0 };
	const primaryArg = "parallel: 3 tasks";
	const names = ["reviewer-backend", "reviewer-frontend", "reviewer-tests"];
	let results: RunResult[] = [];

	const render = () =>
		renderMultiResult({ mode: "parallel", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n");

	// all 3 queued
	printState(render(), lc);
	await sleep(800);

	// all 3 running, climbing
	for (let t = 0; t < 4; t++) {
		results = names.map((name, i) => {
			const m = randomMetrics(i + t + 1, (i + t) * 0.5);
			return {
				name,
				text: "",
				metrics: { inTok: m.inputTokens, outTok: m.outputTokens, durationMs: (t + 1) * 600 },
			} as RunResult;
		});
		// For multi-result rendering we don't have a "running" flag per row in the current API —
		// rows with no final metrics just render as done. For demo purposes we simulate progression
		// by not pushing results yet in this phase. Alternative: render fewer results.
		printState(render(), lc);
		await sleep(500);
	}

	// task 0 done
	const m0 = randomMetrics(4, 2.5);
	results = [
		{ name: names[0] ?? "r0", text: "", metrics: { inTok: m0.inputTokens, outTok: m0.outputTokens, durationMs: 2500, usd: 0.014, toolCalls: 2 } },
	];
	printState(render(), lc);
	await sleep(700);

	// task 1 done
	const m1 = randomMetrics(3, 2);
	results = [
		...results,
		{ name: names[1] ?? "r1", text: "", metrics: { inTok: m1.inputTokens, outTok: m1.outputTokens, durationMs: 2000, usd: 0.012, toolCalls: 1 } },
	];
	printState(render(), lc);
	await sleep(700);

	// task 2 done
	const m2 = randomMetrics(5, 3);
	results = [
		...results,
		{ name: names[2] ?? "r2", text: "", metrics: { inTok: m2.inputTokens, outTok: m2.outputTokens, durationMs: 3000, usd: 0.02, toolCalls: 3 } },
	];
	printState(render(), lc);
	await sleep(1500);
}

async function simulateWidget() {
	banner("WIDGET (standalone)");
	const lc = { value: 0 };
	let items: TodoItem[] = [];
	const render = () => {
		const out = renderTodosWidget({ items, theme, width: WIDTH });
		return out.length > 0 ? out.join("\n") : "(widget cleared)";
	};

	printState(render(), lc);
	await sleep(600);

	items = [
		{ id: "1", content: "alpha", status: "pending" },
		{ id: "2", content: "beta", status: "pending" },
		{ id: "3", content: "review with Jesse", status: "pending", priority: "high" },
	];
	printState(render(), lc);
	await sleep(800);

	items = items.map((i) => (i.id === "1" ? { ...i, status: "in_progress" as const } : i));
	printState(render(), lc);
	await sleep(800);

	items = items.map((i) => {
		if (i.id === "1") return { ...i, status: "completed" as const };
		if (i.id === "2") return { ...i, status: "in_progress" as const };
		return i;
	});
	printState(render(), lc);
	await sleep(1500);
}

async function main() {
	const mode = process.argv[2] ?? "all";
	if (mode === "todos" || mode === "all") await simulateTodos();
	if (mode === "subagent-single" || mode === "all") await simulateSubagentSingle();
	if (mode === "subagent-parallel" || mode === "all") await simulateSubagentParallel();
	if (mode === "widget" || mode === "all") await simulateWidget();
	console.log("\n");
}

void main();

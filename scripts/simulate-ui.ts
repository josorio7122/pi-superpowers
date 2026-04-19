/**
 * Simulates pi-superpowers TUI rendering with ANSI colors and streaming updates.
 * Usage: npx tsx scripts/simulate-ui.ts [todos|widget|all]
 * Default: all
 */
import { clearAndPrint, sleep, theme as bannerTheme } from "./simulate-helpers.js";
import { renderTodosError, renderTodosResult } from "../src/todos/render.js";
import type { TodoItem } from "../src/todos/schema.js";
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
	if (mode === "widget" || mode === "all") await simulateWidget();
	console.log("\n");
}

void main();

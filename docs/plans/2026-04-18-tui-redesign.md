# pi-superpowers v5.2 — TUI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or superpowers:subagent-driven-development.

**Goal:** Replace heavy-box TUI with CC-inspired tree/bullet style for `superpowers_todo`, `superpowers_subagent`, and the todos widget (now always-visible multi-line). Add pi-agents-style animated simulator. Ship as `v5.2.0`.

**Architecture:** Introduce `src/ui/tree.ts` primitive module. Rewrite `src/todos/render.ts`, `src/ui/compact-todo.ts`, `src/subagents/render.ts` atop it. Replace glyphs in `icons.ts`. Add `scripts/simulate-ui.ts` mirroring pi-agents' animated preview.

**Tech Stack:** TypeScript (ES2022 strict) · biome · vitest · tsx (new devDep) · chalk · existing pi-superpowers conventions.

**Reference spec:** `docs/specs/2026-04-18-tui-redesign-design.md`

---

## File Map

**New:**
- `src/ui/tree.ts` — `bullet()`, `branch()`, `indent()`, `checkbox()`, `priorityMark()`
- `src/ui/tree.test.ts`
- `scripts/simulate-ui.ts` — subcommand animated simulator
- `scripts/simulate-helpers.ts` — theme, animatedWait, clearAndPrint, sleep, randomMetrics (ported from pi-agents)

**Rewritten:**
- `src/ui/icons.ts` — swap glyph values, add `bullet`/`branch`, remove unused
- `src/todos/render.ts` + `.test.ts`
- `src/ui/compact-todo.ts` + `.test.ts` (returns `string[]` now, not `string`)
- `src/subagents/render.ts` + `.test.ts`

**Audited / pruned:**
- `src/ui/box.ts` — remove orphan exports (likely `divider`, `badge`), keep `panel()` because `/todos` picker uses it
- `src/api.ts` — remove deleted exports
- `src/ui/icons.ts` test + `src/ui/theme.test.ts` — update expected values

**Ancillary:**
- `package.json` — bump to `5.2.0`, add `tsx` devDep, add `simulate-ui` script
- `README.md` — new "Previewing the TUI" subsection

---

## Task 1: `src/ui/tree.ts` primitives + tests

**Files:**
- Create: `src/ui/tree.ts`
- Create: `src/ui/tree.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/ui/tree.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { TodoStatus } from "../todos/schema.js";
import { branch, bullet, checkbox, indent, priorityMark } from "./tree.js";
import { createTheme } from "./theme.js";

const theme = createTheme({ color: false });

describe("bullet", () => {
	it("renders `● <label>` with primary color applied", () => {
		expect(bullet({ label: "superpowers_todo(add)", theme })).toBe("● superpowers_todo(add)");
	});

	it("truncates label to provided width (including bullet + space)", () => {
		const out = bullet({ label: "x".repeat(200), theme, width: 10 });
		expect(out.length).toBeLessThanOrEqual(10);
		expect(out.startsWith("● ")).toBe(true);
	});
});

describe("branch", () => {
	it("renders `  ⎿  <text>` with default indent=2", () => {
		expect(branch({ text: "hello", theme })).toBe("  ⎿  hello");
	});

	it("supports custom indent (e.g. 0 for flush-left branches)", () => {
		expect(branch({ text: "hi", theme, indent: 0 })).toBe("⎿  hi");
	});

	it("truncates text to width budget", () => {
		const out = branch({ text: "y".repeat(200), theme, width: 20 });
		expect(out.length).toBeLessThanOrEqual(20);
	});
});

describe("indent", () => {
	it("prefixes each line of multiline input with N spaces", () => {
		expect(indent("a\nb\nc", 3)).toBe("   a\n   b\n   c");
	});

	it("preserves empty lines (still indented)", () => {
		expect(indent("a\n\nb", 2)).toBe("  a\n  \n  b");
	});
});

describe("checkbox", () => {
	it("returns pending glyph for pending", () => {
		expect(checkbox("pending" as TodoStatus, { theme })).toBe("☐");
	});

	it("returns in-progress glyph for in_progress", () => {
		expect(checkbox("in_progress" as TodoStatus, { theme })).toBe("◐");
	});

	it("returns done glyph for completed", () => {
		expect(checkbox("completed" as TodoStatus, { theme })).toBe("☒");
	});

	it("returns ASCII fallback glyphs when color is off and ascii=true", () => {
		const asciiTheme = createTheme({ color: false });
		expect(checkbox("pending" as TodoStatus, { theme: asciiTheme, ascii: true })).toBe("[ ]");
		expect(checkbox("in_progress" as TodoStatus, { theme: asciiTheme, ascii: true })).toBe("[*]");
		expect(checkbox("completed" as TodoStatus, { theme: asciiTheme, ascii: true })).toBe("[x]");
	});
});

describe("priorityMark", () => {
	it("returns '!' for high priority", () => {
		expect(priorityMark("high", theme)).toBe("!");
	});

	it("returns empty string for medium/low/undefined", () => {
		expect(priorityMark("medium", theme)).toBe("");
		expect(priorityMark("low", theme)).toBe("");
		expect(priorityMark(undefined, theme)).toBe("");
	});
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/josorio/Code/pi-superpowers
npm run test -- src/ui/tree.test.ts
```

Expected: FAIL — "Cannot find module './tree.js'".

- [ ] **Step 3: Implement `src/ui/tree.ts`**

```ts
import type { TodoPriority, TodoStatus } from "../todos/schema.js";
import type { Theme } from "./theme.js";
import { truncateEnd } from "./truncate.js";

// Single source of truth for checkbox glyphs and their ASCII fallbacks. icons.ts
// still exports ICONS for session-start/widget brand; tree.ts owns the checklist
// and tree-shape glyphs.
const CHECKBOX_COLOR = {
	pending: "☐",
	in_progress: "◐",
	completed: "☒",
} as const;

const CHECKBOX_ASCII = {
	pending: "[ ]",
	in_progress: "[*]",
	completed: "[x]",
} as const;

const BULLET_COLOR = "●";
const BULLET_ASCII = "*";
const BRANCH_COLOR = "⎿";
const BRANCH_ASCII = "-";

export type BulletProps = {
	label: string;
	theme: Theme;
	width?: number;
};

export function bullet(props: BulletProps): string {
	const glyph = props.theme.color ? BULLET_COLOR : BULLET_ASCII;
	const coloredGlyph = props.theme.primary(glyph);
	const line = `${coloredGlyph} ${props.label}`;
	if (props.width === undefined) return line;
	return truncateEnd(line, props.width);
}

export type BranchProps = {
	text: string;
	theme: Theme;
	indent?: number;
	width?: number;
};

export function branch(props: BranchProps): string {
	const spaces = " ".repeat(props.indent ?? 2);
	const glyph = props.theme.color ? BRANCH_COLOR : BRANCH_ASCII;
	const coloredGlyph = props.theme.dim(glyph);
	const line = `${spaces}${coloredGlyph}  ${props.text}`;
	if (props.width === undefined) return line;
	return truncateEnd(line, props.width);
}

export function indent(text: string, spaces: number): string {
	const pad = " ".repeat(spaces);
	return text
		.split("\n")
		.map((line) => pad + line)
		.join("\n");
}

export type CheckboxProps = {
	theme: Theme;
	ascii?: boolean;
};

export function checkbox(status: TodoStatus, opts: CheckboxProps): string {
	const useAscii = opts.ascii === true || !opts.theme.color;
	if (useAscii && opts.ascii === true) return CHECKBOX_ASCII[status];
	return CHECKBOX_COLOR[status];
}

export function priorityMark(priority: TodoPriority | undefined, _theme: Theme): string {
	return priority === "high" ? "!" : "";
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npm run lint:fix && npm run check
```

Expected: all green, tree.test.ts has 11+ passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/tree.ts src/ui/tree.test.ts
git commit -m "feat(ui): add tree primitives (bullet, branch, indent, checkbox, priorityMark)"
```

---

## Task 2: Atomic UI rewrite — icons + renderers + tests (one commit)

This task is logically atomic: swap glyph values + rewrite three renderers + update all their tests. Committing halfway leaves the suite red.

**Files:**
- Modify: `src/ui/icons.ts` + `src/ui/icons.ts` (no test file exists currently — `theme.test.ts` covers icons indirectly)
- Modify: `src/ui/theme.test.ts`
- Rewrite: `src/ui/compact-todo.ts` + `src/ui/compact-todo.test.ts`
- Rewrite: `src/todos/render.ts` + `src/todos/render.test.ts`
- Rewrite: `src/subagents/render.ts` + `src/subagents/render.test.ts`

- [ ] **Step 1: Update `src/ui/icons.ts` glyph values + add bullet/branch; keep deletion of unused keys for Task 3**

```ts
// src/ui/icons.ts
// Semantic icon tokens. Every entry has an ASCII fallback.

export const ICONS = {
	brand: "🦸",
	todo: "📝",
	agent: "🤖",
	bullet: "●",
	branch: "⎿",
	pending: "☐",
	inProgress: "◐",
	done: "☒",
	ok: "✓",
	err: "✗",
	warn: "⚠",
	paused: "⏸",
} as const;

export const ASCII_FALLBACK: Record<keyof typeof ICONS, string> = {
	brand: "[SP]",
	todo: "[TODO]",
	agent: "[AGENT]",
	bullet: "*",
	branch: "-",
	pending: "[ ]",
	inProgress: "[*]",
	done: "[x]",
	ok: "OK",
	err: "X",
	warn: "!",
	paused: "||",
};

export const SPINNER_FRAMES = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"] as const;
export const SPINNER_ASCII = ["|", "/", "-", "\\"] as const;
```

- [ ] **Step 2: Update `src/ui/theme.test.ts`**

Only `it("resolves icon glyph based on color mode", ...)` needs updating if it asserts specific values. Inspect first:

```bash
grep -n "pending\|inProgress\|done\|brand" src/ui/theme.test.ts
```

If the test only asserts `t.icon("brand") === ICONS.brand` (indirect ref), it continues to pass. If it hard-codes `[ ]` literal, update to `☐`. For any failure, adjust the assertion to use `ICONS.pending` / `ICONS.inProgress` / `ICONS.done` indirectly.

Run: `npm run test -- src/ui/theme.test.ts` → expect green or minor fix.

- [ ] **Step 3: Rewrite `src/ui/compact-todo.ts`** (now multi-line)

```ts
// src/ui/compact-todo.ts
import type { TodoItem } from "../todos/schema.js";
import { ICONS } from "./icons.js";
import type { Theme } from "./theme.js";
import { checkbox, priorityMark } from "./tree.js";
import { truncateEnd } from "./truncate.js";

export type RenderTodosWidgetProps = {
	items: TodoItem[];
	theme: Theme;
	width: number;
};

/**
 * Always-visible multi-line checklist widget above the editor.
 * Returns an empty array when items is empty (caller clears the widget).
 */
export function renderTodosWidget(props: RenderTodosWidgetProps): string[] {
	const { items, theme, width } = props;
	if (items.length === 0) return [];

	const brand = theme.color ? ICONS.brand : "[SP]";
	const done = items.filter((i) => i.status === "completed").length;
	const headerText = `${brand} Todos · ${done}/${items.length} done`;
	const lines: string[] = [truncateEnd(theme.primary(headerText), width)];

	for (const item of items) {
		const box = theme.color ? checkbox(item.status, { theme }) : checkbox(item.status, { theme, ascii: true });
		const prio = priorityMark(item.priority, theme);
		const prioChunk = prio ? `${theme.warn(prio)} ` : "  ";
		const content = item.status === "completed" ? theme.dim(item.content) : item.content;
		const line = `   ${box}  ${prioChunk}${content}`;
		lines.push(truncateEnd(line, width));
	}

	return lines;
}
```

Keep the old name `renderCompactTodo` removed — it returned a single string; the new export `renderTodosWidget` returns `string[]`. Update all call sites accordingly (see Step 6).

- [ ] **Step 4: Rewrite `src/ui/compact-todo.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { TodoItem } from "../todos/schema.js";
import { renderTodosWidget } from "./compact-todo.js";
import { createTheme } from "./theme.js";

const theme = createTheme({ color: false });

function sample(): TodoItem[] {
	return [
		{ id: "1", content: "write brainstorming doc", status: "completed" },
		{ id: "2", content: "confirm upstream-sync approach", status: "completed" },
		{ id: "3", content: "draft implementation plan", status: "in_progress" },
		{ id: "4", content: "review with Jesse", status: "pending", priority: "high" },
		{ id: "5", content: "publish v5.0.7 tag", status: "pending" },
	];
}

describe("renderTodosWidget", () => {
	it("returns [] for empty items", () => {
		expect(renderTodosWidget({ items: [], theme, width: 80 })).toEqual([]);
	});

	it("renders brand + Todos header with N/M done at top", () => {
		const lines = renderTodosWidget({ items: sample(), theme, width: 80 });
		expect(lines[0]).toContain("[SP]");
		expect(lines[0]).toContain("Todos");
		expect(lines[0]).toContain("2/5 done");
	});

	it("renders one body line per todo, in order", () => {
		const lines = renderTodosWidget({ items: sample(), theme, width: 80 });
		expect(lines).toHaveLength(6); // 1 header + 5 items
		expect(lines[1]).toContain("write brainstorming doc");
		expect(lines[5]).toContain("publish v5.0.7 tag");
	});

	it("renders state glyphs (ASCII) for each status in no-color mode", () => {
		const lines = renderTodosWidget({ items: sample(), theme, width: 80 });
		expect(lines[1]).toContain("[x]");
		expect(lines[3]).toContain("[*]");
		expect(lines[4]).toContain("[ ]");
	});

	it("marks high-priority items with '!'", () => {
		const lines = renderTodosWidget({ items: sample(), theme, width: 80 });
		const prioritied = lines.find((l) => l.includes("review with Jesse"));
		expect(prioritied).toBeDefined();
		if (prioritied) expect(prioritied).toContain("!");
	});

	it("truncates long rows to width", () => {
		const items: TodoItem[] = [{ id: "1", content: "x".repeat(200), status: "pending" }];
		const lines = renderTodosWidget({ items, theme, width: 50 });
		for (const line of lines) expect(line.length).toBeLessThanOrEqual(50);
	});
});
```

- [ ] **Step 5: Rewrite `src/todos/render.ts`**

```ts
import type { TodoItem } from "./schema.js";
import type { Theme } from "../ui/theme.js";
import { branch, bullet, checkbox, indent, priorityMark } from "../ui/tree.js";

export type RenderTodosCallHeaderProps = {
	action: string;
	args: string;
	theme: Theme;
	width?: number;
};

/** One-line `●` header. Args are shown inside `()` dimmed. */
export function renderTodosCallHeader(props: RenderTodosCallHeaderProps): string {
	const label = `superpowers_todo(${props.action}${props.args ? ` ${props.theme.dim(props.args)}` : ""})`;
	return bullet({ label, theme: props.theme, ...(props.width !== undefined ? { width: props.width } : {}) });
}

export type RenderTodosResultProps = {
	items: TodoItem[];
	action: string;
	theme: Theme;
	width: number;
};

/** Tool-result panel: `●` header + `⎿` summary line + indented checklist. */
export function renderTodosResult(props: RenderTodosResultProps): string[] {
	const { items, action, theme, width } = props;
	const header = renderTodosCallHeader({ action, args: "", theme, width });
	if (items.length === 0) {
		return [header, branch({ text: theme.dim("no todos"), theme, width })];
	}
	const done = items.filter((i) => i.status === "completed").length;
	const summary = branch({
		text: `${items.length} todo${items.length === 1 ? "" : "s"} · ${done}/${items.length} done`,
		theme,
		width,
	});
	const rows = items.map((item) => {
		const box = checkbox(item.status, { theme });
		const prio = priorityMark(item.priority, theme);
		const prioChunk = prio ? `${theme.warn(prio)} ` : "  ";
		const content = item.status === "completed" ? theme.dim(item.content) : item.content;
		return indent(`${box}  ${prioChunk}${content}`, 5);
	});
	return [header, summary, ...rows];
}

/** Error result — single `●` header + single `⎿ ✗` line. */
export function renderTodosError(props: { action: string; message: string; theme: Theme; width: number }): string[] {
	const header = renderTodosCallHeader({ action: props.action, args: "", theme: props.theme, width: props.width });
	const errLine = branch({
		text: `${props.theme.error("✗")} error: ${props.message}`,
		theme: props.theme,
		width: props.width,
	});
	return [header, errLine];
}
```

- [ ] **Step 6: Rewrite `src/todos/render.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { TodoItem } from "./schema.js";
import { createTheme } from "../ui/theme.js";
import { renderTodosCallHeader, renderTodosError, renderTodosResult } from "./render.js";

const theme = createTheme({ color: false });

function sample(): TodoItem[] {
	return [
		{ id: "1", content: "write brainstorming doc", status: "completed" },
		{ id: "2", content: "confirm upstream-sync approach", status: "completed" },
		{ id: "3", content: "draft implementation plan", status: "in_progress" },
		{ id: "4", content: "review with Jesse", status: "pending", priority: "high" },
		{ id: "5", content: "publish v5.0.7 tag", status: "pending" },
	];
}

describe("renderTodosCallHeader", () => {
	it("renders `* superpowers_todo(<action>)` (ascii bullet)", () => {
		expect(renderTodosCallHeader({ action: "add", args: "", theme })).toBe("* superpowers_todo(add)");
	});
	it("includes args dimmed when provided", () => {
		const line = renderTodosCallHeader({ action: "add", args: '"review with Jesse"', theme });
		expect(line).toContain("superpowers_todo(add");
		expect(line).toContain('"review with Jesse"');
	});
});

describe("renderTodosResult", () => {
	it("renders header + 'no todos' branch when items is empty", () => {
		const lines = renderTodosResult({ items: [], action: "clear", theme, width: 80 });
		expect(lines).toHaveLength(2);
		expect(lines[0]).toContain("superpowers_todo(clear)");
		expect(lines[1]).toContain("no todos");
	});

	it("renders header + summary + N rows", () => {
		const lines = renderTodosResult({ items: sample(), action: "replace", theme, width: 80 });
		expect(lines).toHaveLength(2 + 5); // header + summary + 5 items
		expect(lines[0]).toContain("superpowers_todo(replace)");
		expect(lines[1]).toContain("5 todos · 2/5 done");
		expect(lines[2]).toContain("[x]");
		expect(lines[2]).toContain("write brainstorming doc");
		expect(lines[4]).toContain("[*]");
		expect(lines[4]).toContain("draft implementation plan");
		expect(lines[5]).toContain("! review with Jesse");
	});

	it("truncates long rows to width", () => {
		const items: TodoItem[] = [{ id: "1", content: "x".repeat(200), status: "pending" }];
		const lines = renderTodosResult({ items, action: "add", theme, width: 40 });
		for (const line of lines) expect(line.length).toBeLessThanOrEqual(40);
	});
});

describe("renderTodosError", () => {
	it("renders header + branch with X marker and message", () => {
		const lines = renderTodosError({
			action: "complete",
			message: "no prior todos in session — use 'add' or 'replace' first",
			theme,
			width: 80,
		});
		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain("X error");
		expect(lines[1]).toContain("no prior todos");
	});
});
```

- [ ] **Step 7: Update `src/todos/tool.ts`** to call the new renderer

Find current calls to `renderTodosPanel` and `renderTodosCallHeader`, replace with `renderTodosResult` and `renderTodosError`:

Locate in `src/todos/tool.ts`:
```ts
const panelRows = renderTodosPanel({ items: todos, theme, width });
```
Replace with:
```ts
const panelRows = renderTodosResult({ items: todos, action: action.action, theme, width });
```

And the error-guard path (from v5.1.2 Task 2) currently constructs a raw text. Update it to use `renderTodosError`:
```ts
// Before:
return {
	content: [{ type: "text", text: `Cannot apply '${action.action}' — ...` }],
	details: { todos: [], action: "error" },
};
// After:
const errorLines = renderTodosError({
	action: action.action,
	message: `no prior todos in session — use 'add' or 'replace' first`,
	theme,
	width,
});
return {
	content: [{ type: "text", text: errorLines.join("\n") }],
	details: { todos: [], action: "error" },
};
```

Also update the widget setting: `setWidget(ctx, { name: "todos", lines: widgetRow ? [widgetRow] : [] })` becomes:
```ts
setWidget(ctx, { name: "todos", lines: renderTodosWidget({ items: todos, theme, width }) });
```

(Import `renderTodosWidget` from `../ui/compact-todo.js`; remove the old `renderCompactTodo` import.)

- [ ] **Step 8: Update the tool's test file if it asserts specific panel shape**

Scan `src/todos/tool.test.ts`:
```bash
grep -n "\[x\]\|\[ \]\|\[⋯\]\|🦸\|📝" src/todos/tool.test.ts
```

Update any hard-coded expected output to new glyphs. Most of `tool.test.ts` asserts `details` shape, which doesn't change.

- [ ] **Step 9: Rewrite `src/subagents/render.ts`**

```ts
import { branch, bullet, indent } from "../ui/tree.js";
import { spinnerFrame } from "../ui/progress.js";
import type { Theme } from "../ui/theme.js";

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

export type SubagentMode = "single" | "parallel" | "chain";

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

	const doneLine = branch({ text: `${theme.success("✓")} done · ${formatMetricsLine(result.metrics, theme)}`, theme, width });
	const body = result.text ? indent(result.text, 5).split("\n") : [];
	return [header, doneLine, ...body];
}

export type RenderMultiProps = {
	mode: "parallel" | "chain";
	results: RunResult[];
	planned: number;
	primaryArg: string;
	theme: Theme;
	width: number;
};

export function renderMultiResult(props: RenderMultiProps): string[] {
	const { mode, results, planned, primaryArg, theme, width } = props;
	const header = renderSubagentCallHeader({ mode, primaryArg, theme, width });
	const rows: string[] = [];

	const nameWidth = Math.min(
		18,
		Math.max(...results.map((r) => r.name.length), ...Array.from({ length: planned - results.length }, () => 10)),
	);

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
		rows.push(branch({ text: `${theme.success("✓")} ${r.name.padEnd(nameWidth)} · ${formatMetricsLine(r.metrics, theme)}`, theme, width }));
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
```

- [ ] **Step 10: Rewrite `src/subagents/render.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { createTheme } from "../ui/theme.js";
import {
	renderMultiResult,
	renderSingleResult,
	renderSubagentCallHeader,
	type RunResult,
} from "./render.js";

const theme = createTheme({ color: false });

function success(name: string, text = "ok"): RunResult {
	return { name, text, metrics: { inTok: 10, outTok: 5, durationMs: 1200, usd: 0.01, toolCalls: 3 } };
}

describe("renderSubagentCallHeader", () => {
	it("renders `* superpowers_subagent(<arg>)`", () => {
		const line = renderSubagentCallHeader({ mode: "single", primaryArg: 'code-reviewer: "review"', theme });
		expect(line).toContain("superpowers_subagent(");
		expect(line).toContain('code-reviewer: "review"');
	});
});

describe("renderSingleResult", () => {
	it("running → `⎿ <spinner> running · ... tok`", () => {
		const running: RunResult = { name: "x", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 800 } };
		const lines = renderSingleResult({
			result: running,
			primaryArg: 'x: "t"',
			theme,
			width: 80,
			running: true,
			spinnerTick: 0,
		});
		expect(lines).toHaveLength(2);
		expect(lines[1].toLowerCase()).toContain("running");
	});

	it("done → `⎿ OK done · ...` + indented body", () => {
		const lines = renderSingleResult({
			result: success("r", "final assistant text"),
			primaryArg: 'r: "t"',
			theme,
			width: 80,
		});
		expect(lines.some((l) => l.includes("OK done"))).toBe(true);
		expect(lines.some((l) => l.includes("final assistant text"))).toBe(true);
	});

	it("error → `⎿ X error: <msg>`", () => {
		const err: RunResult = { name: "x", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 0 }, error: "boom" };
		const lines = renderSingleResult({ result: err, primaryArg: 'x: "t"', theme, width: 80 });
		expect(lines[1]).toContain("X error: boom");
	});

	it("cancelled → `⎿ || cancelled`", () => {
		const c: RunResult = {
			name: "x",
			text: "",
			metrics: { inTok: 0, outTok: 0, durationMs: 0 },
			cancelled: true,
		};
		const lines = renderSingleResult({ result: c, primaryArg: 'x: "t"', theme, width: 80 });
		expect(lines[1].toLowerCase()).toContain("cancelled");
	});
});

describe("renderMultiResult", () => {
	it("parallel with all done renders N result branches + total", () => {
		const results = [success("backend"), success("frontend"), success("tests")];
		const lines = renderMultiResult({
			mode: "parallel",
			results,
			planned: 3,
			primaryArg: "parallel: 3 tasks",
			theme,
			width: 80,
		});
		expect(lines[0]).toContain("parallel: 3 tasks");
		expect(lines.filter((l) => l.includes("OK")).length).toBeGreaterThanOrEqual(3);
		expect(lines.some((l) => l.includes("total ·"))).toBe(true);
	});

	it("partial (some queued) renders queued placeholder", () => {
		const lines = renderMultiResult({
			mode: "parallel",
			results: [success("a")],
			planned: 3,
			primaryArg: "parallel: 3 tasks",
			theme,
			width: 80,
		});
		expect(lines.some((l) => l.toLowerCase().includes("queued"))).toBe(true);
	});

	it("chain renders steps in order", () => {
		const lines = renderMultiResult({
			mode: "chain",
			results: [success("scout"), success("planner")],
			planned: 3,
			primaryArg: "chain: 3 steps",
			theme,
			width: 80,
		});
		expect(lines[0]).toContain("chain: 3 steps");
		expect(lines.some((l) => l.includes("scout"))).toBe(true);
		expect(lines.some((l) => l.includes("planner"))).toBe(true);
	});
});
```

- [ ] **Step 11: Update `src/subagents/tool.ts`** to call new renderer shapes

Find calls to `renderSingleResult` and `renderMultiResult`. Update props to include `primaryArg`:

```ts
// Before:
content: [{ type: "text", text: renderSingleResult({ result, width, theme }).join("\n") }],
// After:
const primaryArg = `${obj.agent}: "${obj.task}"`;
content: [{ type: "text", text: renderSingleResult({ result, primaryArg, theme, width }).join("\n") }],
```

Same for parallel/chain: compute `primaryArg` as `"parallel: N tasks"` or `"chain: N steps"` and pass it in.

- [ ] **Step 12: Run full check**

```bash
npm run lint:fix && npm run check
```

Expected: all tests green. If any test still references old glyphs (`[ ]`, `[x]`, panel frames), fix in place.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor(ui): tree-style rendering across todos + subagents (v5.2 visual redesign)"
```

---

## Task 3: Cleanup audit — remove orphans

**Files:**
- Modify: `src/ui/box.ts`
- Modify: `src/api.ts`
- Modify: `src/ui/icons.ts` (potential)

- [ ] **Step 1: Grep for orphans**

```bash
# box.ts exports
rg -n "\bpanel\b|\bdivider\b|\bbadge\b" src/ --type ts | grep -v "box.ts"

# icons.ts keys
for key in todo agent warn paused; do
  echo "=== $key ==="
  rg -n "icons\.$key|ICONS\.$key|theme\.icon\(\"$key\"\)|theme\.icon\('$key'\)" src/ --type ts | grep -v "icons.ts\|icons.test.ts"
done
```

- [ ] **Step 2: Remove orphan exports from `src/ui/box.ts`**

If `divider` and `badge` have zero callers outside `box.ts`:

```ts
// src/ui/box.ts — keep only panel (used by /todos picker)
import type { Theme } from "./theme.js";
import { truncateEnd, visibleLength } from "./truncate.js";

export type PanelProps = {
	title: string;
	icon?: string;
	badge?: string;
	width: number;
	rows: string[];
	theme: Theme;
};

export function panel(props: PanelProps): string[] {
	// ... (existing implementation unchanged)
}
```

If `divider`/`badge` had callers outside box.ts, fix those callers first (likely updated already in Task 2), then delete.

- [ ] **Step 3: Remove orphan ICONS keys**

For each key with zero callers (likely `todo`, `agent`, `warn`, `paused`), delete from both `ICONS` and `ASCII_FALLBACK` maps. The final `icons.ts`:

```ts
// src/ui/icons.ts
export const ICONS = {
	brand: "🦸",
	bullet: "●",
	branch: "⎿",
	pending: "☐",
	inProgress: "◐",
	done: "☒",
	ok: "✓",
	err: "✗",
} as const;

export const ASCII_FALLBACK: Record<keyof typeof ICONS, string> = {
	brand: "[SP]",
	bullet: "*",
	branch: "-",
	pending: "[ ]",
	inProgress: "[*]",
	done: "[x]",
	ok: "OK",
	err: "X",
};

// SPINNER_FRAMES / SPINNER_ASCII unchanged — used by spinner.
```

- [ ] **Step 4: Update `src/api.ts`**

Remove exports for anything deleted. Grep:

```bash
rg -n "panel|divider|badge|PanelProps|BadgeProps|BadgeKind" src/api.ts
```

Drop the lines for deleted symbols.

- [ ] **Step 5: Run full check**

```bash
npm run check
```

Expected: green.

- [ ] **Step 6: Run pre-commit grep gate**

```bash
rg -n '\[ \]|\[x\]|\[⋯\]|panel\(\{|┌─|┐\s*$' src/ --type ts | grep -v 'todo-picker.ts\|icons.ts\|box.ts\|ASCII_FALLBACK'
```

Expected: zero hits. Any remaining hit is a missed rewrite — fix before commit.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(ui): cleanup audit — remove orphan exports + unused icon tokens"
```

---

## Task 4: `scripts/simulate-helpers.ts` (port from pi-agents)

**Files:**
- Create: `scripts/simulate-helpers.ts`

- [ ] **Step 1: Copy helpers from pi-agents**

```bash
cp /Users/josorio/Code/pi-agents/scripts/simulate-helpers.ts scripts/simulate-helpers.ts
```

- [ ] **Step 2: Adjust imports**

Open `scripts/simulate-helpers.ts` and replace any `../src/` imports referencing pi-agents internals with our own (e.g. any theme helper should use `chalk` directly or our `src/ui/theme.ts`). The helpers in pi-agents are ~93 lines of pure utility; most imports will be `chalk`, `process.stdout`, and built-in `setTimeout`.

If pi-agents' file has this shape:

```ts
import chalk from "chalk";
export const theme = { fg: (role, s) => chalk... };
export function clearAndPrint(frame, prevLineCount) { ... }
export function sleep(ms) { ... }
export async function animatedWait({ ms, getFrame, prevLineCount }) { ... }
export function renderFrame(callArgs, state) { ... }
export function randomMetrics(turns, seconds) { ... }
```

Leave `theme`, `clearAndPrint`, `sleep`, `animatedWait`, `randomMetrics` alone. Delete or rewrite `renderFrame` — pi-agents' `renderFrame` is tightly coupled to their agent result shape. Ours will come from our `src/subagents/render.ts` and `src/todos/render.ts` directly. Replace `renderFrame` with a thin pass-through or delete.

- [ ] **Step 3: Confirm it compiles**

```bash
npx tsx --check scripts/simulate-helpers.ts
```

Expected: no errors (tsx will type-check).

- [ ] **Step 4: Commit**

```bash
git add scripts/simulate-helpers.ts
git commit -m "feat(scripts): port simulate-helpers from pi-agents"
```

---

## Task 5: `scripts/simulate-ui.ts` — animated simulator

**Files:**
- Create: `scripts/simulate-ui.ts`

- [ ] **Step 1: Write the simulator**

```ts
/**
 * Simulates pi-superpowers TUI rendering with ANSI colors and streaming updates.
 * Usage: npx tsx scripts/simulate-ui.ts [todos|subagent-single|subagent-parallel|subagent-chain|widget|all]
 * Default: all
 */
import { animatedWait, clearAndPrint, randomMetrics, sleep, theme as themeHelpers } from "./simulate-helpers.js";
import { renderTodosResult, renderTodosError } from "../src/todos/render.js";
import { renderTodosWidget } from "../src/ui/compact-todo.js";
import { renderMultiResult, renderSingleResult, type RunResult } from "../src/subagents/render.js";
import type { TodoItem } from "../src/todos/schema.js";
import { createTheme } from "../src/ui/theme.js";

const theme = createTheme({ color: true });
const WIDTH = process.stdout.columns || 100;

function banner(text: string): void {
	console.log(themeHelpers.fg("accent", `\n━━━ ${text} ━━━\n`));
}

async function simulateTodos() {
	banner("TODOS");
	let items: TodoItem[] = [];
	const lc = { value: 0 };
	const printState = (action: string) => {
		const panel = items.length === 0 ? renderTodosResult({ items, action, theme, width: WIDTH })
			: renderTodosResult({ items, action, theme, width: WIDTH });
		const widget = renderTodosWidget({ items, theme, width: WIDTH });
		return [panel.join("\n"), "", "WIDGET:", widget.join("\n")].join("\n");
	};

	// t=0: empty
	lc.value = clearAndPrint(printState("list"), lc.value);
	await sleep(1000);

	// add alpha
	items = [{ id: "1", content: "alpha — first task", status: "pending" }];
	lc.value = clearAndPrint(printState("add"), lc.value);
	await sleep(1000);

	// add beta
	items.push({ id: "2", content: "beta — second task", status: "pending" });
	lc.value = clearAndPrint(printState("add"), lc.value);
	await sleep(1000);

	// add high-priority review
	items.push({ id: "3", content: "review with Jesse", status: "pending", priority: "high" });
	lc.value = clearAndPrint(printState("add"), lc.value);
	await sleep(1000);

	// complete alpha
	items = items.map((i) => (i.id === "1" ? { ...i, status: "completed" } : i));
	lc.value = clearAndPrint(printState("complete"), lc.value);
	await sleep(1000);

	// update beta to in_progress
	items = items.map((i) => (i.id === "2" ? { ...i, status: "in_progress" } : i));
	lc.value = clearAndPrint(printState("update"), lc.value);
	await sleep(2000);

	// complete beta
	items = items.map((i) => (i.id === "2" ? { ...i, status: "completed" } : i));
	lc.value = clearAndPrint(printState("complete"), lc.value);
	await sleep(1500);

	// error case
	const errorLines = renderTodosError({
		action: "complete",
		message: "no prior todos in session — use 'add' or 'replace' first",
		theme,
		width: WIDTH,
	});
	console.log("\n" + errorLines.join("\n"));
	await sleep(1500);

	// clear
	items = [];
	lc.value = 0; // reset because we printed error inline
	console.log("\n" + printState("clear"));
	await sleep(500);
}

async function simulateSubagentSingle() {
	banner("SUBAGENT · SINGLE");
	const lc = { value: 0 };
	const primaryArg = 'code-reviewer: "review step 2"';
	let running = true;
	let result: RunResult = { name: "code-reviewer", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 0 } };
	let tick = 0;

	for (let elapsed = 0; elapsed < 5; elapsed++) {
		result.metrics = randomMetrics(elapsed + 1, (elapsed + 1) * 0.6);
		tick = (tick + 1) % 8;
		const frame = renderSingleResult({ result, primaryArg, theme, width: WIDTH, running, spinnerTick: tick }).join("\n");
		lc.value = clearAndPrint(frame, lc.value);
		await sleep(600);
	}

	running = false;
	result = { ...result, text: "Changes look good. One nit: consider extracting the loop into a helper for clarity." };
	result.metrics = randomMetrics(5, 4);
	const finalFrame = renderSingleResult({ result, primaryArg, theme, width: WIDTH }).join("\n");
	lc.value = clearAndPrint(finalFrame, lc.value);
	await sleep(1500);
}

async function simulateSubagentParallel() {
	banner("SUBAGENT · PARALLEL");
	const lc = { value: 0 };
	const primaryArg = "parallel: 3 tasks";
	const names = ["reviewer-backend", "reviewer-frontend", "reviewer-tests"];
	const results: RunResult[] = [];

	// all 3 queued
	lc.value = clearAndPrint(
		renderMultiResult({ mode: "parallel", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
		lc.value,
	);
	await sleep(800);

	// all 3 running, climbing
	for (let tick = 0; tick < 4; tick++) {
		const partial = names.map((name, i) => ({
			name,
			text: "",
			metrics: randomMetrics(i + tick + 1, (i + tick) * 0.5),
		}));
		lc.value = clearAndPrint(
			renderMultiResult({ mode: "parallel", results: partial, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
			lc.value,
		);
		await sleep(500);
	}

	// task 0 done
	results.push({ name: names[0], text: "", metrics: randomMetrics(4, 2.5) });
	lc.value = clearAndPrint(
		renderMultiResult({ mode: "parallel", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
		lc.value,
	);
	await sleep(700);

	// task 1 done
	results.push({ name: names[1], text: "", metrics: randomMetrics(3, 2) });
	lc.value = clearAndPrint(
		renderMultiResult({ mode: "parallel", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
		lc.value,
	);
	await sleep(700);

	// task 2 done
	results.push({ name: names[2], text: "", metrics: randomMetrics(5, 3) });
	lc.value = clearAndPrint(
		renderMultiResult({ mode: "parallel", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
		lc.value,
	);
	await sleep(1500);
}

async function simulateSubagentChain() {
	banner("SUBAGENT · CHAIN");
	const lc = { value: 0 };
	const primaryArg = "chain: 3 steps";
	const steps = ["scout", "planner", "implementer"];
	const results: RunResult[] = [];

	// queued
	lc.value = clearAndPrint(
		renderMultiResult({ mode: "chain", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
		lc.value,
	);
	await sleep(800);

	// step 1
	for (let tick = 0; tick < 3; tick++) {
		const partial = [{ name: steps[0], text: "", metrics: randomMetrics(tick + 1, tick + 1) }];
		lc.value = clearAndPrint(
			renderMultiResult({ mode: "chain", results: partial, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
			lc.value,
		);
		await sleep(400);
	}
	results.push({ name: steps[0], text: "found auth code across 12 files", metrics: randomMetrics(3, 2) });

	// step 2
	for (let tick = 0; tick < 4; tick++) {
		const partial = [...results, { name: steps[1], text: "", metrics: randomMetrics(tick + 1, (tick + 1) * 1.5) }];
		lc.value = clearAndPrint(
			renderMultiResult({ mode: "chain", results: partial, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
			lc.value,
		);
		await sleep(400);
	}
	results.push({ name: steps[1], text: "plan drafted", metrics: randomMetrics(4, 2.5) });

	// step 3
	for (let tick = 0; tick < 3; tick++) {
		const partial = [...results, { name: steps[2], text: "", metrics: randomMetrics(tick + 1, (tick + 1) * 1.2) }];
		lc.value = clearAndPrint(
			renderMultiResult({ mode: "chain", results: partial, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
			lc.value,
		);
		await sleep(400);
	}
	results.push({ name: steps[2], text: "implemented", metrics: randomMetrics(5, 3) });

	lc.value = clearAndPrint(
		renderMultiResult({ mode: "chain", results, planned: 3, primaryArg, theme, width: WIDTH }).join("\n"),
		lc.value,
	);
	await sleep(1500);
}

async function simulateWidget() {
	banner("WIDGET (standalone)");
	const lc = { value: 0 };
	let items: TodoItem[] = [];
	const print = () => renderTodosWidget({ items, theme, width: WIDTH }).join("\n") || "(widget cleared)";

	lc.value = clearAndPrint(print(), lc.value);
	await sleep(600);

	items = [
		{ id: "1", content: "alpha", status: "pending" },
		{ id: "2", content: "beta", status: "pending" },
		{ id: "3", content: "review with Jesse", status: "pending", priority: "high" },
	];
	lc.value = clearAndPrint(print(), lc.value);
	await sleep(800);

	items[0].status = "in_progress";
	lc.value = clearAndPrint(print(), lc.value);
	await sleep(800);

	items[0].status = "completed";
	items[1].status = "in_progress";
	lc.value = clearAndPrint(print(), lc.value);
	await sleep(1500);
}

async function main() {
	const mode = process.argv[2] ?? "all";
	if (mode === "todos" || mode === "all") await simulateTodos();
	if (mode === "subagent-single" || mode === "all") await simulateSubagentSingle();
	if (mode === "subagent-parallel" || mode === "all") await simulateSubagentParallel();
	if (mode === "subagent-chain" || mode === "all") await simulateSubagentChain();
	if (mode === "widget" || mode === "all") await simulateWidget();
	console.log("\n");
}

void main();
```

- [ ] **Step 2: Install tsx if missing**

```bash
npm install --save-dev tsx
```

- [ ] **Step 3: Run each mode to confirm**

```bash
npx tsx scripts/simulate-ui.ts todos
npx tsx scripts/simulate-ui.ts subagent-single
npx tsx scripts/simulate-ui.ts subagent-parallel
npx tsx scripts/simulate-ui.ts subagent-chain
npx tsx scripts/simulate-ui.ts widget
```

Expected: each runs cleanly, animates, and prints to terminal. Visually verify against wireframes in spec §4.

- [ ] **Step 4: Commit**

```bash
git add scripts/simulate-ui.ts package.json package-lock.json
git commit -m "feat(scripts): animated simulate-ui with subcommand dispatch"
```

---

## Task 6: `package.json` + `README.md`

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Bump version + add script**

```bash
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("./package.json", "utf8"));
p.version = "5.2.0";
p.scripts["simulate-ui"] = "tsx scripts/simulate-ui.ts";
p.scripts["simulate-ui:all"] = "tsx scripts/simulate-ui.ts all";
fs.writeFileSync("./package.json", JSON.stringify(p, null, 2) + "\n");
'
```

- [ ] **Step 2: Add "Previewing the TUI" subsection to `README.md`**

Find the "Development" section and add below it:

```markdown
### Previewing the TUI

Watch the tool-call / result panels animate in your terminal:

```bash
npm run simulate-ui:all        # runs every surface back-to-back
npm run simulate-ui todos
npm run simulate-ui subagent-single
npm run simulate-ui subagent-parallel
npm run simulate-ui subagent-chain
npm run simulate-ui widget
```

Design iterations: tweak `src/ui/tree.ts` or `src/todos/render.ts`, re-run the command, see changes live. The simulator is not a test — regression safety lives in `*.test.ts` snapshots.
```

- [ ] **Step 3: Run check**

```bash
npm run check
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add package.json README.md
git commit -m "chore(v5.2): bump version, add simulate-ui script, document in README"
```

---

## Task 7: Release v5.2.0

**Files:** (release only)

- [ ] **Step 1: Final full check**

```bash
npm run check
```

Expected: all 194+ tests green.

- [ ] **Step 2: Fast E2E regression check**

```bash
pi remove /Users/josorio/Code/pi-superpowers 2>/dev/null || true
pi install /Users/josorio/Code/pi-superpowers
PI_BIN=$(which pi) npm run test:e2e
```

Expected: all 8 fast E2E tests green.

- [ ] **Step 3: Manual visual sanity**

```bash
npm run simulate-ui:all
```

Compare the output against the wireframes in `docs/specs/2026-04-18-tui-redesign-design.md` §4. Fix anything off before tagging.

- [ ] **Step 4: Tag + push + release**

```bash
git tag -a v5.2.0 -m "pi-superpowers v5.2.0 — TUI redesign (CC-inspired tree style + simulator)"
git push --follow-tags

gh release create v5.2.0 --title "v5.2.0 — TUI Redesign" --notes "Visual redesign of pi-superpowers' tool-call rendering, inspired by Claude Code's bullet/tree style. No breaking API changes.

## What changed

- **Tool-call headers** now render as \`● superpowers_todo(add …)\` / \`● superpowers_subagent(...)\` — no more heavy Unicode boxes.
- **Tool-result panels** now render as \`⎿\`-prefixed branches indented under the header.
- **Todos widget** is now a multi-line always-visible checklist above the editor (replaces the one-line compressed summary). Clears when the list is empty.
- **Checkbox glyphs**: \`☐\` pending / \`◐\` in-progress / \`☒\` done.
- **Brand 🦸** preserved in session-start status + widget header.

## Preview

\`\`\`bash
npx tsx scripts/simulate-ui.ts all
\`\`\`

## Not changed

- \`/todos\` interactive picker retains the previous panel style (redesign deferred to v5.3).
- Session-start status unchanged.

## Install

\`\`\`bash
pi install git:github.com/josorio7122/pi-superpowers@v5.2.0
\`\`\`

## Tests

- 194+ unit tests passing
- 8/8 fast E2E tests passing against real pi"
```

- [ ] **Step 5: Verify install from tag**

```bash
pi install git:github.com/josorio7122/pi-superpowers@v5.2.0
pi list | grep pi-superpowers
```

Expected: shows v5.2.0.

---

## Definition of Done

- All 194+ unit tests green.
- 8/8 fast E2E tests green.
- Pre-commit grep gate returns zero hits outside `/todos` picker.
- `npm run simulate-ui:all` renders cleanly, matches wireframes.
- README has "Previewing the TUI" subsection.
- v5.2.0 tagged, pushed, released.

## Self-review

**Spec coverage:**

- §4.1 todos wireframes → Task 2 (renderTodosCallHeader + renderTodosResult + renderTodosError).
- §4.2 subagent wireframes → Task 2 (renderSubagentCallHeader + renderSingleResult + renderMultiResult).
- §4.3 widget wireframe → Task 2 (renderTodosWidget multi-line).
- §4.4 session-start status → unchanged, no task.
- §5.1 `ui/tree.ts` → Task 1.
- §5.3 icons audit → Task 2 (swap values) + Task 3 (delete orphans).
- §5.4 box.ts cleanup → Task 3.
- §5.5 simulator → Tasks 4 + 5.
- §7 testing → TDD built into every task; no new E2E needed.
- §8 release → Tasks 6 + 7.

**Placeholder scan:** no "TBD" / "implement later". Every step has concrete code or commands.

**Type consistency:** `RenderTodosCallHeaderProps` uses `action` + `args` (Task 2 Step 5). `renderTodosResult` returns `string[]` (Task 2 Step 5). `renderTodosWidget` returns `string[]` (Task 2 Step 3). `renderSingleResult` takes `primaryArg` (Task 2 Step 9). `renderMultiResult` takes `mode: "parallel" | "chain"` + `primaryArg` (Task 2 Step 9). All matched between task definitions and their tests.

Ready.

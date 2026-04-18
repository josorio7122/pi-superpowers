import { describe, expect, it } from "vitest";
import { createTheme } from "../ui/theme.js";
import { renderTodosCallHeader, renderTodosError, renderTodosResult } from "./render.js";
import type { TodoItem } from "./schema.js";

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
	it("renders `● superpowers_todo(<action>)`", () => {
		expect(renderTodosCallHeader({ action: "add", args: "", theme })).toBe("● superpowers_todo(add)");
	});
	it("includes args when provided", () => {
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
	it("renders header + branch with ✗ marker and message", () => {
		const lines = renderTodosError({
			action: "complete",
			message: "no prior todos in session — use 'add' or 'replace' first",
			theme,
			width: 80,
		});
		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain("✗ error");
		expect(lines[1]).toContain("no prior todos");
	});
});

import { describe, expect, it } from "vitest";
import type { TodoItem } from "../todos/schema.js";
import { renderCompactTodo } from "./compact-todo.js";
import { createTheme } from "./theme.js";

const theme = createTheme({ color: false });

function sample(): TodoItem[] {
	return [
		{ id: "1", content: "write brainstorming doc", status: "completed" },
		{ id: "2", content: "confirm upstream-sync approach", status: "completed" },
		{ id: "3", content: "draft implementation plan", status: "in_progress" },
		{ id: "4", content: "review with Jesse", status: "pending" },
		{ id: "5", content: "publish v5.0.7 tag", status: "pending" },
	];
}

describe("renderCompactTodo", () => {
	it("renders brand, progress bar, count, and current item at wide widths", () => {
		const out = renderCompactTodo({ items: sample(), theme, width: 80 });
		expect(out).toContain("[SP]");
		expect(out).toContain("2/5");
		expect(out).toContain("draft implementation plan");
	});

	it("collapses to brand + count at narrow widths (<40)", () => {
		const out = renderCompactTodo({ items: sample(), theme, width: 30 });
		expect(out).toBe("[SP] 2/5");
	});

	it("shows 'no todos' when empty", () => {
		const out = renderCompactTodo({ items: [], theme, width: 80 });
		expect(out).toContain("no todos");
	});

	it("truncates long current-item text to fit width", () => {
		const items: TodoItem[] = [
			{
				id: "1",
				content: "a really long todo item that exceeds any reasonable width".repeat(3),
				status: "in_progress",
			},
		];
		const out = renderCompactTodo({ items, theme, width: 50 });
		expect(out.length).toBeLessThanOrEqual(50);
	});

	it("falls back to first pending when no in-progress", () => {
		const items: TodoItem[] = [
			{ id: "1", content: "done task", status: "completed" },
			{ id: "2", content: "next pending task", status: "pending" },
		];
		const out = renderCompactTodo({ items, theme, width: 80 });
		expect(out).toContain("next pending task");
	});
});

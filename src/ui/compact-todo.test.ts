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

	it("renders brand + activeForm of in_progress task as CC-style header", () => {
		const lines = renderTodosWidget({ items: sample(), theme, width: 80 });
		expect(lines[0]).toContain("[SP]");
		// sample()'s in_progress item has content 'draft implementation plan' and no activeForm
		expect(lines[0]).toContain("draft implementation plan");
		expect(lines[0]).toContain("…");
	});

	it("falls back to 'N/M done' count header when no task is in_progress", () => {
		const items: TodoItem[] = [
			{ id: "1", content: "a", status: "completed" },
			{ id: "2", content: "b", status: "pending" },
		];
		const lines = renderTodosWidget({ items, theme, width: 80 });
		expect(lines[0]).toContain("Tasks");
		expect(lines[0]).toContain("1/2 done");
	});

	it("prefers activeForm over content when rendering the header", () => {
		const items: TodoItem[] = [
			{ id: "1", content: "Build auth flow", activeForm: "Building auth flow", status: "in_progress" },
		];
		const lines = renderTodosWidget({ items, theme, width: 80 });
		expect(lines[0]).toContain("Building auth flow");
	});

	it("appends elapsed time to the header when startedAt is set", () => {
		const now = 100_000;
		const items: TodoItem[] = [
			{ id: "1", content: "Build", activeForm: "Building", status: "in_progress", startedAt: now - 42_000 },
		];
		const lines = renderTodosWidget({ items, theme, width: 80, now });
		expect(lines[0]).toContain("(42s)");
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

import { describe, expect, it } from "vitest";
import { createTheme } from "../ui/theme.js";
import { renderTodosCallHeader, renderTodosPanel } from "./render.js";
import type { TodoItem } from "./schema.js";

const theme = createTheme({ color: false });

function items(): TodoItem[] {
	return [
		{ id: "1", content: "write brainstorming doc", status: "completed" },
		{ id: "2", content: "confirm upstream-sync approach", status: "completed" },
		{ id: "3", content: "draft implementation plan", status: "in_progress" },
		{ id: "4", content: "review with Jesse", status: "pending", priority: "high" },
		{ id: "5", content: "publish v5.0.7 tag", status: "pending" },
	];
}

describe("renderTodosPanel", () => {
	it("renders title with Todos, icon, and done/total badge", () => {
		const out = renderTodosPanel({ items: items(), theme, width: 60 });
		expect(out[0]).toContain("[TODO] Todos");
		expect(out[0]).toContain("2/5");
	});

	it("renders one row per item with state glyphs", () => {
		const out = renderTodosPanel({ items: items(), theme, width: 60 });
		expect(out.some((l) => l.includes("[x]") && l.includes("write brainstorming"))).toBe(true);
		expect(out.some((l) => l.includes("[*]") && l.includes("draft implementation"))).toBe(true);
		expect(out.some((l) => l.includes("[ ]") && l.includes("review with Jesse"))).toBe(true);
	});

	it("adds high-priority marker", () => {
		const out = renderTodosPanel({ items: items(), theme, width: 60 });
		const line = out.find((l) => l.includes("review with Jesse"));
		expect(line).toBeDefined();
		if (line) expect(line).toContain("! review with Jesse");
	});

	it("shows empty-state placeholder when no items", () => {
		const out = renderTodosPanel({ items: [], theme, width: 60 });
		expect(out.some((l) => l.includes("no todos yet"))).toBe(true);
	});

	it("truncates rows to width", () => {
		const longItems: TodoItem[] = [{ id: "1", content: "x".repeat(200), status: "pending" }];
		const out = renderTodosPanel({ items: longItems, theme, width: 40 });
		for (const line of out) expect(line.length).toBeLessThanOrEqual(40);
	});
});

describe("renderTodosCallHeader", () => {
	it("renders icon + name + action", () => {
		expect(renderTodosCallHeader({ action: "add", theme })).toContain("superpowers_todo · add");
	});
	it("includes count when provided", () => {
		expect(renderTodosCallHeader({ action: "replace", count: 3, theme })).toContain("replace (3)");
	});
});

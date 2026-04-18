import { describe, expect, it } from "vitest";
import type { TodoItem } from "./schema.js";
import type { SessionEntryLike } from "./state.js";
import { executeTodos, type TodosToolCtx } from "./tool.js";

function mockCtx(entries: SessionEntryLike[] = []): TodosToolCtx & {
	__widget: Array<[string, string[]]>;
} {
	const widget: Array<[string, string[]]> = [];
	return {
		sessionManager: { getEntries: () => entries },
		ui: {
			setWidget: (id: string, lines: string[]) => {
				widget.push([id, lines]);
			},
			colorEnabled: false,
			width: 80,
		},
		__widget: widget,
	};
}

function priorEntry(items: TodoItem[]): SessionEntryLike {
	return { tool: "superpowers_todo", details: { todos: items, action: "replace" } };
}

describe("executeTodos", () => {
	it("returns error result on invalid input", () => {
		const ctx = mockCtx();
		const out = executeTodos(ctx, { action: "bogus" });
		expect(out.details.action).toBe("error");
	});

	it("add inserts a new pending item with auto-id", () => {
		const ctx = mockCtx();
		const out = executeTodos(ctx, { action: "add", content: "hello" });
		expect(out.details.todos).toHaveLength(1);
		expect(out.details.todos[0]?.content).toBe("hello");
		expect(out.details.todos[0]?.status).toBe("pending");
		expect(out.details.todos[0]?.id).toBe("1");
	});

	it("add with priority attaches priority", () => {
		const ctx = mockCtx();
		const out = executeTodos(ctx, { action: "add", content: "x", priority: "high" });
		expect(out.details.todos[0]?.priority).toBe("high");
	});

	it("add increments id based on existing", () => {
		const ctx = mockCtx([priorEntry([{ id: "7", content: "a", status: "pending" }])]);
		const out = executeTodos(ctx, { action: "add", content: "b" });
		expect(out.details.todos[1]?.id).toBe("8");
	});

	it("complete sets status to completed", () => {
		const ctx = mockCtx([priorEntry([{ id: "1", content: "a", status: "pending" }])]);
		const out = executeTodos(ctx, { action: "complete", id: "1" });
		expect(out.details.todos[0]?.status).toBe("completed");
	});

	it("update changes fields", () => {
		const ctx = mockCtx([priorEntry([{ id: "1", content: "a", status: "pending" }])]);
		const out = executeTodos(ctx, { action: "update", id: "1", status: "in_progress", content: "a2" });
		expect(out.details.todos[0]?.status).toBe("in_progress");
		expect(out.details.todos[0]?.content).toBe("a2");
	});

	it("remove drops the item", () => {
		const ctx = mockCtx([
			priorEntry([
				{ id: "1", content: "a", status: "pending" },
				{ id: "2", content: "b", status: "pending" },
			]),
		]);
		const out = executeTodos(ctx, { action: "remove", id: "1" });
		expect(out.details.todos).toHaveLength(1);
		expect(out.details.todos[0]?.id).toBe("2");
	});

	it("clear empties everything", () => {
		const ctx = mockCtx([priorEntry([{ id: "1", content: "a", status: "pending" }])]);
		const out = executeTodos(ctx, { action: "clear" });
		expect(out.details.todos).toEqual([]);
	});

	it("replace overrides with provided items", () => {
		const ctx = mockCtx([priorEntry([{ id: "1", content: "old", status: "pending" }])]);
		const out = executeTodos(ctx, {
			action: "replace",
			items: [
				{ id: "a", content: "new1", status: "pending" },
				{ id: "b", content: "new2", status: "pending" },
			],
		});
		expect(out.details.todos).toHaveLength(2);
		expect(out.details.todos[0]?.content).toBe("new1");
	});

	it("list returns current state unchanged", () => {
		const ctx = mockCtx([priorEntry([{ id: "1", content: "a", status: "in_progress" }])]);
		const out = executeTodos(ctx, { action: "list" });
		expect(out.details.todos).toHaveLength(1);
	});

	it("updates widget with non-empty items", () => {
		const ctx = mockCtx();
		executeTodos(ctx, { action: "add", content: "x" });
		expect(ctx.__widget.some(([id, lines]) => id === "superpowers-todos" && lines.length > 0)).toBe(true);
	});

	it("clears widget when result is empty", () => {
		const ctx = mockCtx([priorEntry([{ id: "1", content: "x", status: "pending" }])]);
		executeTodos(ctx, { action: "clear" });
		expect(ctx.__widget.some(([id, lines]) => id === "superpowers-todos" && lines.length === 0)).toBe(true);
	});
});

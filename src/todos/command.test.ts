import { describe, expect, it, vi } from "vitest";
import { TodoPickerComponent } from "../ui/todo-picker-component.js";
import { buildTodosCommandHandler, type TodosCommandCtx } from "./command.js";
import type { TodoItem } from "./schema.js";
import type { SessionEntryLike } from "./state.js";

function mockCtx(prior: TodoItem[] = [], finalItems: TodoItem[] = prior) {
	const entries: SessionEntryLike[] = prior.length
		? [{ tool: "superpowers_todo", details: { todos: prior, action: "replace" } }]
		: [];
	const setWidgetCalls: Array<[string, string[]]> = [];
	const customCalls: unknown[] = [];
	const ctx: TodosCommandCtx = {
		sessionManager: { getEntries: () => entries },
		ui: {
			setWidget: (id, lines) => {
				setWidgetCalls.push([id, lines]);
			},
			colorEnabled: false,
			width: 80,
			custom: async (factory) => {
				const done = vi.fn();
				const component = factory({}, {}, {}, done);
				customCalls.push(component);
				return finalItems as never;
			},
			notify: () => undefined,
		},
	};
	return { ctx, setWidgetCalls, customCalls };
}

describe("buildTodosCommandHandler", () => {
	it("invokes ctx.ui.custom with a TodoPickerComponent factory", async () => {
		const { ctx, customCalls } = mockCtx();
		await buildTodosCommandHandler()("", ctx);
		expect(customCalls).toHaveLength(1);
		expect(customCalls[0]).toBeInstanceOf(TodoPickerComponent);
	});

	it("persists picker result via executeTodos (triggers widget set)", async () => {
		const finalItems: TodoItem[] = [{ id: "1", content: "x", status: "pending" }];
		const { ctx, setWidgetCalls } = mockCtx([], finalItems);
		await buildTodosCommandHandler()("", ctx);
		expect(setWidgetCalls.some(([id]) => id === "superpowers-todos")).toBe(true);
	});

	it("no-ops gracefully when ctx.ui.custom is missing (non-interactive mode)", async () => {
		const { ctx, customCalls } = mockCtx();
		(ctx.ui as { custom?: unknown }).custom = undefined;
		await buildTodosCommandHandler()("", ctx);
		expect(customCalls).toHaveLength(0);
	});
});

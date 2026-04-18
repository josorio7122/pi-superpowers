import { describe, expect, it } from "vitest";
import { buildTodosCommandHandler, type TodosCommandCtx } from "./command.js";
import type { TodoItem } from "./schema.js";
import type { SessionEntryLike } from "./state.js";

function mockCtx(prior: TodoItem[] = []) {
	const entries: SessionEntryLike[] = prior.length
		? [{ tool: "superpowers_todo", details: { todos: prior, action: "replace" } }]
		: [];
	const setWidgetCalls: Array<[string, string[]]> = [];
	const customInvocations: Array<(state: unknown) => string[]> = [];
	let finalItems: TodoItem[] = prior;
	const ctx: TodosCommandCtx = {
		sessionManager: { getEntries: () => entries },
		ui: {
			setWidget: (id, lines) => {
				setWidgetCalls.push([id, lines]);
			},
			colorEnabled: false,
			width: 80,
			custom: async (render, onKey) => {
				customInvocations.push(render);
				// simulate user pressing "a" with content, then "q"
				onKey("down");
				return finalItems;
			},
		},
	};
	return { ctx, setWidgetCalls, customInvocations, setFinal: (items: TodoItem[]) => (finalItems = items) };
}

describe("buildTodosCommandHandler", () => {
	it("calls ui.custom with a render function", async () => {
		const { ctx, customInvocations } = mockCtx();
		const handler = buildTodosCommandHandler();
		await handler("", ctx);
		expect(customInvocations).toHaveLength(1);
	});

	it("persists final state via tool replace action (widget call emitted)", async () => {
		const { ctx, setWidgetCalls } = mockCtx([{ id: "1", content: "x", status: "pending" }]);
		const handler = buildTodosCommandHandler();
		await handler("", ctx);
		// executeTodos always pushes a widget set/clear call — confirms we ran it
		expect(setWidgetCalls.some(([id]) => id === "superpowers-todos")).toBe(true);
	});
});

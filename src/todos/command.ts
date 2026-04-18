import { createTheme } from "../ui/theme.js";
import { createPickerState, onPickerKey, renderPicker, type TodoPickerKey } from "../ui/todo-picker.js";
import type { SessionEntryLike } from "./state.js";
import { reconstructTodos } from "./state.js";
import { executeTodos, type TodosToolCtx } from "./tool.js";

export type TodosCommandCtx = TodosToolCtx & {
	ui: TodosToolCtx["ui"] & {
		custom: (render: (state: unknown) => string[], onKey: (key: string) => unknown) => Promise<unknown>;
		input?: (prompt: string) => Promise<string | undefined>;
	};
};

export type TodosCommandHandler = (args: string, ctx: TodosCommandCtx) => Promise<void>;

export function buildTodosCommandHandler(): TodosCommandHandler {
	return async (_args, ctx) => {
		const color = ctx.ui.colorEnabled !== false;
		const width = ctx.ui.width ?? 80;
		const theme = createTheme({ color });

		const prior = reconstructTodos(ctx.sessionManager.getEntries() as SessionEntryLike[]);
		let state = createPickerState({ items: prior });

		await ctx.ui.custom(
			(_s: unknown) => renderPicker({ state, theme, width }),
			(key: string) => {
				const k = key as TodoPickerKey;
				state = onPickerKey({ state, key: k });
				return state;
			},
		);

		// After picker closes, persist via a replace action
		executeTodos(ctx, { action: "replace", items: state.items });
	};
}

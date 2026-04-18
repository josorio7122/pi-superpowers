import { createTheme } from "../ui/theme.js";
import { TodoPickerComponent } from "../ui/todo-picker-component.js";
import type { TodoItem } from "./schema.js";
import { reconstructTodos, type SessionEntryLike } from "./state.js";
import { executeTodos, type TodosToolCtx } from "./tool.js";

export type TodosCommandCtx = TodosToolCtx & {
	ui: TodosToolCtx["ui"] & {
		custom?: <T>(
			factory: (tui: unknown, theme: unknown, keybindings: unknown, done: (value: T) => void) => unknown,
		) => Promise<T>;
		notify?: (message: string, level?: string) => void;
	};
};

export type TodosCommandHandler = (args: string, ctx: TodosCommandCtx) => Promise<void>;

export function buildTodosCommandHandler(): TodosCommandHandler {
	return async (_args, ctx) => {
		if (typeof ctx.ui.custom !== "function") {
			ctx.ui.notify?.("/todos requires interactive TUI mode", "warn");
			return;
		}

		const color = ctx.ui.colorEnabled !== false;
		const theme = createTheme({ color });
		const entries = ctx.sessionManager.getEntries() as SessionEntryLike[];
		const initialItems = reconstructTodos(entries);

		const finalItems = await ctx.ui.custom<TodoItem[]>(
			// biome-ignore lint/complexity/useMaxParams: pi's ctx.ui.custom factory receives 4 positional args
			(_tui, _theme, _keybindings, done) => new TodoPickerComponent({ initialItems, theme }, done),
		);

		executeTodos(ctx, { action: "replace", items: finalItems });
	};
}

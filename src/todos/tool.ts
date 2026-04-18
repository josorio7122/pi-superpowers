import { Value } from "@sinclair/typebox/value";
import { renderCompactTodo } from "../ui/compact-todo.js";
import { createTheme } from "../ui/theme.js";
import { clearWidget, setWidget } from "../ui/widget.js";
import { renderTodosPanel } from "./render.js";
import { type TodoAction, TodoActionSchema, type TodoItem } from "./schema.js";
import { reconstructTodos, type SessionEntryLike } from "./state.js";

export type TodosToolCtx = {
	sessionManager: { getEntries: () => SessionEntryLike[] };
	ui: {
		setWidget: (id: string, lines: string[]) => void;
		colorEnabled?: boolean;
		width?: number;
	};
};

export type TodosToolResult = {
	content: Array<{ type: "text"; text: string }>;
	details: { todos: TodoItem[]; action: string };
};

function nextId(existing: TodoItem[]): string {
	const nums = existing.map((i) => Number.parseInt(i.id, 10)).filter((n) => !Number.isNaN(n));
	const max = nums.length === 0 ? 0 : Math.max(...nums);
	return String(max + 1);
}

function applyAction(items: TodoItem[], action: TodoAction): TodoItem[] {
	if (action.action === "list") return items;
	if (action.action === "clear") return [];
	if (action.action === "replace") return action.items;
	if (action.action === "add") {
		const item: TodoItem = {
			id: nextId(items),
			content: action.content,
			status: "pending",
			...(action.priority ? { priority: action.priority } : {}),
		};
		return [...items, item];
	}
	if (action.action === "update") {
		return items.map((i) => {
			if (i.id !== action.id) return i;
			return {
				...i,
				...(action.content ? { content: action.content } : {}),
				...(action.status ? { status: action.status } : {}),
				...(action.priority ? { priority: action.priority } : {}),
			};
		});
	}
	if (action.action === "complete") {
		return items.map((i) => (i.id === action.id ? { ...i, status: "completed" as const } : i));
	}
	return items.filter((i) => i.id !== action.id);
}

export function executeTodos(ctx: TodosToolCtx, input: unknown): TodosToolResult {
	if (!Value.Check(TodoActionSchema, input)) {
		return {
			content: [{ type: "text", text: "Invalid todo action input." }],
			details: { todos: [], action: "error" },
		};
	}
	const action = input as TodoAction;
	const prior = reconstructTodos(ctx.sessionManager.getEntries());
	const todos = applyAction(prior, action);

	const color = ctx.ui.colorEnabled !== false;
	const width = ctx.ui.width ?? 80;
	const theme = createTheme({ color });
	const panelRows = renderTodosPanel({ items: todos, theme, width });
	const widgetRow = renderCompactTodo({ items: todos, theme, width });

	if (todos.length === 0) clearWidget(ctx as never, "todos");
	else setWidget(ctx as never, { name: "todos", lines: [widgetRow] });

	return {
		content: [{ type: "text", text: panelRows.join("\n") }],
		details: { todos, action: action.action },
	};
}

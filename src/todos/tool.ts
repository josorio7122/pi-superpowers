import { Value } from "@sinclair/typebox/value";
import { renderTodosWidget } from "../ui/compact-todo.js";
import { createTheme } from "../ui/theme.js";
import { clearWidget, setWidget } from "../ui/widget.js";
import { renderTodosError, renderTodosResult } from "./render.js";
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

type TransitionProps = { item: TodoItem; nextStatus: TodoItem["status"]; now: number };

/** Transition an item's status, managing startedAt lifecycle. */
function transitionStatus(props: TransitionProps): TodoItem {
	const { item, nextStatus, now } = props;
	if (item.status === nextStatus) return { ...item, status: nextStatus };
	if (nextStatus === "in_progress") return { ...item, status: nextStatus, startedAt: now };
	// leaving in_progress (→ pending or completed) clears startedAt
	const { startedAt: _drop, ...rest } = item;
	return { ...rest, status: nextStatus };
}

function applyAction(items: TodoItem[], action: TodoAction): TodoItem[] {
	const now = Date.now();
	if (action.action === "list") return items;
	if (action.action === "clear") return [];
	if (action.action === "replace") return action.items;
	if (action.action === "add") {
		const item: TodoItem = {
			id: nextId(items),
			content: action.content,
			status: "pending",
			...(action.activeForm ? { activeForm: action.activeForm } : {}),
			...(action.priority ? { priority: action.priority } : {}),
		};
		return [...items, item];
	}
	if (action.action === "update") {
		return items.map((i) => {
			if (i.id !== action.id) return i;
			const withFields: TodoItem = {
				...i,
				...(action.content ? { content: action.content } : {}),
				...(action.activeForm ? { activeForm: action.activeForm } : {}),
				...(action.priority ? { priority: action.priority } : {}),
			};
			return action.status ? transitionStatus({ item: withFields, nextStatus: action.status, now }) : withFields;
		});
	}
	if (action.action === "complete") {
		return items.map((i) => (i.id === action.id ? transitionStatus({ item: i, nextStatus: "completed", now }) : i));
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

	const color = ctx.ui.colorEnabled !== false;
	const width = ctx.ui.width ?? 80;
	const theme = createTheme({ color });

	// Guard: complete / update / remove are no-ops on empty state. Before this
	// guard, a bug in reconstructTodos (v5.1.1) could silently return empty and
	// the model would lose its list without any signal. Surface a clear error so
	// the root cause is visible.
	const mutating = action.action === "complete" || action.action === "update" || action.action === "remove";
	if (mutating && prior.length === 0) {
		const errorLines = renderTodosError({
			action: action.action,
			message: "no prior todos in session — use 'add' or 'replace' first",
			theme,
			width,
		});
		return {
			content: [{ type: "text", text: errorLines.join("\n") }],
			details: { todos: [], action: "error" },
		};
	}

	const todos = applyAction(prior, action);

	const panelRows = renderTodosResult({ items: todos, action: action.action, theme, width });
	const widgetLines = renderTodosWidget({ items: todos, theme, width });

	if (todos.length === 0) clearWidget(ctx as never, "todos");
	else setWidget(ctx as never, { name: "todos", lines: widgetLines });

	return {
		content: [{ type: "text", text: panelRows.join("\n") }],
		details: { todos, action: action.action },
	};
}

import { panel } from "../ui/box.js";
import type { Theme } from "../ui/theme.js";
import type { TodoItem } from "./schema.js";

export type RenderTodosPanelProps = {
	items: TodoItem[];
	theme: Theme;
	width: number;
};

function stateGlyph(item: TodoItem, theme: Theme): string {
	if (item.status === "completed") return theme.icon("done");
	if (item.status === "in_progress") return theme.icon("inProgress");
	return theme.icon("pending");
}

function renderRow(item: TodoItem, theme: Theme): string {
	const glyph = stateGlyph(item, theme);
	const prio = item.priority === "high" ? "! " : "  ";
	const body = item.status === "completed" ? theme.dim(item.content) : item.content;
	return `${glyph} ${prio}${body}`;
}

export function renderTodosPanel(props: RenderTodosPanelProps): string[] {
	const { items, theme, width } = props;
	const done = items.filter((i) => i.status === "completed").length;
	const total = items.length;
	const badge = total > 0 ? `${done}/${total}` : "";
	const rows = total > 0 ? items.map((i) => renderRow(i, theme)) : [theme.dim("(no todos yet — use add)")];
	return panel({
		title: "Todos",
		icon: theme.icon("todo"),
		badge,
		width,
		rows,
		theme,
	});
}

export type RenderTodosCallHeaderProps = {
	action: string;
	count?: number;
	theme: Theme;
};

export function renderTodosCallHeader(props: RenderTodosCallHeaderProps): string {
	const { action, count, theme } = props;
	const countStr = typeof count === "number" ? ` (${count})` : "";
	return `${theme.icon("todo")} superpowers_todo · ${action}${countStr}`;
}

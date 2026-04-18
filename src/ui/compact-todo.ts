import type { TodoItem } from "../todos/schema.js";
import { ICONS } from "./icons.js";
import type { Theme } from "./theme.js";
import { checkbox, priorityMark } from "./tree.js";
import { truncateEnd } from "./truncate.js";

export type RenderTodosWidgetProps = {
	items: TodoItem[];
	theme: Theme;
	width: number;
};

/**
 * Always-visible multi-line checklist widget above the editor.
 * Returns an empty array when items is empty (caller clears the widget).
 */
export function renderTodosWidget(props: RenderTodosWidgetProps): string[] {
	const { items, theme, width } = props;
	if (items.length === 0) return [];

	const brand = theme.color ? ICONS.brand : "[SP]";
	const done = items.filter((i) => i.status === "completed").length;
	const headerText = `${brand} Todos · ${done}/${items.length} done`;
	const lines: string[] = [truncateEnd(theme.primary(headerText), width)];

	for (const item of items) {
		const box = theme.color ? checkbox(item.status, { theme }) : checkbox(item.status, { theme, ascii: true });
		const prio = priorityMark(item.priority, theme);
		const prioChunk = prio ? `${theme.warn(prio)} ` : "  ";
		const content = item.status === "completed" ? theme.dim(item.content) : item.content;
		const line = `   ${box}  ${prioChunk}${content}`;
		lines.push(truncateEnd(line, width));
	}

	return lines;
}

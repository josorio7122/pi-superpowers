import type { TodoItem } from "../todos/schema.js";
import { ICONS } from "./icons.js";
import type { Theme } from "./theme.js";
import { checkbox, priorityMark } from "./tree.js";
import { truncateEnd } from "./truncate.js";

export type RenderTodosWidgetProps = {
	items: TodoItem[];
	theme: Theme;
	width: number;
	now?: number;
};

/** Format an elapsed ms duration the way Claude Code does: `42s`, `3m 12s`, `1h 4m`. */
export function formatElapsed(ms: number): string {
	const s = Math.max(0, Math.floor(ms / 1000));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ${s % 60}s`;
	const h = Math.floor(m / 60);
	return `${h}h ${m % 60}m`;
}

function strikethrough(text: string): string {
	return `\x1b[9m${text}\x1b[29m`;
}

/**
 * Always-visible multi-line checklist widget above the editor.
 * CC-style: header shows the active task's `activeForm` + elapsed time when one is
 * in_progress; otherwise falls back to the done/total count. List below uses bold
 * for in_progress, strikethrough+dim for completed, plain for pending.
 *
 * Returns an empty array when items is empty (caller clears the widget).
 */
export function renderTodosWidget(props: RenderTodosWidgetProps): string[] {
	const { items, theme, width } = props;
	if (items.length === 0) return [];
	const now = props.now ?? Date.now();

	const brand = theme.color ? ICONS.brand : "[SP]";
	const done = items.filter((i) => i.status === "completed").length;
	const active = items.find((i) => i.status === "in_progress");

	const headerText = active
		? `${brand} ${active.activeForm ?? active.content}…${
				active.startedAt ? ` (${formatElapsed(now - active.startedAt)})` : ""
			}`
		: `${brand} Tasks · ${done}/${items.length} done`;
	const lines: string[] = [truncateEnd(theme.primary(headerText), width)];

	for (const item of items) {
		const box = theme.color ? checkbox(item.status, { theme }) : checkbox(item.status, { theme, ascii: true });
		const prio = priorityMark(item.priority, theme);
		const prioChunk = prio ? `${theme.warn(prio)} ` : "  ";
		const rawContent = item.content;
		let content: string;
		if (item.status === "completed") {
			content = theme.dim(theme.color ? strikethrough(rawContent) : rawContent);
		} else if (item.status === "in_progress") {
			content = theme.primary(rawContent);
		} else {
			content = rawContent;
		}
		const line = `   ${box}  ${prioChunk}${content}`;
		lines.push(truncateEnd(line, width));
	}

	return lines;
}

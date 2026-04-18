import type { TodoItem } from "../todos/schema.js";
import { progressBar } from "./progress.js";
import type { Theme } from "./theme.js";
import { truncateEnd } from "./truncate.js";

export type CompactTodoProps = {
	items: TodoItem[];
	theme: Theme;
	width: number;
};

export function renderCompactTodo(props: CompactTodoProps): string {
	const { items, theme, width } = props;
	const total = items.length;
	const done = items.filter((i) => i.status === "completed").length;
	const brand = theme.icon("brand");

	if (total === 0) return `${brand} no todos`;

	if (width < 40) return `${brand} ${done}/${total}`;

	const inProgress = items.find((i) => i.status === "in_progress");
	const next = inProgress ?? items.find((i) => i.status === "pending");
	const currentText = next ? `${theme.icon(inProgress ? "inProgress" : "pending")} ${next.content}` : "all done";

	const barWidth = 5;
	const bar = progressBar({ current: done, total, width: barWidth, color: theme.color });
	const prefix = `${brand} ${bar} ${done}/${total} · `;
	const room = Math.max(4, width - prefix.length);
	return prefix + truncateEnd(currentText, room);
}

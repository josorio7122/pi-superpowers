import type { Theme } from "../ui/theme.js";
import { branch, bullet, checkbox, indent, priorityMark } from "../ui/tree.js";
import { truncateEnd } from "../ui/truncate.js";
import type { TodoItem } from "./schema.js";

export type RenderTodosCallHeaderProps = {
	action: string;
	args: string;
	theme: Theme;
	width?: number;
};

/** One-line `●` header. Args are shown inside `()` dimmed. */
export function renderTodosCallHeader(props: RenderTodosCallHeaderProps): string {
	const label = `superpowers_todo(${props.action}${props.args ? ` ${props.theme.dim(props.args)}` : ""})`;
	return bullet({ label, theme: props.theme, ...(props.width !== undefined ? { width: props.width } : {}) });
}

export type RenderTodosResultProps = {
	items: TodoItem[];
	action: string;
	theme: Theme;
	width: number;
};

/** Tool-result panel: `●` header + `⎿` summary line + indented checklist. */
export function renderTodosResult(props: RenderTodosResultProps): string[] {
	const { items, action, theme, width } = props;
	const header = renderTodosCallHeader({ action, args: "", theme, width });
	if (items.length === 0) {
		return [header, branch({ text: theme.dim("no todos"), theme, width })];
	}
	const done = items.filter((i) => i.status === "completed").length;
	const summary = branch({
		text: `${items.length} todo${items.length === 1 ? "" : "s"} · ${done}/${items.length} done`,
		theme,
		width,
	});
	const rows = items.map((item) => {
		const box = theme.color ? checkbox(item.status, { theme }) : checkbox(item.status, { theme, ascii: true });
		const prio = priorityMark(item.priority, theme);
		const prioChunk = prio ? `${theme.warn(prio)} ` : "  ";
		const content = item.status === "completed" ? theme.dim(item.content) : item.content;
		return truncateEnd(indent(`${box}  ${prioChunk}${content}`, 5), width);
	});
	return [header, summary, ...rows];
}

export type RenderTodosErrorProps = {
	action: string;
	message: string;
	theme: Theme;
	width: number;
};

/** Error result — single `●` header + single `⎿ ✗` line. */
export function renderTodosError(props: RenderTodosErrorProps): string[] {
	const header = renderTodosCallHeader({ action: props.action, args: "", theme: props.theme, width: props.width });
	const errLine = branch({
		text: `${props.theme.error("✗")} error: ${props.message}`,
		theme: props.theme,
		width: props.width,
	});
	return [header, errLine];
}

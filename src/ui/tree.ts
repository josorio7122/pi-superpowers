import type { TodoPriority, TodoStatus } from "../todos/schema.js";
import type { Theme } from "./theme.js";
import { truncateEnd } from "./truncate.js";

const CHECKBOX_UNICODE = { pending: "☐", in_progress: "◐", completed: "☒" } as const;
const CHECKBOX_ASCII = { pending: "[ ]", in_progress: "[*]", completed: "[x]" } as const;
const BULLET = "●";
const BRANCH = "⎿";

export type BulletProps = { label: string; theme: Theme; width?: number };

export function bullet(props: BulletProps): string {
	const line = `${props.theme.primary(BULLET)} ${props.label}`;
	if (props.width === undefined) return line;
	return truncateEnd(line, props.width);
}

export type BranchProps = { text: string; theme: Theme; indent?: number; width?: number };

export function branch(props: BranchProps): string {
	const spaces = " ".repeat(props.indent ?? 2);
	const line = `${spaces}${props.theme.dim(BRANCH)}  ${props.text}`;
	if (props.width === undefined) return line;
	return truncateEnd(line, props.width);
}

export function indent(text: string, spaces: number): string {
	const pad = " ".repeat(spaces);
	return text
		.split("\n")
		.map((line) => pad + line)
		.join("\n");
}

export type CheckboxProps = { theme: Theme; ascii?: boolean };

export function checkbox(status: TodoStatus, opts: CheckboxProps): string {
	return opts.ascii ? CHECKBOX_ASCII[status] : CHECKBOX_UNICODE[status];
}

export function priorityMark(priority: TodoPriority | undefined, _theme: Theme): string {
	return priority === "high" ? "!" : "";
}

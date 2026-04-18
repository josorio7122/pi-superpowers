import type { TodoItem, TodoStatus } from "../todos/schema.js";
import { panel } from "./box.js";
import type { Theme } from "./theme.js";

export type TodoPickerState = {
	items: TodoItem[];
	cursor: number;
	done: boolean;
};

export type TodoPickerKey =
	| "up"
	| "down"
	| "space"
	| "a" // add (caller supplies content via separate prompt)
	| "x" // remove
	| "1" // priority low
	| "2" // priority medium
	| "3" // priority high
	| "q";

export type TodoPickerProps = {
	items: TodoItem[];
};

export type RenderPickerProps = {
	state: TodoPickerState;
	theme: Theme;
	width: number;
};

export function createPickerState(props: TodoPickerProps): TodoPickerState {
	return { items: props.items, cursor: 0, done: false };
}

function cycleStatus(s: TodoStatus): TodoStatus {
	if (s === "pending") return "in_progress";
	if (s === "in_progress") return "completed";
	return "pending";
}

export type PickerKeyInput = {
	state: TodoPickerState;
	key: TodoPickerKey;
	addContent?: string;
};

export function onPickerKey(input: PickerKeyInput): TodoPickerState {
	const { state, key, addContent } = input;
	const { items } = state;
	const max = items.length - 1;
	const safeCursor = Math.max(0, Math.min(state.cursor, Math.max(0, max)));

	if (key === "q") return { ...state, done: true };
	if (key === "up") return { ...state, cursor: Math.max(0, safeCursor - 1) };
	if (key === "down") return { ...state, cursor: Math.min(Math.max(0, max), safeCursor + 1) };

	if (key === "space") {
		const current = items[safeCursor];
		if (!current) return state;
		const nextItems = items.map((it) => (it.id === current.id ? { ...it, status: cycleStatus(it.status) } : it));
		return { ...state, items: nextItems };
	}

	if (key === "a") {
		if (!addContent) return state;
		const nums = items.map((i) => Number.parseInt(i.id, 10)).filter((n) => !Number.isNaN(n));
		const id = String((nums.length === 0 ? 0 : Math.max(...nums)) + 1);
		const next: TodoItem = { id, content: addContent, status: "pending" };
		return { ...state, items: [...items, next], cursor: items.length };
	}

	if (key === "x") {
		const current = items[safeCursor];
		if (!current) return state;
		const nextItems = items.filter((it) => it.id !== current.id);
		const nextCursor = Math.max(0, Math.min(safeCursor, nextItems.length - 1));
		return { ...state, items: nextItems, cursor: nextCursor };
	}

	if (key === "1" || key === "2" || key === "3") {
		const current = items[safeCursor];
		if (!current) return state;
		const priorityMap = { "1": "low", "2": "medium", "3": "high" } as const;
		const priority = priorityMap[key];
		const nextItems = items.map((it) => (it.id === current.id ? { ...it, priority } : it));
		return { ...state, items: nextItems };
	}

	return state;
}

function glyph(status: TodoStatus, theme: Theme): string {
	if (status === "completed") return theme.icon("done");
	if (status === "in_progress") return theme.icon("inProgress");
	return theme.icon("pending");
}

export function renderPicker(props: RenderPickerProps): string[] {
	const { state, theme, width } = props;
	const done = state.items.filter((i) => i.status === "completed").length;
	const total = state.items.length;
	const badge = total > 0 ? `${done}/${total} done` : "empty";
	const rows =
		total === 0
			? [theme.dim("(no todos yet — press 'a' to add)")]
			: state.items.map((it, idx) => {
					const marker = idx === state.cursor ? "›" : " ";
					const prio = it.priority === "high" ? "!" : " ";
					return `${marker} ${glyph(it.status, theme)} ${prio} ${it.content}`;
				});
	const body = panel({
		title: "Todos · session",
		icon: theme.icon("todo"),
		badge,
		width,
		rows,
		theme,
	});
	const help = theme.dim("  j/k move · space toggle · a add · x remove · 1/2/3 priority · q quit");
	return [...body, help];
}

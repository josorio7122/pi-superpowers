import { writeMarker } from "../common/markers.js";
import type { TodoItem } from "../todos/schema.js";
import type { Theme } from "./theme.js";
import {
	createPickerState,
	onPickerKey,
	renderPicker,
	type TodoPickerKey,
	type TodoPickerState,
} from "./todo-picker.js";

export interface PiTuiComponent {
	render(width: number): string[];
	handleInput?(data: string): void;
	invalidate(): void;
}

export function mapPiKeyToTodoPickerKey(data: string): TodoPickerKey | null {
	if (data === "\u001b[A" || data === "k") return "up";
	if (data === "\u001b[B" || data === "j") return "down";
	if (data === " ") return "space";
	if (data === "a") return "a";
	if (data === "x") return "x";
	if (data === "q") return "q";
	if (data === "1" || data === "2" || data === "3") return data;
	return null;
}

export type TodoPickerComponentProps = {
	initialItems: TodoItem[];
	theme: Theme;
};

export class TodoPickerComponent implements PiTuiComponent {
	private state: TodoPickerState;
	private readonly theme: Theme;
	private readonly done: (items: TodoItem[]) => void;

	constructor(props: TodoPickerComponentProps, done: (items: TodoItem[]) => void) {
		this.state = createPickerState({ items: props.initialItems });
		this.theme = props.theme;
		this.done = done;
		void writeMarker("todo-picker-opened", { itemCount: props.initialItems.length });
	}

	render(width: number): string[] {
		return renderPicker({ state: this.state, theme: this.theme, width });
	}

	handleInput(data: string): void {
		const key = mapPiKeyToTodoPickerKey(data);
		if (!key) return;
		this.state = onPickerKey({ state: this.state, key });
		if (this.state.done) {
			this.done(this.state.items);
		}
	}

	invalidate(): void {
		// State-driven; pi-tui will re-call render().
	}
}

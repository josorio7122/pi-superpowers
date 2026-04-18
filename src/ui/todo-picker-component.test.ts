import { describe, expect, it, vi } from "vitest";
import type { TodoItem } from "../todos/schema.js";
import { createTheme } from "./theme.js";
import { mapPiKeyToTodoPickerKey, TodoPickerComponent } from "./todo-picker-component.js";

const theme = createTheme({ color: false });

function items(): TodoItem[] {
	return [
		{ id: "1", content: "first", status: "pending" },
		{ id: "2", content: "second", status: "completed" },
	];
}

describe("mapPiKeyToTodoPickerKey", () => {
	it("maps up-arrow to 'up'", () => {
		expect(mapPiKeyToTodoPickerKey("\u001b[A")).toBe("up");
	});
	it("maps down-arrow to 'down'", () => {
		expect(mapPiKeyToTodoPickerKey("\u001b[B")).toBe("down");
	});
	it("maps 'j' to 'down', 'k' to 'up'", () => {
		expect(mapPiKeyToTodoPickerKey("j")).toBe("down");
		expect(mapPiKeyToTodoPickerKey("k")).toBe("up");
	});
	it("maps space to 'space'", () => {
		expect(mapPiKeyToTodoPickerKey(" ")).toBe("space");
	});
	it("maps 'a', 'x', 'q' and '1'/'2'/'3' literally", () => {
		expect(mapPiKeyToTodoPickerKey("a")).toBe("a");
		expect(mapPiKeyToTodoPickerKey("x")).toBe("x");
		expect(mapPiKeyToTodoPickerKey("q")).toBe("q");
		expect(mapPiKeyToTodoPickerKey("1")).toBe("1");
	});
	it("returns null for unknown keys", () => {
		expect(mapPiKeyToTodoPickerKey("Z")).toBeNull();
	});
});

describe("TodoPickerComponent", () => {
	it("render returns string[] with expected title row", () => {
		const done = vi.fn();
		const c = new TodoPickerComponent({ initialItems: items(), theme }, done);
		const lines = c.render(60);
		expect(lines.some((l) => l.includes("Todos · session"))).toBe(true);
	});

	it("handleInput('j') moves cursor down and re-renders with cursor on second item", () => {
		const done = vi.fn();
		const c = new TodoPickerComponent({ initialItems: items(), theme }, done);
		c.handleInput("j");
		const lines = c.render(60);
		expect(lines.some((l) => l.includes("›") && l.includes("second"))).toBe(true);
	});

	it("handleInput(' ') toggles status of cursor item", () => {
		const done = vi.fn();
		const c = new TodoPickerComponent({ initialItems: items(), theme }, done);
		c.handleInput(" ");
		const lines = c.render(60);
		expect(lines.some((l) => l.includes("[*]") && l.includes("first"))).toBe(true);
	});

	it("handleInput('q') calls done() with current items", () => {
		const done = vi.fn();
		const c = new TodoPickerComponent({ initialItems: items(), theme }, done);
		c.handleInput("q");
		expect(done).toHaveBeenCalledTimes(1);
		const arg = done.mock.calls[0]?.[0] as TodoItem[];
		expect(arg).toHaveLength(2);
	});

	it("invalidate does not throw", () => {
		const done = vi.fn();
		const c = new TodoPickerComponent({ initialItems: items(), theme }, done);
		expect(() => {
			c.invalidate();
		}).not.toThrow();
	});
});

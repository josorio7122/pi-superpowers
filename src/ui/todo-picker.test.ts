import { describe, expect, it } from "vitest";
import type { TodoItem } from "../todos/schema.js";
import { createTheme } from "./theme.js";
import { createPickerState, onPickerKey, renderPicker } from "./todo-picker.js";

const theme = createTheme({ color: false });

function items(): TodoItem[] {
	return [
		{ id: "1", content: "first", status: "pending" },
		{ id: "2", content: "second", status: "pending" },
		{ id: "3", content: "third", status: "completed" },
	];
}

describe("createPickerState", () => {
	it("starts with cursor at 0 and done=false", () => {
		const s = createPickerState({ items: items() });
		expect(s.cursor).toBe(0);
		expect(s.done).toBe(false);
		expect(s.items).toHaveLength(3);
	});
});

describe("onPickerKey", () => {
	it("down moves cursor +1, clamped at max", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "down" });
		expect(s.cursor).toBe(1);
		s = onPickerKey({ state: s, key: "down" });
		s = onPickerKey({ state: s, key: "down" });
		expect(s.cursor).toBe(2);
	});

	it("up moves cursor -1, clamped at 0", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "up" });
		expect(s.cursor).toBe(0);
		s = onPickerKey({ state: { ...s, cursor: 2 }, key: "up" });
		expect(s.cursor).toBe(1);
	});

	it("space toggles status of current item", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "space" });
		expect(s.items[0]?.status).toBe("in_progress");
		s = onPickerKey({ state: s, key: "space" });
		expect(s.items[0]?.status).toBe("completed");
		s = onPickerKey({ state: s, key: "space" });
		expect(s.items[0]?.status).toBe("pending");
	});

	it("a adds a new item when addContent given", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "a", addContent: "new task" });
		expect(s.items).toHaveLength(4);
		expect(s.items[3]?.content).toBe("new task");
		expect(s.items[3]?.id).toBe("4");
		expect(s.cursor).toBe(3);
	});

	it("a is a no-op without addContent", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "a" });
		expect(s.items).toHaveLength(3);
	});

	it("x removes current item", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "x" });
		expect(s.items).toHaveLength(2);
		expect(s.items[0]?.id).toBe("2");
	});

	it("1/2/3 set priority", () => {
		let s = createPickerState({ items: items() });
		s = onPickerKey({ state: s, key: "3" });
		expect(s.items[0]?.priority).toBe("high");
		s = onPickerKey({ state: s, key: "1" });
		expect(s.items[0]?.priority).toBe("low");
	});

	it("q sets done=true", () => {
		const s = onPickerKey({ state: createPickerState({ items: items() }), key: "q" });
		expect(s.done).toBe(true);
	});
});

describe("renderPicker", () => {
	it("renders title, items with glyphs, cursor marker, and help line", () => {
		const s = createPickerState({ items: items() });
		const out = renderPicker({ state: s, theme, width: 60 });
		expect(out[0]).toContain("Todos · session");
		expect(out.some((l) => l.includes("›") && l.includes("first"))).toBe(true);
		expect(out.some((l) => l.includes("[x]") && l.includes("third"))).toBe(true);
		expect(out[out.length - 1]).toContain("j/k move");
	});

	it("shows empty placeholder when no items", () => {
		const s = createPickerState({ items: [] });
		const out = renderPicker({ state: s, theme, width: 60 });
		expect(out.some((l) => l.includes("no todos yet"))).toBe(true);
	});
});

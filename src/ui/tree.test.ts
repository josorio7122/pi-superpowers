import { describe, expect, it } from "vitest";
import type { TodoStatus } from "../todos/schema.js";
import { createTheme } from "./theme.js";
import { branch, bullet, checkbox, indent, priorityMark } from "./tree.js";

const theme = createTheme({ color: false });

describe("bullet", () => {
	it("renders `● <label>` with primary color applied", () => {
		expect(bullet({ label: "superpowers_todo(add)", theme })).toBe("● superpowers_todo(add)");
	});

	it("truncates label to provided width (including bullet + space)", () => {
		const out = bullet({ label: "x".repeat(200), theme, width: 10 });
		expect(out.length).toBeLessThanOrEqual(10);
		expect(out.startsWith("● ")).toBe(true);
	});
});

describe("branch", () => {
	it("renders `  ⎿  <text>` with default indent=2", () => {
		expect(branch({ text: "hello", theme })).toBe("  ⎿  hello");
	});

	it("supports custom indent (e.g. 0 for flush-left branches)", () => {
		expect(branch({ text: "hi", theme, indent: 0 })).toBe("⎿  hi");
	});

	it("truncates text to width budget", () => {
		const out = branch({ text: "y".repeat(200), theme, width: 20 });
		expect(out.length).toBeLessThanOrEqual(20);
	});
});

describe("indent", () => {
	it("prefixes each line of multiline input with N spaces", () => {
		expect(indent("a\nb\nc", 3)).toBe("   a\n   b\n   c");
	});

	it("preserves empty lines (still indented)", () => {
		expect(indent("a\n\nb", 2)).toBe("  a\n  \n  b");
	});
});

describe("checkbox", () => {
	it("returns pending glyph for pending", () => {
		expect(checkbox("pending" as TodoStatus, { theme })).toBe("☐");
	});
	it("returns in-progress glyph for in_progress", () => {
		expect(checkbox("in_progress" as TodoStatus, { theme })).toBe("◐");
	});
	it("returns done glyph for completed", () => {
		expect(checkbox("completed" as TodoStatus, { theme })).toBe("☒");
	});
	it("returns ASCII fallback glyphs when ascii=true", () => {
		expect(checkbox("pending" as TodoStatus, { theme, ascii: true })).toBe("[ ]");
		expect(checkbox("in_progress" as TodoStatus, { theme, ascii: true })).toBe("[*]");
		expect(checkbox("completed" as TodoStatus, { theme, ascii: true })).toBe("[x]");
	});
});

describe("priorityMark", () => {
	it("returns '!' for high priority", () => {
		expect(priorityMark("high", theme)).toBe("!");
	});
	it("returns empty string for medium/low/undefined", () => {
		expect(priorityMark("medium", theme)).toBe("");
		expect(priorityMark("low", theme)).toBe("");
		expect(priorityMark(undefined, theme)).toBe("");
	});
});

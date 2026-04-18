import { describe, expect, it } from "vitest";
import { badge, divider, panel } from "./box.js";
import { createTheme } from "./theme.js";

const theme = createTheme({ color: false });

describe("divider", () => {
	it("returns a line of given width", () => {
		expect(divider(5)).toBe("─────");
	});
});

describe("panel", () => {
	it("renders a box with title and body rows", () => {
		const out = panel({
			title: "Todos",
			icon: "[TODO]",
			badge: "2/5",
			width: 40,
			rows: ["[ ] write tests", "[x] commit"],
			theme,
		});
		expect(out[0]).toMatch(/^┌─/);
		expect(out[0]).toContain("[TODO] Todos");
		expect(out[0]).toContain("2/5");
		expect(out.some((l) => l.startsWith("│"))).toBe(true);
		const last = out[out.length - 1] ?? "";
		expect(last).toMatch(/^└─+┘$/);
	});

	it("truncates long body rows to width", () => {
		const out = panel({
			title: "t",
			width: 20,
			rows: ["this is a really long line that exceeds width"],
			theme,
		});
		const bodyLine = out.find((l) => l.includes("this"));
		expect(bodyLine).toBeDefined();
		if (bodyLine) expect(bodyLine.length).toBeLessThanOrEqual(20);
	});
});

describe("badge", () => {
	it("renders success badge", () => {
		expect(badge({ kind: "success", text: "OK", theme })).toContain("OK");
	});
	it("renders error badge", () => {
		expect(badge({ kind: "error", text: "FAIL", theme })).toContain("FAIL");
	});
});

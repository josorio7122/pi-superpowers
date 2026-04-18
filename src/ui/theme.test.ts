import { describe, expect, it } from "vitest";
import { ASCII_FALLBACK, ICONS } from "./icons.js";
import { createTheme } from "./theme.js";

describe("createTheme", () => {
	it("returns color-on theme when color is enabled", () => {
		const t = createTheme({ color: true });
		expect(t.primary("x")).not.toBe("x");
		expect(t.dim("x")).not.toBe("x");
	});

	it("returns identity functions when color is disabled", () => {
		const t = createTheme({ color: false });
		expect(t.primary("x")).toBe("x");
		expect(t.dim("x")).toBe("x");
		expect(t.success("x")).toBe("x");
	});

	it("resolves icon glyph based on color mode", () => {
		expect(createTheme({ color: true }).icon("brand")).toBe(ICONS.brand);
		expect(createTheme({ color: false }).icon("brand")).toBe(ASCII_FALLBACK.brand);
	});
});

describe("ICONS vs ASCII_FALLBACK", () => {
	it("has an ASCII fallback for every icon", () => {
		for (const key of Object.keys(ICONS) as (keyof typeof ICONS)[]) {
			expect(ASCII_FALLBACK[key]).toBeDefined();
		}
	});
});

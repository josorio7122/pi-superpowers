import { describe, expect, it } from "vitest";
import { progressBar, spinnerFrame } from "./progress.js";

describe("progressBar", () => {
	it("renders all filled at 100%", () => {
		expect(progressBar({ current: 5, total: 5, width: 5, color: false })).toBe("▰▰▰▰▰");
	});
	it("renders all empty at 0%", () => {
		expect(progressBar({ current: 0, total: 5, width: 5, color: false })).toBe("▱▱▱▱▱");
	});
	it("renders mixed at 60%", () => {
		expect(progressBar({ current: 3, total: 5, width: 5, color: false })).toBe("▰▰▰▱▱");
	});
	it("clamps current to [0, total]", () => {
		expect(progressBar({ current: 10, total: 5, width: 5, color: false })).toBe("▰▰▰▰▰");
		expect(progressBar({ current: -1, total: 5, width: 5, color: false })).toBe("▱▱▱▱▱");
	});
	it("handles total=0 without NaN", () => {
		expect(progressBar({ current: 0, total: 0, width: 5, color: false })).toBe("▱▱▱▱▱");
	});
	it("uses ASCII fallback when ascii=true", () => {
		expect(progressBar({ current: 3, total: 5, width: 5, color: false, ascii: true })).toBe("###..");
	});
});

describe("spinnerFrame", () => {
	it("cycles through 8 braille frames by tick", () => {
		const f0 = spinnerFrame(0, { color: false });
		const f7 = spinnerFrame(7, { color: false });
		const f8 = spinnerFrame(8, { color: false });
		expect(f0).not.toBe(f7);
		expect(f0).toBe(f8);
	});
	it("uses ASCII frames when ascii=true", () => {
		expect(spinnerFrame(0, { color: false, ascii: true })).toBe("|");
	});
});

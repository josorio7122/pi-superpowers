import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("widget marker e2e", () => {
	it("superpowers_todo add triggers widget-set marker with lineCount > 0", async () => {
		const result = await runPiE2E({
			prompt: 'Use superpowers_todo to add a todo with content "hi there", then briefly confirm.',
			timeoutMs: 120_000,
		});
		try {
			const widgets = result.markers.filter((m) => m.name === "widget-set");
			expect(widgets.length).toBeGreaterThan(0);
			const withItems = widgets.find((w) => (w.payload as { lineCount: number }).lineCount > 0);
			expect(withItems).toBeDefined();
		} finally {
			await result.cleanup();
		}
	}, 180_000);
});

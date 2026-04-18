import { describe, expect, it } from "vitest";
import { runPiE2EWithRetry } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("superpowers_todo round-trip e2e", () => {
	it("add → add → complete preserves non-empty state after complete", async () => {
		const result = await runPiE2EWithRetry(
			{
				prompt: [
					"Do this in three steps, calling the tool each time:",
					'1. Call superpowers_todo with {"action":"add","content":"alpha"}.',
					'2. Call superpowers_todo with {"action":"add","content":"beta"}.',
					'3. Call superpowers_todo with {"action":"complete","id":"1"}.',
					"Then print the final panel you received.",
				].join("\n"),
				timeoutMs: 300_000,
			},
			{
				attempts: 3,
				// Before fix: step 3 saw empty state and returned an error (with the guard)
				// or a zero-item panel (without). After fix: final widget-set marker has
				// lineCount > 0 because 'beta' is still pending and 'alpha' is completed.
				check: (r) => {
					const widgets = r.markers.filter((m) => m.name === "widget-set");
					if (widgets.length < 2) return false;
					const last = widgets[widgets.length - 1];
					if (!last) return false;
					return (last.payload as { lineCount: number }).lineCount > 0;
				},
			},
		);
		try {
			const widgets = result.markers.filter((m) => m.name === "widget-set");
			expect(widgets.length).toBeGreaterThanOrEqual(2);
			const last = widgets[widgets.length - 1];
			expect((last?.payload as { lineCount: number }).lineCount).toBeGreaterThan(0);
		} finally {
			await result.cleanup();
		}
	}, 900_000);
});

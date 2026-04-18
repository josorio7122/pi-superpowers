import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("superpowers_todo tool e2e", () => {
	it("model calls the tool and adds an item end-to-end", async () => {
		const result = await runPiE2E({
			prompt:
				'Use the superpowers_todo tool to add an item with content "write e2e tests", then briefly confirm it was added.',
			timeoutMs: 120_000,
		});
		try {
			const hasToolReference = result.stdout.includes("superpowers_todo") || result.stdout.includes("write e2e tests");
			expect(hasToolReference).toBe(true);
			// Widget-set marker is an unconditional side-effect whenever the tool runs.
			const widget = result.markers.find((m) => m.name === "widget-set");
			expect(widget).toBeDefined();
		} finally {
			await result.cleanup();
		}
	}, 180_000);
});

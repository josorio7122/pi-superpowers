import { describe, expect, it } from "vitest";
import { runPiE2EWithRetry } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("superpowers_todo tool e2e", () => {
	it("model calls the tool and adds an item end-to-end", async () => {
		const result = await runPiE2EWithRetry(
			{
				prompt:
					'You MUST call the superpowers_todo tool with action "add" and content "write e2e tests". Then confirm.',
				timeoutMs: 120_000,
			},
			{
				attempts: 3,
				check: (r) => r.markers.some((m) => m.name === "widget-set"),
			},
		);
		try {
			const widget = result.markers.find((m) => m.name === "widget-set");
			expect(widget).toBeDefined();
		} finally {
			await result.cleanup();
		}
	}, 360_000);
});

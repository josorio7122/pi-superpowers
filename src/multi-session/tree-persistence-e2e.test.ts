import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("todo state persistence across session loads", () => {
	it("superpowers_todo action=list in an isolated session returns a result + widget marker", async () => {
		const result = await runPiE2E({
			prompt: 'Use the superpowers_todo tool with action "list". Print what you got.',
			timeoutMs: 120_000,
		});
		try {
			const widget = result.markers.find((m) => m.name === "widget-set");
			expect(widget).toBeDefined();
		} finally {
			await result.cleanup();
		}
	}, 180_000);
});

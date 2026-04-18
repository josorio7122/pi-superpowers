import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("skill broadcast e2e", () => {
	it("initial system prompt includes at least 5 of the bundled superpowers skill names", async () => {
		const result = await runPiE2E({
			prompt: "List all the skills available to you. Answer with their names separated by commas.",
			timeoutMs: 90_000,
		});
		try {
			const expected = [
				"brainstorming",
				"writing-plans",
				"executing-plans",
				"subagent-driven-development",
				"test-driven-development",
				"systematic-debugging",
				"finishing-a-development-branch",
				"using-superpowers",
			];
			const lower = result.stdout.toLowerCase();
			let found = 0;
			for (const s of expected) if (lower.includes(s)) found += 1;
			expect(found).toBeGreaterThanOrEqual(5);
		} finally {
			await result.cleanup();
		}
	}, 120_000);
});

import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("superpowers_subagent single e2e", () => {
	it("dispatches the code-reviewer agent end-to-end (marker observed)", async () => {
		const result = await runPiE2E({
			prompt:
				'Use the superpowers_subagent tool with input { agent: "code-reviewer", task: "Reply with exactly: ok." }. Then briefly mention what you got back.',
			timeoutMs: 240_000,
		});
		try {
			const dispatch = result.markers.find((m) => m.name === "subagent-dispatched");
			expect(dispatch).toBeDefined();
			expect((dispatch?.payload as { mode: string }).mode).toBe("single");
		} finally {
			await result.cleanup();
		}
	}, 300_000);
});

import { describe, expect, it } from "vitest";
import { runPiE2EWithRetry } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("superpowers_subagent single e2e", () => {
	it("dispatches the code-reviewer agent end-to-end (marker observed)", async () => {
		const result = await runPiE2EWithRetry(
			{
				prompt:
					'You MUST call the superpowers_subagent tool with input { "agent": "code-reviewer", "task": "Reply with exactly: ok." }. Then briefly mention what you got back.',
				timeoutMs: 240_000,
			},
			{
				attempts: 3,
				check: (r) => r.markers.some((m) => m.name === "subagent-dispatched"),
			},
		);
		try {
			const dispatch = result.markers.find((m) => m.name === "subagent-dispatched");
			expect(dispatch).toBeDefined();
			expect((dispatch?.payload as { mode: string }).mode).toBe("single");
		} finally {
			await result.cleanup();
		}
	}, 720_000);
});

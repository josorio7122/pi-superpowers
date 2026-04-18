import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("superpowers_subagent parallel e2e", () => {
	it("dispatches two agents in parallel", async () => {
		const result = await runPiE2E({
			prompt:
				'Call superpowers_subagent with { tasks: [ { agent: "code-reviewer", task: "say ok" }, { agent: "code-reviewer", task: "say done" } ] }. Then print both results.',
			timeoutMs: 240_000,
		});
		try {
			const dispatch = result.markers.find((m) => m.name === "subagent-dispatched");
			expect((dispatch?.payload as { mode: string }).mode).toBe("parallel");
		} finally {
			await result.cleanup();
		}
	}, 300_000);
});

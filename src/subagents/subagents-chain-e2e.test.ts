import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("superpowers_subagent chain e2e", () => {
	it("runs two-step chain with {previous} substitution", async () => {
		const result = await runPiE2E({
			prompt:
				'Call superpowers_subagent with { chain: [ { agent: "code-reviewer", task: "output exactly: banana" }, { agent: "code-reviewer", task: "echo back: {previous}" } ] }.',
			timeoutMs: 240_000,
		});
		try {
			const dispatch = result.markers.find((m) => m.name === "subagent-dispatched");
			expect((dispatch?.payload as { mode: string }).mode).toBe("chain");
		} finally {
			await result.cleanup();
		}
	}, 300_000);
});

import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("status marker e2e", () => {
	it("session_start triggers a status-set marker", async () => {
		const result = await runPiE2E({ prompt: "ok" });
		try {
			const status = result.markers.find((m) => m.name === "status-set");
			expect(status).toBeDefined();
			expect((status?.payload as { text: string }).text).toContain("Superpowers");
		} finally {
			await result.cleanup();
		}
	}, 90_000);
});

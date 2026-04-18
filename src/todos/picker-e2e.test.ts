import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

// /todos only runs in interactive mode. In --mode json -p the command no-ops.
// This test asserts the extension load does not crash when /todos is registered.
describeIfPi("todos /command registration e2e", () => {
	it("extension load succeeds and session reaches session_start when /todos command is registered", async () => {
		const result = await runPiE2E({ prompt: "ok" });
		try {
			// status-set marker only fires from session_start — proves extension fully loaded
			// past the /todos command registration.
			const status = result.markers.find((m) => m.name === "status-set");
			expect(status).toBeDefined();
		} finally {
			await result.cleanup();
		}
	}, 90_000);
});

import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("bootstrap inject e2e", () => {
  it("first-turn session writes the bootstrap-inject marker", async () => {
    const result = await runPiE2E({ prompt: "ok" });
    try {
      const inject = result.markers.find((m) => m.name === "bootstrap-inject");
      expect(inject).toBeDefined();
    } finally {
      await result.cleanup();
    }
  }, 90_000);
});

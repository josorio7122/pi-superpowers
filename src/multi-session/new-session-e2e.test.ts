import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("bootstrap re-injects across new sessions", () => {
  it("first invocation injects", async () => {
    const result = await runPiE2E({ prompt: "ok" });
    try {
      expect(result.markers.find((m) => m.name === "bootstrap-inject")).toBeDefined();
    } finally {
      await result.cleanup();
    }
  }, 90_000);

  it("second invocation also injects (independent session)", async () => {
    const result = await runPiE2E({ prompt: "ok" });
    try {
      expect(result.markers.find((m) => m.name === "bootstrap-inject")).toBeDefined();
    } finally {
      await result.cleanup();
    }
  }, 90_000);
});

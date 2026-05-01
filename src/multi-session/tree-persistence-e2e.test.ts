import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("todo state persistence across session loads", () => {
  it("task_list in an isolated session returns without error", async () => {
    const result = await runPiE2E({
      prompt: "Use the task_list tool to list tasks. Print what you got.",
      timeoutMs: 120_000,
    });
    try {
      expect(result.stderr).not.toMatch(/Unknown tool|tool error/i);
    } finally {
      await result.cleanup();
    }
  }, 180_000);
});

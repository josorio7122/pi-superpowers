import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("todo widget persistence", () => {
  it("after adding a todo, at least one widget-set marker has lineCount > 0", async () => {
    const result = await runPiE2E({
      prompt: 'Use the task tool to add a task with content "survive compaction test", then finish.',
      timeoutMs: 120_000,
    });
    try {
      const widgets = result.markers.filter((m) => m.name === "widget-set");
      expect(widgets.some((w) => (w.payload as { lineCount: number }).lineCount > 0)).toBe(true);
    } finally {
      await result.cleanup();
    }
  }, 180_000);
});

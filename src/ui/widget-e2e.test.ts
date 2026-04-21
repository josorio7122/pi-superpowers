import { describe, expect, it } from "vitest";
import { runPiE2EWithRetry } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("widget marker e2e", () => {
  it("task add triggers widget-set marker with lineCount > 0", async () => {
    const result = await runPiE2EWithRetry(
      {
        prompt: 'You MUST call the task tool with action "add" and content "hi there". Then briefly confirm.',
        timeoutMs: 120_000,
      },
      {
        attempts: 3,
        check: (r) =>
          r.markers.some((m) => m.name === "widget-set" && (m.payload as { lineCount: number }).lineCount > 0),
      },
    );
    try {
      const widgets = result.markers.filter((m) => m.name === "widget-set");
      expect(widgets.length).toBeGreaterThan(0);
      const withItems = widgets.find((w) => (w.payload as { lineCount: number }).lineCount > 0);
      expect(withItems).toBeDefined();
    } finally {
      await result.cleanup();
    }
  }, 360_000);
});

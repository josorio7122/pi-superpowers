import { describe, expect, it } from "vitest";
import { runPiE2EWithRetry } from "../common/e2e-runner.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

describeIfPi("widget marker e2e", () => {
  it("task_create emits a task-event marker with kind=create", async () => {
    const result = await runPiE2EWithRetry(
      {
        prompt:
          'You MUST call the task_create tool with subject "hi there" and description "smoke test". Then briefly confirm.',
        timeoutMs: 120_000,
      },
      {
        attempts: 3,
        check: (r) =>
          r.markers.some((m) => m.name === "task-event" && (m.payload as { kind: string }).kind === "create"),
      },
    );
    try {
      const events = result.markers.filter((m) => m.name === "task-event");
      expect(events.length).toBeGreaterThan(0);
      const created = events.find((e) => (e.payload as { kind: string }).kind === "create");
      expect(created).toBeDefined();
    } finally {
      await result.cleanup();
    }
  }, 360_000);
});

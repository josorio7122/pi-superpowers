import { describe, expect, it } from "vitest";
import { runPiE2E } from "../common/e2e-runner.js";

const ENABLED = Boolean(process.env.PI_BIN) && process.env.E2E_FULL === "1";
const describeIfFull = ENABLED ? describe : describe.skip;

describeIfFull("todo widget persistence", () => {
  it("after task_create, at least one task-event marker has kind=create", async () => {
    const result = await runPiE2E({
      prompt:
        'Use task_create to add a task with subject "survive compaction test" and description "persistence smoke test", then finish.',
      timeoutMs: 120_000,
    });
    try {
      const events = result.markers.filter((m) => m.name === "task-event");
      expect(events.some((e) => (e.payload as { kind: string }).kind === "create")).toBe(true);
    } finally {
      await result.cleanup();
    }
  }, 180_000);
});

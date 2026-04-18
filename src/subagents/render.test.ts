import { describe, expect, it } from "vitest";
import { createTheme } from "../ui/theme.js";
import { type RunResult, renderMultiResult, renderSingleResult, renderSubagentCallHeader } from "./render.js";

const theme = createTheme({ color: false });

function success(name: string, text = "ok"): RunResult {
	return { name, text, metrics: { inTok: 10, outTok: 5, durationMs: 1200, usd: 0.01, toolCalls: 3 } };
}

describe("renderSubagentCallHeader", () => {
	it("renders `● superpowers_subagent(<arg>)`", () => {
		const line = renderSubagentCallHeader({ mode: "single", primaryArg: 'code-reviewer: "review"', theme });
		expect(line).toContain("superpowers_subagent(");
		expect(line).toContain('code-reviewer: "review"');
	});
});

describe("renderSingleResult", () => {
	it("running → branch with running text", () => {
		const running: RunResult = { name: "x", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 800 } };
		const lines = renderSingleResult({
			result: running,
			primaryArg: 'x: "t"',
			theme,
			width: 80,
			running: true,
			spinnerTick: 0,
		});
		expect(lines).toHaveLength(2);
		expect((lines[1] ?? "").toLowerCase()).toContain("running");
	});

	it("done → branch with ✓ done · metrics + indented body", () => {
		const lines = renderSingleResult({
			result: success("r", "final assistant text"),
			primaryArg: 'r: "t"',
			theme,
			width: 80,
		});
		expect(lines.some((l) => l.includes("✓ done"))).toBe(true);
		expect(lines.some((l) => l.includes("final assistant text"))).toBe(true);
	});

	it("error → branch with ✗ error: <msg>", () => {
		const err: RunResult = { name: "x", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 0 }, error: "boom" };
		const lines = renderSingleResult({ result: err, primaryArg: 'x: "t"', theme, width: 80 });
		expect(lines).toHaveLength(2);
		expect(lines[1] ?? "").toContain("✗ error: boom");
	});

	it("cancelled → branch with ⏸ cancelled", () => {
		const c: RunResult = { name: "x", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 0 }, cancelled: true };
		const lines = renderSingleResult({ result: c, primaryArg: 'x: "t"', theme, width: 80 });
		expect(lines).toHaveLength(2);
		expect((lines[1] ?? "").toLowerCase()).toContain("cancelled");
	});
});

describe("renderMultiResult", () => {
	it("parallel with all done renders N result branches + total", () => {
		const results = [success("backend"), success("frontend"), success("tests")];
		const lines = renderMultiResult({
			mode: "parallel",
			results,
			planned: 3,
			primaryArg: "parallel: 3 tasks",
			theme,
			width: 80,
		});
		expect(lines[0]).toContain("parallel: 3 tasks");
		expect(lines.filter((l) => l.includes("✓")).length).toBeGreaterThanOrEqual(3);
		expect(lines.some((l) => l.includes("total ·"))).toBe(true);
	});

	it("partial (some queued) renders queued placeholder", () => {
		const lines = renderMultiResult({
			mode: "parallel",
			results: [success("a")],
			planned: 3,
			primaryArg: "parallel: 3 tasks",
			theme,
			width: 80,
		});
		expect(lines.some((l) => l.toLowerCase().includes("queued"))).toBe(true);
	});

	it("chain renders steps in order", () => {
		const lines = renderMultiResult({
			mode: "chain",
			results: [success("scout"), success("planner")],
			planned: 3,
			primaryArg: "chain: 3 steps",
			theme,
			width: 80,
		});
		expect(lines[0]).toContain("chain: 3 steps");
		expect(lines.some((l) => l.includes("scout"))).toBe(true);
		expect(lines.some((l) => l.includes("planner"))).toBe(true);
	});
});

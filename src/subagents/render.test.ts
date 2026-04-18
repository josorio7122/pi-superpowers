import { describe, expect, it } from "vitest";
import { createTheme } from "../ui/theme.js";
import type { RunResult } from "./dispatch.js";
import { renderMultiResult, renderSingleResult, renderSubagentCallHeader } from "./render.js";

const theme = createTheme({ color: false });

function success(name: string, text = "ok"): RunResult {
	return { name, text, metrics: { inTok: 10, outTok: 5, durationMs: 1200, usd: 0.01, toolCalls: 3 } };
}

describe("renderSubagentCallHeader", () => {
	it("renders icon, agent label, and mode", () => {
		const h = renderSubagentCallHeader({ mode: "single", agentLabel: "code-reviewer", theme });
		expect(h).toContain("[AGENT]");
		expect(h).toContain("code-reviewer");
		expect(h).toContain("single");
	});

	it("appends duration and tokens when provided", () => {
		const h = renderSubagentCallHeader({
			mode: "single",
			agentLabel: "x",
			durationMs: 2345,
			tokensSoFar: 1234,
			theme,
		});
		expect(h).toContain("2.3s");
		expect(h).toContain("1,234 tok");
	});
});

describe("renderSingleResult", () => {
	it("renders panel with title=agent name, ok badge, metrics footer", () => {
		const out = renderSingleResult({ result: success("reviewer"), width: 60, theme });
		expect(out[0]).toContain("reviewer");
		expect(out[0]).toContain("OK");
		expect(out.some((l) => l.includes("1.2s") && l.includes("10 in"))).toBe(true);
	});

	it("shows error state", () => {
		const out = renderSingleResult({
			result: { name: "r", text: "", metrics: { inTok: 0, outTok: 0, durationMs: 0 }, error: "failed" },
			width: 60,
			theme,
		});
		expect(out[0]).toContain("X");
	});
});

describe("renderMultiResult", () => {
	it("parallel shows all rows with completed glyph and progress badge", () => {
		const results = [success("backend"), success("frontend")];
		const out = renderMultiResult({ mode: "parallel", results, planned: 3, width: 80, theme });
		expect(out[0]).toContain("parallel (3)");
		expect(out[0]).toContain("2/3");
		expect(out.some((l) => l.includes("backend"))).toBe(true);
		expect(out.some((l) => l.includes("queued"))).toBe(true);
	});

	it("chain shows step order with agent names", () => {
		const results = [success("scout"), success("planner")];
		const out = renderMultiResult({ mode: "chain", results, planned: 3, width: 80, theme });
		expect(out[0]).toContain("chain (3)");
		expect(out.some((l) => l.includes("scout"))).toBe(true);
		expect(out.some((l) => l.includes("planner"))).toBe(true);
	});
});

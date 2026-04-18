import { describe, expect, it, vi } from "vitest";
import { aggregateMetrics, dispatchChain, dispatchParallel, dispatchSingle, type RunAgentFn } from "./dispatch.js";
import type { RunConfig } from "./transform.js";

function cfg(name: string, task = "t"): RunConfig {
	return { name, systemPrompt: "sp", task, tools: ["read"], modelHint: "inherit" };
}

function okRun(text: string): RunAgentFn {
	return vi.fn(async () => ({
		text,
		metrics: { inTok: 10, outTok: 5, durationMs: 100, usd: 0.001, toolCalls: 1 },
	}));
}

describe("dispatchSingle", () => {
	it("returns text + metrics on success", async () => {
		const run = okRun("hello");
		const res = await dispatchSingle({ runAgent: run, config: cfg("a") });
		expect(res.text).toBe("hello");
		expect(res.metrics.inTok).toBe(10);
		expect(res.cancelled).toBeUndefined();
	});

	it("returns error state on throw", async () => {
		const run = vi.fn(async () => {
			throw new Error("boom");
		});
		const res = await dispatchSingle({ runAgent: run, config: cfg("a") });
		expect(res.error).toBe("boom");
	});

	it("returns cancelled state on AbortError", async () => {
		const run = vi.fn(async () => {
			const e = new Error("aborted");
			e.name = "AbortError";
			throw e;
		});
		const res = await dispatchSingle({ runAgent: run, config: cfg("a") });
		expect(res.cancelled).toBe(true);
	});
});

describe("dispatchParallel", () => {
	it("runs all configs and returns results array", async () => {
		const run = okRun("r");
		const res = await dispatchParallel({ runAgent: run, configs: [cfg("a"), cfg("b")] });
		expect(res).toHaveLength(2);
		expect(res[0]?.name).toBe("a");
		expect(res[1]?.name).toBe("b");
	});
});

describe("dispatchChain", () => {
	it("runs sequentially and substitutes {previous}", async () => {
		const run: RunAgentFn = vi.fn(async ({ config }) => ({
			text: `got:${config.task}`,
			metrics: { inTok: 1, outTok: 1, durationMs: 10 },
		}));
		const res = await dispatchChain({
			runAgent: run,
			configs: [cfg("s", "scout"), cfg("p", "plan using {previous}")],
		});
		expect(res[0]?.text).toBe("got:scout");
		expect(res[1]?.text).toBe("got:plan using got:scout");
	});

	it("stops on error", async () => {
		const run: RunAgentFn = vi
			.fn()
			.mockResolvedValueOnce({ text: "ok", metrics: { inTok: 0, outTok: 0, durationMs: 0 } })
			.mockRejectedValueOnce(new Error("boom"));
		const res = await dispatchChain({ runAgent: run, configs: [cfg("a"), cfg("b"), cfg("c")] });
		expect(res).toHaveLength(2);
		expect(res[1]?.error).toBe("boom");
	});
});

describe("aggregateMetrics", () => {
	it("sums tokens, usd, toolCalls and takes max duration", () => {
		const agg = aggregateMetrics([
			{ name: "a", text: "", metrics: { inTok: 10, outTok: 5, durationMs: 100, usd: 0.01, toolCalls: 2 } },
			{ name: "b", text: "", metrics: { inTok: 20, outTok: 3, durationMs: 250, usd: 0.02, toolCalls: 1 } },
		]);
		expect(agg.inTok).toBe(30);
		expect(agg.outTok).toBe(8);
		expect(agg.durationMs).toBe(250);
		expect(agg.usd).toBeCloseTo(0.03);
		expect(agg.toolCalls).toBe(3);
	});
});

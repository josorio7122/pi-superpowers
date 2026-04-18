import { describe, expect, it, vi } from "vitest";
import type { RunAgentFn } from "./dispatch.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";
import { executeSubagent } from "./tool.js";

const agents: AgentFrontmatterLike[] = [
	{ name: "code-reviewer", body: "You review code." },
	{ name: "scout", body: "You scout." },
];

function okRun(text: string): RunAgentFn {
	return vi.fn(async () => ({
		text,
		metrics: { inTok: 10, outTok: 5, durationMs: 100, usd: 0.01, toolCalls: 1 },
	}));
}

describe("executeSubagent", () => {
	it("single mode returns panel with agent content and metrics", async () => {
		const runAgent = okRun("review passed");
		const out = await executeSubagent({
			input: { agent: "code-reviewer", task: "review step 2" },
			agents,
			runAgent,
			ctx: { ui: { colorEnabled: false, width: 80 } },
		});
		expect(out.content[0]?.text).toContain("code-reviewer");
		expect(out.content[0]?.text).toContain("review passed");
		expect(out.details.mode).toBe("single");
	});

	it("returns clear error on unknown agent name", async () => {
		const out = await executeSubagent({
			input: { agent: "nope", task: "x" },
			agents,
			runAgent: okRun(""),
			ctx: { ui: { colorEnabled: false, width: 60 } },
		});
		expect(out.content[0]?.text.toLowerCase()).toContain("unknown agent");
	});

	it("parallel mode dispatches all and reports per-row results", async () => {
		const runAgent = okRun("done");
		const out = await executeSubagent({
			input: {
				tasks: [
					{ agent: "code-reviewer", task: "a" },
					{ agent: "scout", task: "b" },
				],
			},
			agents,
			runAgent,
			ctx: { ui: { colorEnabled: false, width: 80 } },
		});
		expect(out.content[0]?.text).toContain("parallel (2)");
		expect(out.content[0]?.text).toContain("code-reviewer");
		expect(out.content[0]?.text).toContain("scout");
	});

	it("chain mode passes previous result into next task", async () => {
		const runAgent: RunAgentFn = vi.fn(async ({ config }) => ({
			text: `echo:${config.task}`,
			metrics: { inTok: 1, outTok: 1, durationMs: 10 },
		}));
		const out = await executeSubagent({
			input: {
				chain: [
					{ agent: "scout", task: "find" },
					{ agent: "code-reviewer", task: "review {previous}" },
				],
			},
			agents,
			runAgent,
			ctx: { ui: { colorEnabled: false, width: 80 } },
		});
		expect(out.content[0]?.text).toContain("chain (2)");
		expect(runAgent).toHaveBeenCalledTimes(2);
	});

	it("rejects invalid input", async () => {
		const out = await executeSubagent({
			input: { foo: "bar" },
			agents,
			runAgent: okRun(""),
			ctx: { ui: { colorEnabled: false, width: 60 } },
		});
		expect(out.details.error).toBeDefined();
	});
});

import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { AgentFrontmatterLike } from "./frontmatter.js";
import { type ExecuteSubagentProps, executeSubagent, type PiAgentsApi } from "./tool.js";

const agents: AgentFrontmatterLike[] = [
	{ name: "code-reviewer", body: "You review code." },
	{ name: "scout", body: "You scout." },
];

async function mockCtx() {
	const sessionDir = await mkdtemp(join(tmpdir(), "pisup-tool-"));
	return {
		ui: { colorEnabled: false, width: 80 },
		cwd: "/tmp/cwd",
		sessionDir,
		modelRegistry: {} as never,
	};
}

function okAgentsApi(): PiAgentsApi {
	const runAgent = vi.fn(async (params: { task: string }) => ({
		output: `ok:${params.task}`,
		metrics: { inputTokens: 10, outputTokens: 5, durationMs: 100, cost: 0.01, toolCalls: [] },
	}));
	const executeSingle = vi.fn(async (params: { task: string; runAgent: (p: { task: string }) => Promise<unknown> }) => {
		return (await params.runAgent({ task: params.task })) as { output: string; metrics: unknown };
	});
	const executeParallel = vi.fn(
		async (params: { tasks: Array<{ task: string; runAgent: (p: { task: string }) => Promise<unknown> }> }) => {
			return Promise.all(
				params.tasks.map(async (t) => (await t.runAgent({ task: t.task })) as { output: string; metrics: unknown }),
			);
		},
	);
	const executeChain = vi.fn(
		async (params: { tasks: Array<{ task: string; runAgent: (p: { task: string }) => Promise<unknown> }> }) => {
			const results: Array<{ output: string; metrics: unknown }> = [];
			for (const t of params.tasks) {
				results.push((await t.runAgent({ task: t.task })) as { output: string; metrics: unknown });
			}
			return results;
		},
	);
	return { runAgent, executeSingle, executeParallel, executeChain } as unknown as PiAgentsApi;
}

async function baseProps(api: PiAgentsApi, input: unknown): Promise<ExecuteSubagentProps> {
	return { input, agents, ctx: await mockCtx(), piAgentsApi: api };
}

describe("executeSubagent single", () => {
	it("dispatches and returns rendered panel with mode=single", async () => {
		const api = okAgentsApi();
		const out = await executeSubagent(await baseProps(api, { agent: "code-reviewer", task: "review" }));
		expect(out.content[0]?.text).toContain("code-reviewer");
		expect(out.details.mode).toBe("single");
	});

	it("returns clear error on unknown agent", async () => {
		const api = okAgentsApi();
		const out = await executeSubagent(await baseProps(api, { agent: "nope", task: "t" }));
		expect(out.content[0]?.text.toLowerCase()).toContain("unknown agent");
	});
});

describe("executeSubagent parallel", () => {
	it("calls executeParallel with N tasks", async () => {
		const api = okAgentsApi();
		const out = await executeSubagent(
			await baseProps(api, {
				tasks: [
					{ agent: "code-reviewer", task: "a" },
					{ agent: "scout", task: "b" },
				],
			}),
		);
		expect(out.details.mode).toBe("parallel");
	});
});

describe("executeSubagent chain", () => {
	it("calls executeChain with steps in order", async () => {
		const api = okAgentsApi();
		const out = await executeSubagent(
			await baseProps(api, {
				chain: [
					{ agent: "scout", task: "find" },
					{ agent: "code-reviewer", task: "review {previous}" },
				],
			}),
		);
		expect(out.details.mode).toBe("chain");
	});
});

describe("executeSubagent errors", () => {
	it("rejects invalid input shape", async () => {
		const api = okAgentsApi();
		const out = await executeSubagent(await baseProps(api, { foo: "bar" }));
		expect(out.details.error).toBeDefined();
	});
});

import { describe, expect, it } from "vitest";
import type { PiAgentConfig } from "./agent-config-builder.js";
import { type MakeRunAgentProps, makeRunAgent, type PiAgentsRunAgent } from "./run-agent-factory.js";

function fakeAgentConfig(): PiAgentConfig {
	return {
		frontmatter: {
			name: "r",
			description: "d",
			model: "anthropic/claude-sonnet-4-5",
			role: "worker",
			color: "#f5a623",
			icon: "🦸",
			domain: [{ path: ".", read: true, write: true, delete: false }],
			tools: ["read"],
			skills: [],
			knowledge: {
				project: { path: "/tmp/p.md", description: "p", updatable: true, "max-lines": 500 },
				general: { path: "/tmp/g.md", description: "g", updatable: true, "max-lines": 500 },
			},
			conversation: { path: "/tmp/c-{{SESSION_ID}}.jsonl" },
		},
		systemPrompt: "You review.",
		filePath: "vendor/.../r.md",
		source: "user",
	};
}

function makeProps(runAgent: PiAgentsRunAgent): MakeRunAgentProps {
	return {
		runAgent,
		agentConfig: fakeAgentConfig(),
		cwd: "/tmp/cwd",
		sessionDir: "/tmp/sess",
		conversationLogPath: "/tmp/sess/c.jsonl",
		modelRegistry: {} as never,
	};
}

describe("makeRunAgent", () => {
	it("returns a function that forwards task to pi-agents.runAgent", async () => {
		const seen: Array<{ task: string; agentConfig: unknown; cwd: string }> = [];
		const inner: PiAgentsRunAgent = async (params) => {
			seen.push({ task: params.task, agentConfig: params.agentConfig, cwd: params.cwd });
			return { output: "ok", metrics: {} };
		};
		const run = makeRunAgent(makeProps(inner));
		await run({ task: "hello" });
		expect(seen).toHaveLength(1);
		expect(seen[0]?.task).toBe("hello");
		expect(seen[0]?.agentConfig).toBeDefined();
		expect(seen[0]?.cwd).toBe("/tmp/cwd");
	});

	it("propagates onMetrics callback as onUpdate", async () => {
		const inner: PiAgentsRunAgent = async (params) => {
			params.onUpdate?.({ tokens: 5 });
			return { output: "", metrics: {} };
		};
		const run = makeRunAgent(makeProps(inner));
		const seen: unknown[] = [];
		await run({
			task: "t",
			onMetrics: (m) => {
				seen.push(m);
			},
		});
		expect(seen).toEqual([{ tokens: 5 }]);
	});

	it("passes signal when present in factory props", async () => {
		let seenSignal: AbortSignal | undefined;
		const inner: PiAgentsRunAgent = async (params) => {
			seenSignal = params.signal;
			return { output: "", metrics: {} };
		};
		const ac = new AbortController();
		const run = makeRunAgent({ ...makeProps(inner), signal: ac.signal });
		await run({ task: "t" });
		expect(seenSignal).toBe(ac.signal);
	});
});

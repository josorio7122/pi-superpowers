import type { AgentConfig } from "pi-agents";
import { describe, expect, it } from "vitest";
import { buildSuperpowersSubagentTool } from "./subagent-tool.js";

function fakeConfig(name: string): AgentConfig {
	return {
		frontmatter: {
			name,
			description: `desc for ${name}`,
			model: "openai-codex/gpt-5.4",
			role: "worker",
			color: "#f5a623",
			icon: "🦸",
			domain: [{ path: ".", read: true, write: true, delete: false }],
			tools: ["read", "bash"],
			skills: [{ path: "vendor/superpowers/skills/using-superpowers/SKILL.md", when: "always" }],
			knowledge: {
				project: { path: "/tmp/p.md", description: "p", updatable: true, "max-lines": 500 },
				general: { path: "/tmp/g.md", description: "g", updatable: true, "max-lines": 500 },
			},
			conversation: { path: "/tmp/{{SESSION_ID}}.jsonl" },
		},
		systemPrompt: "body",
		filePath: `vendor/superpowers/agents/${name}.md`,
		source: "user",
	};
}

describe("buildSuperpowersSubagentTool", () => {
	it("returns a tool named superpowers_subagent with label Subagent", () => {
		const tool = buildSuperpowersSubagentTool({
			agents: [fakeConfig("code-reviewer")],
			modelRegistry: {} as never,
			cwd: "/tmp",
			sessionDir: "/tmp/session",
			conversationLogPath: "/tmp/session/log.jsonl",
		});
		expect(tool.name).toBe("superpowers_subagent");
		expect(tool.label).toBe("Subagent");
	});

	it("preserves execute, renderCall, renderResult from pi-agents createAgentTool", () => {
		const tool = buildSuperpowersSubagentTool({
			agents: [fakeConfig("code-reviewer")],
			modelRegistry: {} as never,
			cwd: "/tmp",
			sessionDir: "/tmp/session",
			conversationLogPath: "/tmp/session/log.jsonl",
		});
		expect(typeof tool.execute).toBe("function");
		expect(typeof tool.renderCall).toBe("function");
		expect(typeof tool.renderResult).toBe("function");
	});
});

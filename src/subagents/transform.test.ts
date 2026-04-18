import { describe, expect, it } from "vitest";
import type { AgentFrontmatterLike } from "./frontmatter.js";
import { buildRunConfig } from "./transform.js";

function agent(overrides: Partial<AgentFrontmatterLike> = {}): AgentFrontmatterLike {
	return {
		name: "code-reviewer",
		body: "You review code.",
		...overrides,
	};
}

describe("buildRunConfig", () => {
	it("appends pi runtime note to body", () => {
		const cfg = buildRunConfig({ agent: agent(), task: "review step 2" });
		expect(cfg.systemPrompt).toContain("You review code.");
		expect(cfg.systemPrompt).toContain("Pi runtime note");
	});

	it("uses agent tools when defined", () => {
		const cfg = buildRunConfig({ agent: agent({ tools: ["read", "grep"] }), task: "t" });
		expect(cfg.tools).toEqual(["read", "grep"]);
	});

	it("falls back to default tools when none specified", () => {
		const cfg = buildRunConfig({ agent: agent(), task: "t" });
		expect(cfg.tools).toContain("read");
		expect(cfg.tools).toContain("bash");
	});

	it("uses empty tool list fallback to defaults", () => {
		const cfg = buildRunConfig({ agent: agent({ tools: [] }), task: "t" });
		expect(cfg.tools.length).toBeGreaterThan(0);
	});

	it("passes through modelHint or defaults to inherit", () => {
		expect(buildRunConfig({ agent: agent(), task: "t" }).modelHint).toBe("inherit");
		expect(buildRunConfig({ agent: agent({ model: "opus" }), task: "t" }).modelHint).toBe("opus");
	});

	it("forwards task and name", () => {
		const cfg = buildRunConfig({ agent: agent(), task: "my task" });
		expect(cfg.task).toBe("my task");
		expect(cfg.name).toBe("code-reviewer");
	});
});

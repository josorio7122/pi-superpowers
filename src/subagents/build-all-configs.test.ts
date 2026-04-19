import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { buildAllAgentConfigs } from "./build-all-configs.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

let tmp: string;

beforeEach(async () => {
	tmp = await mkdtemp(join(tmpdir(), "pi-configs-"));
});

describe("buildAllAgentConfigs", () => {
	it("returns an empty array when no agents are provided", async () => {
		const result = await buildAllAgentConfigs({ agents: [], sessionDir: tmp });
		expect(result.configs).toEqual([]);
		expect(result.diagnostics).toEqual([]);
	});

	it("builds a validated AgentConfig per agent", async () => {
		const agents: AgentFrontmatterLike[] = [
			{ name: "code-reviewer", body: "You are a reviewer." },
			{ name: "general-purpose", body: "You are a worker." },
		];
		const result = await buildAllAgentConfigs({ agents, sessionDir: tmp });
		expect(result.configs).toHaveLength(2);
		expect(result.configs.map((c) => c.frontmatter.name).sort()).toEqual(["code-reviewer", "general-purpose"]);
		expect(result.diagnostics).toEqual([]);
	});

	it("records diagnostics for agents that fail pi-agents validation", async () => {
		// Empty body — validator rejects "Missing system prompt body".
		const agents: AgentFrontmatterLike[] = [{ name: "broken", body: "" }];
		const result = await buildAllAgentConfigs({ agents, sessionDir: tmp });
		expect(result.configs).toHaveLength(0);
		expect(result.diagnostics).toHaveLength(1);
		expect(result.diagnostics[0]?.message).toMatch(/system prompt/i);
	});
});

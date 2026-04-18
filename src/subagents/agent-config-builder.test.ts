import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type BuildCtx, buildAgentConfig } from "./agent-config-builder.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

async function tmpSession(): Promise<string> {
	return mkdtemp(join(tmpdir(), "pisup-sess-"));
}

function upstream(overrides: Partial<AgentFrontmatterLike> = {}): AgentFrontmatterLike {
	return { name: "code-reviewer", body: "You review code.", ...overrides };
}

async function ctx(): Promise<BuildCtx> {
	return { sessionDir: await tmpSession() };
}

describe("buildAgentConfig defaults", () => {
	it("synthesizes role, color, icon when upstream omits them", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.frontmatter.role).toBe("worker");
		expect(cfg.frontmatter.color).toBe("#f5a623");
		expect(cfg.frontmatter.icon).toBe("🦸");
	});

	it("synthesizes domain with cwd read+write and no-delete", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.frontmatter.domain).toEqual([{ path: ".", read: true, write: true, delete: false }]);
	});

	it("falls back to default tool set when upstream has no tools", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.frontmatter.tools).toEqual(["read", "write", "edit", "bash", "grep", "glob"]);
	});

	it("uses upstream tools when provided", async () => {
		const cfg = await buildAgentConfig(upstream({ tools: ["read", "grep"] }), await ctx());
		expect(cfg.frontmatter.tools).toEqual(["read", "grep"]);
	});

	it("sets skills to empty array", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.frontmatter.skills).toEqual([]);
	});

	it("sets conversation.path with {{SESSION_ID}} token and agent name", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.frontmatter.conversation.path).toContain("{{SESSION_ID}}");
		expect(cfg.frontmatter.conversation.path).toContain("code-reviewer");
	});
});

describe("buildAgentConfig model resolution", () => {
	it("passes through upstream model when valid format", async () => {
		const cfg = await buildAgentConfig(upstream({ model: "anthropic/claude-opus-4" }), await ctx());
		expect(cfg.frontmatter.model).toBe("anthropic/claude-opus-4");
	});

	it("resolves 'inherit' to pinned default openai-codex/gpt-5.4 (NOT ctx.modelId)", async () => {
		const cfg = await buildAgentConfig(upstream({ model: "inherit" }), await ctx());
		expect(cfg.frontmatter.model).toBe("openai-codex/gpt-5.4");
	});

	it("resolves missing upstream model to pinned default", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.frontmatter.model).toBe("openai-codex/gpt-5.4");
	});

	it("SUPERPOWERS_AGENT_MODEL env var overrides pinned default", async () => {
		process.env.SUPERPOWERS_AGENT_MODEL = "anthropic/claude-sonnet-4-5";
		try {
			const cfg = await buildAgentConfig(upstream({ model: "inherit" }), await ctx());
			expect(cfg.frontmatter.model).toBe("anthropic/claude-sonnet-4-5");
		} finally {
			delete process.env.SUPERPOWERS_AGENT_MODEL;
		}
	});

	it("SUPERPOWERS_AGENT_MODEL env var overrides explicit upstream model too", async () => {
		process.env.SUPERPOWERS_AGENT_MODEL = "anthropic/claude-opus-4";
		try {
			const cfg = await buildAgentConfig(upstream({ model: "openai-codex/gpt-4o" }), await ctx());
			expect(cfg.frontmatter.model).toBe("anthropic/claude-opus-4");
		} finally {
			delete process.env.SUPERPOWERS_AGENT_MODEL;
		}
	});

	it("throws on invalid SUPERPOWERS_AGENT_MODEL format", async () => {
		process.env.SUPERPOWERS_AGENT_MODEL = "bogus";
		try {
			await expect(buildAgentConfig(upstream({ model: "inherit" }), await ctx())).rejects.toThrow(
				/invalid SUPERPOWERS_AGENT_MODEL/i,
			);
		} finally {
			delete process.env.SUPERPOWERS_AGENT_MODEL;
		}
	});

	it("throws when upstream model doesn't match provider/model format and isn't 'inherit'", async () => {
		await expect(buildAgentConfig(upstream({ model: "bogus" }), await ctx())).rejects.toThrow();
	});
});

describe("buildAgentConfig knowledge stubs", () => {
	it("creates knowledge stub files under sessionDir/superpowers/", async () => {
		const sessionDir = await tmpSession();
		const cfg = await buildAgentConfig(upstream(), { sessionDir });
		const projectPath = cfg.frontmatter.knowledge.project.path;
		const generalPath = cfg.frontmatter.knowledge.general.path;
		expect(projectPath.startsWith(sessionDir)).toBe(true);
		expect(generalPath.startsWith(sessionDir)).toBe(true);
		const p = await readFile(projectPath, "utf8");
		const g = await readFile(generalPath, "utf8");
		expect(typeof p).toBe("string");
		expect(typeof g).toBe("string");
	});

	it("is idempotent — second call does not fail if files exist", async () => {
		const c = await ctx();
		await buildAgentConfig(upstream(), c);
		await expect(buildAgentConfig(upstream(), c)).resolves.toBeDefined();
	});
});

describe("buildAgentConfig result shape", () => {
	it("returns systemPrompt equal to upstream body", async () => {
		const cfg = await buildAgentConfig(upstream({ body: "Hello world." }), await ctx());
		expect(cfg.systemPrompt).toBe("Hello world.");
	});

	it("sets source='user' and filePath pointer", async () => {
		const cfg = await buildAgentConfig(upstream(), await ctx());
		expect(cfg.source).toBe("user");
		expect(cfg.filePath).toContain("code-reviewer");
	});
});

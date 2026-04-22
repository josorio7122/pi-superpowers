import { describe, expect, it } from "vitest";
import type { VendorSkill } from "../skills/scan.js";
import { type BuildCtx, buildAgentConfig } from "./agent-config-builder.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

function upstream(overrides: Partial<AgentFrontmatterLike> = {}): AgentFrontmatterLike {
  return { name: "code-reviewer", body: "You review code.", ...overrides };
}

const fakeSkills: VendorSkill[] = [
  { name: "brainstorming", path: "/abs/skills/brainstorming/SKILL.md", description: "Explore ideas" },
  { name: "test-driven-development", path: "/abs/skills/tdd/SKILL.md", description: "TDD" },
];

const ctx: BuildCtx = { sessionDir: "/tmp/s", skills: fakeSkills };

describe("buildAgentConfig defaults", () => {
  it("produces minimal PiAgentConfig with pi-default tools and all vendor skill paths", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    expect(cfg.frontmatter.name).toBe("code-reviewer");
    expect(cfg.frontmatter.description).toBe("code-reviewer");
    expect(cfg.frontmatter.color).toBe("#f5a623");
    expect(cfg.frontmatter.icon).toBe("🦸");
    expect(cfg.frontmatter.tools).toEqual(["read", "bash", "edit", "write"]);
    expect(cfg.frontmatter.skills).toEqual(["/abs/skills/brainstorming/SKILL.md", "/abs/skills/tdd/SKILL.md"]);
  });

  it("uses upstream description when provided", () => {
    const cfg = buildAgentConfig(upstream({ description: "Review completed work" }), ctx);
    expect(cfg.frontmatter.description).toBe("Review completed work");
  });

  it("returns systemPrompt equal to upstream body", () => {
    const cfg = buildAgentConfig(upstream({ body: "Hello world." }), ctx);
    expect(cfg.systemPrompt).toBe("Hello world.");
  });

  it("sets source='user' and filePath pointing into vendor/superpowers/agents", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    expect(cfg.source).toBe("user");
    expect(cfg.filePath).toBe("vendor/superpowers/agents/code-reviewer.md");
  });
});

describe("buildAgentConfig tools", () => {
  it("falls back to pi's default tool set when upstream has no tools", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    expect(cfg.frontmatter.tools).toEqual(["read", "bash", "edit", "write"]);
  });

  it("uses upstream tools when provided", () => {
    const cfg = buildAgentConfig(upstream({ tools: ["read", "grep"] }), ctx);
    expect(cfg.frontmatter.tools).toEqual(["read", "grep"]);
  });

  it("falls back to default when upstream tools is empty array", () => {
    const cfg = buildAgentConfig(upstream({ tools: [] }), ctx);
    expect(cfg.frontmatter.tools).toEqual(["read", "bash", "edit", "write"]);
  });
});

describe("buildAgentConfig skills", () => {
  it("filters declared skills to matching vendor skill paths", () => {
    const cfg = buildAgentConfig(upstream({ skills: ["brainstorming"] }), ctx);
    expect(cfg.frontmatter.skills).toEqual(["/abs/skills/brainstorming/SKILL.md"]);
  });

  it("silently drops unknown declared skill names", () => {
    const cfg = buildAgentConfig(upstream({ skills: ["unknown-name"] }), ctx);
    expect(cfg.frontmatter.skills).toEqual([]);
  });

  it("falls back to all vendor skill paths when upstream skills absent", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    expect(cfg.frontmatter.skills).toEqual(["/abs/skills/brainstorming/SKILL.md", "/abs/skills/tdd/SKILL.md"]);
  });

  it("skills contains absolute paths", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    expect(cfg.frontmatter.skills.every((p) => p.startsWith("/"))).toBe(true);
  });
});

describe("buildAgentConfig model resolution", () => {
  it("passes through upstream 'inherit' sentinel", () => {
    const cfg = buildAgentConfig(upstream({ model: "inherit" }), ctx);
    expect(cfg.frontmatter.model).toBe("inherit");
  });

  it("omits model field entirely when upstream model absent", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    expect(Object.hasOwn(cfg.frontmatter, "model")).toBe(false);
  });

  it("passes through upstream model when valid 'provider/model'", () => {
    const cfg = buildAgentConfig(upstream({ model: "anthropic/claude-sonnet-4-6" }), ctx);
    expect(cfg.frontmatter.model).toBe("anthropic/claude-sonnet-4-6");
  });

  it("SUPERPOWERS_AGENT_MODEL env var overrides upstream", () => {
    process.env.SUPERPOWERS_AGENT_MODEL = "anthropic/claude-opus-4";
    try {
      const cfg = buildAgentConfig(upstream({ model: "inherit" }), ctx);
      expect(cfg.frontmatter.model).toBe("anthropic/claude-opus-4");
    } finally {
      delete process.env.SUPERPOWERS_AGENT_MODEL;
    }
  });

  it("SUPERPOWERS_AGENT_MODEL env var overrides absent upstream model too", () => {
    process.env.SUPERPOWERS_AGENT_MODEL = "anthropic/claude-opus-4";
    try {
      const cfg = buildAgentConfig(upstream(), ctx);
      expect(cfg.frontmatter.model).toBe("anthropic/claude-opus-4");
    } finally {
      delete process.env.SUPERPOWERS_AGENT_MODEL;
    }
  });

  it("throws on invalid SUPERPOWERS_AGENT_MODEL format", () => {
    process.env.SUPERPOWERS_AGENT_MODEL = "bogus";
    try {
      expect(() => buildAgentConfig(upstream({ model: "inherit" }), ctx)).toThrow(/invalid SUPERPOWERS_AGENT_MODEL/i);
    } finally {
      delete process.env.SUPERPOWERS_AGENT_MODEL;
    }
  });
});

describe("buildAgentConfig does not emit removed fields", () => {
  it("output frontmatter contains no domain, knowledge, role, reports, conversation, or conversationLogPath", () => {
    const cfg = buildAgentConfig(upstream(), ctx);
    const fm = cfg.frontmatter as Record<string, unknown>;
    expect(fm.domain).toBeUndefined();
    expect(fm.knowledge).toBeUndefined();
    expect(fm.role).toBeUndefined();
    expect(fm.reports).toBeUndefined();
    expect(fm.conversation).toBeUndefined();
    expect(fm.conversationLogPath).toBeUndefined();
  });
});

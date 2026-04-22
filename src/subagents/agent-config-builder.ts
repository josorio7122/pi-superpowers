import type { VendorSkill } from "../skills/scan.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

export type PiAgentConfig = {
  frontmatter: {
    name: string;
    description: string;
    model?: string;
    color: string;
    icon: string;
    tools: string[];
    skills: string[];
  };
  systemPrompt: string;
  filePath: string;
  source: "project" | "user";
};

export type BuildCtx = {
  sessionDir: string;
  skills: ReadonlyArray<VendorSkill>;
};

// Pi's active default tool set — matches @mariozechner/pi-coding-agent dist/core/sdk.js:139.
const DEFAULT_TOOLS: readonly string[] = ["read", "bash", "edit", "write"];
const MODEL_FORMAT = /^.+\/.+$/;

function resolveModel(upstream: string | undefined): string | undefined {
  const override = process.env.SUPERPOWERS_AGENT_MODEL;
  if (override) {
    if (!MODEL_FORMAT.test(override)) {
      throw new Error(`invalid SUPERPOWERS_AGENT_MODEL '${override}' — expected 'provider/model' format`);
    }
    return override;
  }
  return upstream;
}

function resolveSkillsForAgent(upstream: AgentFrontmatterLike, all: readonly VendorSkill[]): string[] {
  const declared = upstream.skills;
  if (!declared || declared.length === 0) return all.map((s) => s.path);
  const byName = new Map(all.map((s) => [s.name, s.path]));
  return declared.map((name) => byName.get(name)).filter((p): p is string => p !== undefined);
}

export function buildAgentConfig(upstream: AgentFrontmatterLike, ctx: BuildCtx): PiAgentConfig {
  const tools = upstream.tools && upstream.tools.length > 0 ? [...upstream.tools] : [...DEFAULT_TOOLS];
  const model = resolveModel(upstream.model);

  return {
    frontmatter: {
      name: upstream.name,
      description: upstream.description ?? upstream.name,
      ...(model !== undefined ? { model } : {}),
      color: "#f5a623",
      icon: "🦸",
      tools,
      skills: resolveSkillsForAgent(upstream, ctx.skills),
    },
    systemPrompt: upstream.body,
    filePath: `vendor/superpowers/agents/${upstream.name}.md`,
    source: "user",
  };
}

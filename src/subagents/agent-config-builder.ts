import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileExists } from "../common/fs.js";
import type { VendorSkill } from "../skills/scan.js";
import type { AgentFrontmatterLike } from "./frontmatter.js";

export type PiAgentConfig = {
  frontmatter: {
    name: string;
    description: string;
    model: string;
    role: "worker" | "lead" | "orchestrator";
    color: string;
    icon: string;
    domain: Array<{ path: string; read: boolean; write: boolean; delete: boolean }>;
    tools: string[];
    skills: Array<{ path: string; when: string }>;
    knowledge: {
      project: { path: string; description: string; updatable: boolean; "max-lines": number };
      general: { path: string; description: string; updatable: boolean; "max-lines": number };
    };
    conversation: { path: string };
  };
  systemPrompt: string;
  filePath: string;
  source: "project" | "user";
};

export type BuildCtx = {
  sessionDir: string;
  skills: ReadonlyArray<VendorSkill>;
};

const DEFAULT_TOOLS = ["read", "write", "edit", "bash", "grep", "glob"];
const MODEL_FORMAT = /^.+\/.+$/;
const PINNED_DEFAULT_MODEL = "openai-codex/gpt-5.4";

function resolveModel(upstream: string | undefined): string {
  // Env var overrides everything.
  const override = process.env.SUPERPOWERS_AGENT_MODEL;
  if (override) {
    if (!MODEL_FORMAT.test(override)) {
      throw new Error(`invalid SUPERPOWERS_AGENT_MODEL '${override}' — expected 'provider/model' format`);
    }
    return override;
  }
  // Upstream 'inherit' or missing → pinned default.
  const value = upstream ?? "inherit";
  if (value === "inherit") return PINNED_DEFAULT_MODEL;
  // Explicit upstream must be valid 'provider/model'.
  if (!MODEL_FORMAT.test(value)) {
    throw new Error(`invalid model '${value}' — expected 'provider/model' format`);
  }
  return value;
}

async function ensureStubFile(path: string, description: string): Promise<void> {
  if (await fileExists(path)) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `# ${description}\n\n(empty stub — safe to fill)\n`);
}

export async function buildAgentConfig(upstream: AgentFrontmatterLike, ctx: BuildCtx): Promise<PiAgentConfig> {
  const superpowersDir = join(ctx.sessionDir, "superpowers");
  const projectPath = join(superpowersDir, `${upstream.name}-project.md`);
  const generalPath = join(superpowersDir, `${upstream.name}-general.md`);
  await ensureStubFile(projectPath, `Project context for ${upstream.name}`);
  await ensureStubFile(generalPath, `General knowledge for ${upstream.name}`);

  const tools = upstream.tools && upstream.tools.length > 0 ? upstream.tools : DEFAULT_TOOLS;
  const model = resolveModel(upstream.model);
  const description = upstream.description ?? upstream.name;

  return {
    frontmatter: {
      name: upstream.name,
      description,
      model,
      role: "worker",
      color: "#f5a623",
      icon: "🦸",
      domain: [{ path: ".", read: true, write: true, delete: false }],
      tools,
      skills: ctx.skills.map((s) => ({ path: s.path, when: s.description || "always" })),
      knowledge: {
        project: {
          path: projectPath,
          description: `Project context for ${upstream.name}`,
          updatable: true,
          "max-lines": 500,
        },
        general: {
          path: generalPath,
          description: `General knowledge for ${upstream.name}`,
          updatable: true,
          "max-lines": 500,
        },
      },
      conversation: {
        path: join(superpowersDir, `${upstream.name}-{{SESSION_ID}}.jsonl`),
      },
    },
    systemPrompt: upstream.body,
    filePath: `vendor/superpowers/agents/${upstream.name}.md`,
    source: "user",
  };
}

import matter from "gray-matter";

export type AgentFrontmatterLike = {
  name: string;
  description?: string;
  tools?: string[];
  model?: string;
  body: string;
};

function normalizeTools(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

export function parseAgentMarkdown(source: string): AgentFrontmatterLike | null {
  const parsed = matter(source);
  const fm = parsed.data as Record<string, unknown>;
  const name = typeof fm.name === "string" ? fm.name.trim() : "";
  if (!name) return null;
  const result: AgentFrontmatterLike = {
    name,
    body: parsed.content.trim(),
  };
  if (typeof fm.description === "string") result.description = fm.description;
  const tools = normalizeTools(fm.tools);
  if (tools) result.tools = tools;
  if (typeof fm.model === "string") result.model = fm.model;
  return result;
}

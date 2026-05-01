// Single source of truth for Claude Code → pi tool name mapping.
// Used by bootstrap addendum and (optionally) runtime guards.

export const TOOL_MAPPING = {
  Read: "read",
  Write: "write",
  Edit: "edit",
  Bash: "bash",
  Grep: "grep",
  Glob: "glob",
  TodoWrite: ["task_create", "task_update", "task_list", "task_get"],
  Task: "agent",
} as const;

export type ClaudeCodeToolName = keyof typeof TOOL_MAPPING;

function renderValue(v: string | readonly string[]): string {
  return Array.isArray(v) ? v.map((n) => `\`${n}\``).join(" / ") : `\`${v}\``;
}

export function renderToolMappingMarkdown(): string {
  const rows = (Object.keys(TOOL_MAPPING) as ClaudeCodeToolName[])
    .map((cc) => `| \`${cc}\` | ${renderValue(TOOL_MAPPING[cc])} |`)
    .join("\n");
  return [
    "| Claude Code | pi equivalent |",
    "|---|---|",
    rows,
    "",
    "`TodoWrite` maps to four V2 tools: `task_create` (new task), `task_update` (status / fields), `task_list` (read all), `task_get` (one by id).",
    "",
    "To load a skill listed in `<available_skills>`, use `read` on the absolute path shown in its `<location>` element (that path always ends in `/SKILL.md`).",
  ].join("\n");
}

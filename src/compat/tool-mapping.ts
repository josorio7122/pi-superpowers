// Single source of truth for Claude Code → pi tool name mapping.
// Used by bootstrap addendum and (optionally) runtime guards.

export const TOOL_MAPPING = {
	Read: "read",
	Write: "write",
	Edit: "edit",
	Bash: "bash",
	Grep: "grep",
	Glob: "glob",
	TodoWrite: "task",
	Task: "agent",
	Skill: "/skill:name (pi-native)",
} as const;

export type ClaudeCodeToolName = keyof typeof TOOL_MAPPING;

export function renderToolMappingMarkdown(): string {
	const rows = (Object.keys(TOOL_MAPPING) as ClaudeCodeToolName[])
		.map((cc) => `| \`${cc}\` | \`${TOOL_MAPPING[cc]}\` |`)
		.join("\n");
	return [
		"| Claude Code | pi equivalent |",
		"|---|---|",
		rows,
		"",
		"Load any skill on demand with `/skill:name` (e.g. `/skill:brainstorming`).",
	].join("\n");
}

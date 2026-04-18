// Placeholder during the dispatch→pi-agents migration (Tasks 3-6).
// Rewritten in Task 6 to use pi-agents.executeSingle/Parallel/Chain.

export type SubagentToolCtx = {
	ui: { colorEnabled?: boolean; width?: number };
	signal?: AbortSignal;
};

export type SubagentToolResult = {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
};

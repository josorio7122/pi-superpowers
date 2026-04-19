// Thin pi extension entrypoint. v5.4: createAgentTool from pi-agents.

import { createAgentTool } from "pi-agents";
import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildCommandHandler } from "./commands/handler.js";
import { loadCommands } from "./commands/loader.js";
import { vendorRoot } from "./common/paths.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { buildAllAgentConfigs } from "./subagents/build-all-configs.js";
import { loadAgents } from "./subagents/loader.js";
import { TodoToolParamsSchema } from "./todos/schema.js";
import { reconstructTodos, type SessionEntryLike } from "./todos/state.js";
import { executeTodos } from "./todos/tool.js";
import { renderTodosWidget } from "./ui/compact-todo.js";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";
import { createTheme } from "./ui/theme.js";
import { setWidget } from "./ui/widget.js";

type ExtensionAPI = {
	on: (event: string, handler: (...args: unknown[]) => unknown) => void;
	registerTool: (tool: unknown) => void;
	registerCommand: (name: string, spec: unknown) => void;
};

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
	const { agents } = await loadAgents();

	const inject = buildInjectHandler({
		subagentAvailable: true,
		availableAgents: agents.map((a) => a.name),
	});
	const discover = buildResourcesDiscoverHandler();

	pi.on("before_agent_start", inject as never);
	pi.on("resources_discover", discover as never);

	const commands = await loadCommands(vendorRoot());
	for (const cmd of commands) {
		pi.registerCommand(cmd.name, {
			description: cmd.description,
			handler: buildCommandHandler(cmd) as unknown as (args: string, ctx: unknown) => Promise<void>,
		});
	}

	pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
		setSuperpowersStatus(ctx as never, { text: "Superpowers · v5.4.1 · 14 skills · subagents" });
		setTimeout(() => {
			clearSuperpowersStatus(ctx as never);
		}, 3000);
	}) as never);

	// Re-apply the todo widget after compaction so it survives /compact.
	pi.on("session_compact", (async (_event: unknown, ctx: unknown) => {
		const anyCtx = ctx as {
			sessionManager: { getEntries: () => SessionEntryLike[] };
			ui: { colorEnabled?: boolean; width?: number };
		};
		const items = reconstructTodos(anyCtx.sessionManager.getEntries());
		if (items.length === 0) return;
		const theme = createTheme({ color: anyCtx.ui.colorEnabled !== false });
		const width = anyCtx.ui.width ?? 80;
		const widgetLines = renderTodosWidget({ items, theme, width });
		setWidget(anyCtx as never, { name: "todos", lines: widgetLines });
	}) as never);

	pi.registerTool({
		name: "superpowers_todo",
		label: "Todos",
		description:
			"Track session-scoped tasks. Actions: `add`, `replace`, `update`, `complete`, `remove`, `clear`, `list`. " +
			"Every task has `content` (static imperative form, e.g. 'Build login flow') and `activeForm` " +
			"(present-continuous, e.g. 'Building login flow…'). The widget shows activeForm in its header " +
			"while the task is in_progress, so always provide both when adding or updating. " +
			"Discipline (match Claude Code TodoWrite): (1) Before starting work on a task, call `update` with `status: 'in_progress'`. " +
			"(2) Only ONE task may be `in_progress` at a time — finish or park the current one before flipping another. " +
			"(3) Call `complete` (or `update` with `status: 'completed'`) the moment a task is finished — don't batch. " +
			"(4) Break large tasks into smaller sub-tasks if you can't commit to finishing in one go.",
		parameters: TodoToolParamsSchema,
		// biome-ignore lint/complexity/useMaxParams: pi's tool execute signature is fixed at 5 params
		execute: (_toolCallId: string, params: unknown, _signal: unknown, _onUpdate: unknown, ctx: unknown) =>
			executeTodos(ctx as never, params),
	});

	// Register superpowers_subagent once sessionDir is known (session_start).
	pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
		const anyCtx = ctx as {
			cwd: string;
			sessionManager: { getSessionDir: () => string };
			modelRegistry: unknown;
		};
		const sessionDir = anyCtx.sessionManager.getSessionDir();
		const { configs, diagnostics } = await buildAllAgentConfigs({ agents, sessionDir });
		for (const d of diagnostics) {
			console.error(`[superpowers] agent validation ${d.level}: ${d.filePath}: ${d.message}`);
		}
		const base = createAgentTool({
			agents: configs,
			modelRegistry: anyCtx.modelRegistry as never,
			cwd: anyCtx.cwd,
			sessionDir,
			conversationLogPath: `${sessionDir}/superpowers/dispatch.jsonl`,
		});
		pi.registerTool({ ...base, name: "superpowers_subagent", label: "Subagent" });
	}) as never);
}

// Thin pi extension entrypoint. v5.1: no feature flags; pi-agents is a hard peer dep.

import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildCommandHandler } from "./commands/handler.js";
import { loadCommands } from "./commands/loader.js";
import { vendorRoot } from "./common/paths.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { loadAgents } from "./subagents/loader.js";
import { SubagentToolParamsSchema } from "./subagents/schema.js";
import { executeSubagent, type PiAgentsApi } from "./subagents/tool.js";
import { buildTodosCommandHandler } from "./todos/command.js";
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

async function loadPiAgents(): Promise<PiAgentsApi> {
	const mod = (await import("pi-agents")) as unknown as Partial<PiAgentsApi>;
	if (
		typeof mod.runAgent !== "function" ||
		typeof mod.executeSingle !== "function" ||
		typeof mod.executeParallel !== "function" ||
		typeof mod.executeChain !== "function"
	) {
		throw new Error(
			"pi-superpowers v5.1 requires pi-agents to be installed. Run: pi install git:github.com/josorio7122/pi-agents",
		);
	}
	return mod as PiAgentsApi;
}

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
	const piAgentsApi = await loadPiAgents();
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
		setSuperpowersStatus(ctx as never, { text: "Superpowers · v5.1.0 · 15 skills · subagents" });
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
			"Track session-scoped todos. Actions: add, replace, update, complete, remove, clear, list. See the action param schema for the shape each action expects.",
		parameters: TodoToolParamsSchema,
		// biome-ignore lint/complexity/useMaxParams: pi's tool execute signature is fixed at 5 params
		execute: (_toolCallId: string, params: unknown, _signal: unknown, _onUpdate: unknown, ctx: unknown) =>
			executeTodos(ctx as never, params),
	});

	pi.registerCommand("todos", {
		description: "Open the interactive todos picker",
		handler: buildTodosCommandHandler(),
	});

	pi.registerTool({
		name: "superpowers_subagent",
		label: "Subagent",
		description:
			"Dispatch a named superpowers agent via pi-agents. Modes: single {agent,task}, parallel {tasks:[...]}, chain {chain:[...]}.",
		parameters: SubagentToolParamsSchema,
		// biome-ignore lint/complexity/useMaxParams: pi's tool execute signature is fixed at 5 params
		execute: (_toolCallId: string, params: unknown, signal: unknown, _onUpdate: unknown, ctx: unknown) => {
			const anyCtx = ctx as {
				ui: { colorEnabled?: boolean; width?: number };
				cwd: string;
				sessionManager: { getSessionDir: () => string };
				modelRegistry: unknown;
			};
			return executeSubagent({
				input: params,
				agents,
				piAgentsApi,
				ctx: {
					ui: anyCtx.ui,
					cwd: anyCtx.cwd,
					sessionDir: anyCtx.sessionManager.getSessionDir(),
					modelRegistry: anyCtx.modelRegistry,
					...(signal instanceof AbortSignal ? { signal } : {}),
				},
			});
		},
	});
}

// Thin pi extension entrypoint. Registers event handlers, tools, and commands.

import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import type { RunAgentFn } from "./subagents/dispatch.js";
import { loadAgents } from "./subagents/loader.js";
import { executeSubagent } from "./subagents/tool.js";
import { buildTodosCommandHandler } from "./todos/command.js";
import { executeTodos } from "./todos/tool.js";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";

type ExtensionAPI = {
	on: (event: string, handler: (...args: unknown[]) => unknown) => void;
	registerTool: (tool: unknown) => void;
	registerCommand: (name: string, spec: unknown) => void;
};

type PiAgentsModule = {
	runAgent: RunAgentFn;
};

async function loadPiAgents(): Promise<PiAgentsModule | null> {
	try {
		// Import via `as unknown` — pi-agents' runAgent has a richer signature than we model;
		// a production integration will adapt AgentConfig in a follow-up. For now the tool
		// is gated behind the presence of `runAgent` but we do not attempt to call it from
		// auto-registered code paths without that adapter. Tests inject a mock.
		const mod = (await import("pi-agents")) as unknown as { runAgent?: RunAgentFn };
		if (typeof mod.runAgent !== "function") return null;
		return { runAgent: mod.runAgent };
	} catch {
		return null;
	}
}

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
	const piAgents = await loadPiAgents();
	const subagentAvailable = piAgents !== null;

	const inject = buildInjectHandler({ subagentAvailable });
	const discover = buildResourcesDiscoverHandler();

	pi.on("before_agent_start", inject as never);
	pi.on("resources_discover", discover as never);

	pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
		const variant = subagentAvailable ? "15 skills · subagents" : "15 skills";
		setSuperpowersStatus(ctx as never, { text: `Superpowers · v5.0.9 · ${variant}` });
		setTimeout(() => {
			clearSuperpowersStatus(ctx as never);
		}, 3000);
	}) as never);

	pi.registerTool({
		name: "superpowers_todo",
		description: "Track session-scoped todos with replace/add/update/complete/remove/clear/list actions.",
		// biome-ignore lint/complexity/useMaxParams: pi's tool execute signature is fixed at 5 params
		execute: (_toolCallId: string, params: unknown, _signal: unknown, _onUpdate: unknown, ctx: unknown) =>
			executeTodos(ctx as never, params),
	});

	pi.registerCommand("todos", {
		description: "Open the interactive todos picker",
		handler: buildTodosCommandHandler(),
	});

	if (piAgents) {
		const { agents } = await loadAgents();
		pi.registerTool({
			name: "superpowers_subagent",
			description:
				"Dispatch a named superpowers agent via pi-agents. Supports single ({agent,task}), parallel ({tasks:[...]}), and chain ({chain:[...]}) modes.",
			// biome-ignore lint/complexity/useMaxParams: pi's tool execute signature is fixed at 5 params
			execute: (_toolCallId: string, params: unknown, signal: unknown, _onUpdate: unknown, ctx: unknown) =>
				executeSubagent({
					input: params,
					agents,
					runAgent: piAgents.runAgent,
					ctx: { ...(ctx as { ui?: unknown }), signal: signal as AbortSignal | undefined } as never,
				}),
		});
	}
}

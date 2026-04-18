// Thin pi extension entrypoint. Registers event handlers, tools, and commands.
//
// Feature-flag gates (v5.0.10):
// - SUPERPOWERS_SUBAGENT_ENABLED=1    → register superpowers_subagent tool.
//                                        Requires pi-agents v5.1 integration adapter (see
//                                        docs/specs/2026-04-23-subagents-v5.1-design.md).
//                                        Off by default; v5.0.10 does not ship the adapter.
// - SUPERPOWERS_TODOS_PICKER_ENABLED=1 → register /todos interactive command.
//                                        Requires a pi-tui Component implementation
//                                        (see v5.1 design). Off by default; v5.0.10 only
//                                        ships the superpowers_todo tool itself (fully
//                                        functional), not the interactive picker command.

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
		const mod = (await import("pi-agents")) as unknown as { runAgent?: RunAgentFn };
		if (typeof mod.runAgent !== "function") return null;
		return { runAgent: mod.runAgent };
	} catch {
		return null;
	}
}

function flagEnabled(name: string): boolean {
	return process.env[name] === "1";
}

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
	const subagentFlagEnabled = flagEnabled("SUPERPOWERS_SUBAGENT_ENABLED");
	const piAgents = subagentFlagEnabled ? await loadPiAgents() : null;
	const subagentAvailable = piAgents !== null;

	const inject = buildInjectHandler({ subagentAvailable });
	const discover = buildResourcesDiscoverHandler();

	pi.on("before_agent_start", inject as never);
	pi.on("resources_discover", discover as never);

	pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
		const variant = subagentAvailable ? "15 skills · subagents" : "15 skills";
		setSuperpowersStatus(ctx as never, { text: `Superpowers · v5.0.10 · ${variant}` });
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

	if (flagEnabled("SUPERPOWERS_TODOS_PICKER_ENABLED")) {
		// Interactive /todos command — requires pi-tui Component implementation (v5.1).
		pi.registerCommand("todos", {
			description: "Open the interactive todos picker",
			handler: buildTodosCommandHandler(),
		});
	}

	if (subagentFlagEnabled && piAgents) {
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

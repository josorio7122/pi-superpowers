// Thin pi extension entrypoint. Registers event handlers, tools, and commands.

import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { buildTodosCommandHandler } from "./todos/command.js";
import { executeTodos } from "./todos/tool.js";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";

type ExtensionAPI = {
	on: (event: string, handler: (...args: unknown[]) => unknown) => void;
	registerTool: (tool: unknown) => void;
	registerCommand: (name: string, spec: unknown) => void;
};

async function piAgentsAvailable(): Promise<boolean> {
	try {
		await import("pi-agents");
		return true;
	} catch {
		return false;
	}
}

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
	const subagentAvailable = await piAgentsAvailable();

	const inject = buildInjectHandler({ subagentAvailable });
	const discover = buildResourcesDiscoverHandler();

	pi.on("before_agent_start", inject as never);
	pi.on("resources_discover", discover as never);

	pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
		setSuperpowersStatus(ctx as never, { text: "Superpowers · v5.0.8 · 15 skills" });
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
}

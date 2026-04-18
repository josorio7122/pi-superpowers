// Migration in progress (Tasks 3-9): subagent dispatch is being rewritten onto pi-agents primitives.
// During this window the extension registers only the tools that still compile — Task 9 restores
// full registration including superpowers_subagent + /todos command.

import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { executeTodos } from "./todos/tool.js";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";

type ExtensionAPI = {
	on: (event: string, handler: (...args: unknown[]) => unknown) => void;
	registerTool: (tool: unknown) => void;
	registerCommand: (name: string, spec: unknown) => void;
};

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
	const inject = buildInjectHandler({ subagentAvailable: false });
	const discover = buildResourcesDiscoverHandler();

	pi.on("before_agent_start", inject as never);
	pi.on("resources_discover", discover as never);

	pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
		setSuperpowersStatus(ctx as never, { text: "Superpowers · migration in progress" });
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
}

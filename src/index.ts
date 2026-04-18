// Thin pi extension entrypoint. Registers event handlers only.

import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";

type ExtensionAPI = {
	on: (event: string, handler: (...args: unknown[]) => unknown) => void;
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
		setSuperpowersStatus(ctx as never, { text: "Superpowers · v5.0.7 · 15 skills" });
		setTimeout(() => {
			clearSuperpowersStatus(ctx as never);
		}, 3000);
	}) as never);
}

import { renderToolMappingMarkdown } from "../compat/tool-mapping.js";

export type AddendumOptions = {
	subagentAvailable: boolean;
};

export function renderPiAddendum(opts: AddendumOptions): string {
	const subagentNote = opts.subagentAvailable
		? "Use `superpowers_subagent` to dispatch named agents (single / parallel / chain)."
		: "Subagent dispatch is currently unavailable (pi-agents not installed). Skills that reference `Task` should fall back to single-session workflows.";
	return ["**Pi-specific tool mapping**", "", renderToolMappingMarkdown(), "", subagentNote].join("\n");
}

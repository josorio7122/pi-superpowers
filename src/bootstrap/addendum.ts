import { renderToolMappingMarkdown } from "../compat/tool-mapping.js";

export type AddendumOptions = {
  subagentAvailable: boolean;
  availableAgents?: string[];
};

export function renderPiAddendum(opts: AddendumOptions): string {
  const subagentNote = opts.subagentAvailable
    ? "Use the `agent` tool to dispatch named agents. Provide `{agent, task}` for single dispatch or `{tasks: [...]}` for parallel."
    : "Subagent dispatch is currently unavailable (pi-agents not installed). Skills that reference `Task` should fall back to single-session workflows.";
  const lines = ["**Pi-specific tool mapping**", "", renderToolMappingMarkdown(), "", subagentNote];

  const list = opts.availableAgents ?? [];
  if (opts.subagentAvailable && list.length > 0) {
    const names = list.map((n) => `\`${n}\``).join(", ");
    lines.push("", `**Available agents:** ${names}.`);
    lines.push("Use ONLY these names — do not invent agent names.");
    if (list.includes("general-purpose")) {
      lines.push(
        "For skill-specific workers (implementer, spec-reviewer, code-quality-reviewer, etc.), read the prompt template from the skill directory and pass its contents as the `task` argument to `general-purpose`.",
      );
    }
  }

  lines.push(
    "",
    "**Task discipline:** When working through a `task` list, flip each task to `in_progress` BEFORE you start work on it, and to `completed` the moment it's done. Keep only ONE task `in_progress` at a time.",
  );

  return lines.join("\n");
}

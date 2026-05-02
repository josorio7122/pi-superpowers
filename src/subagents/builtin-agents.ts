import type { AgentFrontmatterLike } from "./frontmatter.js";

// Agents authored by pi-superpowers (not upstream obra/superpowers). Merged in
// after upstream `agents/*.md` parsing; upstream entries with the same name
// take precedence on name collision.
//
// Philosophy: built-in subagent types referenced by upstream superpowers
// skills. Do NOT register skill prompt-template files (*-prompt.md) as
// agents — those are read by the model and passed as the `task` argument
// when dispatching. Same pattern as the upstream harness.

export const BUILTIN_AGENTS: AgentFrontmatterLike[] = [
  {
    name: "general-purpose",
    description:
      "Default worker subagent. Use when no specialized agent is named. Follows task instructions precisely with available pi tools.",
    body: [
      "You are a focused worker subagent dispatched by pi-superpowers.",
      "",
      "Complete the task described in your first user message precisely, using available pi tools",
      "(read, write, edit, bash, grep, glob). Stay on task — do not expand scope.",
      "",
      "Return a concise result. If you cannot complete the task, explain why in one paragraph",
      "and return what you have.",
      "",
      "If the parent sent you a prompt-template from a superpowers skill directory",
      "(e.g. `implementer-prompt.md`, `spec-reviewer-prompt.md`), follow its instructions",
      "as your operating manual for this task.",
    ].join("\n"),
  },
];

# pi-superpowers v5.1 — Real Subagent Dispatch (Design)

**Date:** 2026-04-23
**Status:** Research spec (design only — implementation deferred)
**Supersedes partial intent of:** `2026-04-18-pi-superpowers-design.md` §8.3

## Why this spec exists

In v5.0.9 we shipped `superpowers_subagent` tool code but could not ship it functional. The mismatch: upstream superpowers agent files have minimal CC-style frontmatter (`name / description / tools / model`) while `pi-agents.runAgent` requires a strict structured `AgentConfig` (role, color, icon, domain, skills, knowledge, conversation), plus a `modelRegistry`, `sessionDir`, and `conversationLogPath` sourced from pi's extension runtime.

In v5.0.10 we feature-flagged the tool off (`SUPERPOWERS_SUBAGENT_ENABLED`) to avoid shipping a crashing path. v5.1 is the plan to make it real.

The interactive `/todos` command is in the same boat — v5.1 covers both.

## Open questions (must answer before writing v5.1 plan)

### Q1: Where does `modelRegistry` come from in an extension?

`pi-agents.runAgent` expects `modelRegistry: ModelRegistry` imported from `@mariozechner/pi-coding-agent`. Extensions don't obviously receive it via `ctx`. Three candidates:

1. **Construct it in the extension** via `SettingsManager.load()` and a public ModelRegistry constructor — if exposed.
2. **Accept it via a new `ctx.modelRegistry` surface** — requires pi-coding-agent change.
3. **Use a pi-agents helper** that takes only `(cwd, agentConfig, task, signal, onUpdate)` and constructs the rest internally — requires pi-agents change.

**Action:** coordinate with Mario; option 3 is cleanest. Fallback option 1 likely feasible today.

### Q2: What are safe synthesized defaults for missing `AgentConfig` fields?

Upstream `code-reviewer.md` has no `role`, `color`, `icon`, `domain`, `skills`, `knowledge`, `conversation.path`. Proposed defaults:

- `role`: `"worker"` — conservative.
- `color`: `"#f5a623"` — our brand amber.
- `icon`: `"🦸"` — brand.
- `domain`: `[{ path: ".", read: true, write: false, delete: false }]` — read-only by default; deny write unless upstream specifies.
- `tools`: upstream `tools:` field if present, else `["read", "grep", "glob", "bash"]`.
- `skills`: `[]` — empty; upstream skills come from `vendor/superpowers/skills` which pi discovers globally.
- `knowledge.project / general`: reference `/dev/null`-equivalent paths or synthesized empty files under a temp dir — pi-agents **requires non-empty** per zod schema. Needs investigation: does runAgent accept synthesized knowledge stubs?
- `conversation.path`: `".pi/superpowers/{{SESSION_ID}}.jsonl"` — must include `{{SESSION_ID}}` per schema.

**Action:** prototype the transform, run against `code-reviewer`; if schema-allowed defaults don't produce a runnable agent, raise as pi-agents issue.

### Q3: Should upstream superpowers start shipping pi-agents-compatible agent files?

Long-term, perhaps. Short-term no — our contract was zero upstream edits. But if Q2 defaults prove fragile, we may need to either (a) maintain a small Pi-native `agents/overrides/*.md` dir in this repo for the handful of agents we care about, or (b) upstream a PR that adds optional richer frontmatter fields to `obra/superpowers/agents/code-reviewer.md`.

## Proposed architecture

### Delete my `src/subagents/dispatch.ts`

It reimplements `pi-agents.executeSingle/Parallel/Chain`. Drop it. Use pi-agents primitives directly.

### New module: `src/subagents/run-agent-factory.ts`

```ts
import type { AgentConfig, ModelRegistry } from "pi-agents";

export type RunAgentFactoryProps = {
  agentConfig: AgentConfig;
  cwd: string;
  sessionDir: string;
  conversationLogPath: string;
  modelRegistry: ModelRegistry;
  signal?: AbortSignal;
};

export function makeRunAgent(props: RunAgentFactoryProps): RunAgentFn {
  // Partially applies runAgent → returns the curried (task, onMetrics) → Promise shape
  // expected by executeSingle/Parallel/Chain.
  return (params) => runAgent({ ...props, task: params.task, onUpdate: params.onMetrics });
}
```

### Rewrite `src/subagents/transform.ts`

```ts
import type { AgentConfig } from "pi-agents";
import type { AgentFrontmatterLike } from "./frontmatter.js";

export function toPiAgentConfig(agent: AgentFrontmatterLike): AgentConfig {
  // Synthesize a schema-valid AgentConfig from minimal CC frontmatter.
  // Defaults from Q2. Guarded by validateAgent() at the boundary.
}
```

### Rewrite `src/subagents/tool.ts`

```ts
import { executeSingle, executeParallel, executeChain } from "pi-agents";

export async function executeSubagent(props) {
  const { mode, agents, ctx, piRuntime, input } = props;
  const runAgentFor = (name) => {
    const agent = findAgent(agents, name);
    if (!agent) throw ...;
    const agentConfig = toPiAgentConfig(agent);
    return makeRunAgent({ agentConfig, ...piRuntime });
  };
  if (mode === "single") return executeSingle({ task, runAgent: runAgentFor(agent) });
  if (mode === "parallel") return executeParallel({ tasks: [{task, runAgent: runAgentFor(agent)}, ...], maxConcurrency: 3 });
  return executeChain({ tasks: [...] });
}
```

### Wire in `src/index.ts`

- Import `runAgent` and `ModelRegistry` (or helper) from pi-agents.
- On `session_start`, capture `cwd`, `sessionDir`, `conversationLogPath` from pi ctx.
- Pass to `executeSubagent` in the tool's execute closure.

### Interactive `/todos` via pi-tui `Component`

Separate module `src/ui/todo-picker-component.ts`:

```ts
import { Component, Text, VBox } from "@mariozechner/pi-tui";

export class TodoPickerComponent extends Component {
  // Wraps the existing onPickerKey FSM (src/ui/todo-picker.ts) with a real Component.
  // Keep the FSM pure — Component is just the rendering/input adapter.
}
```

Then `buildTodosCommandHandler` calls `ctx.ui.custom<TodoItem[]>((tui, theme, keybindings, done) => new TodoPickerComponent({…}, done))`.

## E2E coverage (v5.1 done-state)

1. `subagents-e2e.test.ts` — dispatches real `code-reviewer` agent with a tiny task; asserts a `toolResult` with metrics landed.
2. `todos-picker-e2e.test.ts` — simulates `/todos` launch, stdin keystrokes (j, space, q), asserts final todo list reflects the cycle action.
3. Both E2E tests **not** gated behind opt-in env — they run whenever `PI_BIN` is set.

## Non-goals

- Subprocess dispatch mode (the earlier IMPLEMENTATION-DESIGN.md mentioned this as fallback — we skip).
- Editing upstream `obra/superpowers` agent files.
- Core `pi-agents` changes (unless Q1 forces it — if so, raise a focused PR).

## Milestone plan (when v5.1 lands)

| M | Deliverable |
|---|---|
| M1 | Answer Q1 via prototype; decide on how to source `modelRegistry`. |
| M2 | Answer Q2 via a real `runAgent` call with synthesized defaults against `code-reviewer`. |
| M3 | Rewrite `src/subagents/*` — delete `dispatch.ts`, replace `tool.ts`, update `transform.ts`. |
| M4 | Remove `SUPERPOWERS_SUBAGENT_ENABLED` gate. Ship v5.1.0. |
| M5 | `TodoPickerComponent` + remove `SUPERPOWERS_TODOS_PICKER_ENABLED` gate. Ship v5.1.1. |

## References

- pi-agents source: `/Users/josorio/Code/pi-agents/src/invocation/session.ts` (runAgent signature)
- pi-agents source: `/Users/josorio/Code/pi-agents/src/tool/modes.ts` (executeSingle/Parallel/Chain)
- pi-agents source: `/Users/josorio/Code/pi-agents/src/schema/frontmatter.ts` (AgentFrontmatterSchema)
- pi docs: `/Users/josorio/Library/pnpm/global/5/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md` (ctx.ui.custom signature)

# pi-superpowers — pi-agents Integration Notes

## Decision

`pi-superpowers` should follow a **pi-agents-first** architecture for agent execution and agent-file handling.

That means:

- use **pi-agents as a library** for agent parsing, validation, prompt assembly, conversation logging, metrics, and agent execution
- use a **thin pi-superpowers extension** to provide Superpowers-specific compatibility
- avoid re-implementing generic agent orchestration primitives that already exist in `pi-agents`

This keeps `pi-superpowers` focused on Superpowers parity instead of rebuilding a second agent runtime.

---

## What to Reuse from pi-agents

From `/Users/josorio/Code/pi-agents/src/api.ts`, the key reusable exports are:

### Agent parsing and validation
- `parseAgentFile`
- `validateAgent`
- `extractFrontmatter`
- `scanForAgentFiles`
- `AgentConfig`

### Prompt and context assembly
- `assembleSystemPrompt`
- `resolveVariables`
- `loadSkillContents`
- `discoverContextFiles`
- `ContextFile`

### Conversation and metrics
- `appendToLog`
- `ensureLogExists`
- `readLog`
- `createMetricsTracker`
- `sumMetrics`
- `AgentMetrics`

### Execution
- `runAgent`
- `RunAgentParams`
- `RunAgentResult`
- `createToolForAgent`

### Mode/orchestration helpers
- `detectMode`
- `executeSingle`
- `executeParallel`
- `executeChain`
- `aggregateMetricsArray`
- `collectAgentNames`

### Rendering
- `formatTokens`
- `formatUsageStats`
- `buildPartialEvents`
- `buildFinalEvents`
- `renderConversation`
- `RenderTheme`
- `ConversationEvent`

---

## Best Practices We Should Inherit

These come directly from `pi-agents` docs and implementation philosophy.

## 1. Functional core, impure shell

Keep:
- parsing
- mapping
- compatibility translation
- prompt composition rules
- mode resolution

as pure functions.

Keep:
- filesystem I/O
- session hooks
- process spawning
- UI notifications
- tool registration

at the extension boundary.

## 2. Zod / schema validation at the boundary

Any external markdown or config should be parsed and validated immediately.

For `pi-superpowers`, that applies to:
- upstream `agents/*.md`
- any Pi-local override agent files
- any compatibility config we add

Do not pass raw frontmatter deeper into runtime code.

## 3. Async fs I/O only

Follow the `pi-teams` convention and avoid sync fs.

Use:
- `node:fs/promises`

Avoid:
- `readFileSync`
- `readdirSync`
- `statSync`

for the new package.

## 4. Shared conversation log as extension-owned infrastructure

If we support delegated agent workflows with a shared ledger, the extension should be the only writer.

For `pi-superpowers`, this suggests:
- use `appendToLog` / `ensureLogExists`
- keep append-only semantics
- do not let agents directly mutate the shared conversation file

## 5. Explicit role/tool boundaries

`pi-agents` validates role/tool constraints. We should preserve that discipline.

For Superpowers parity this likely means:
- worker/reviewer agents may get file tools
- planner/reviewer-only agents may have reduced tool sets
- orchestration wrappers decide how much capability each delegated run gets

## 6. Reuse execution-mode helpers instead of custom orchestration logic

If possible:
- use `detectMode`
- use `executeSingle`
- use `executeParallel`
- use `executeChain`

or mirror their structure closely.

This reduces divergence in:
- validation
- concurrency control
- result aggregation
- metrics handling

## 7. Persist state in session-visible artifacts

For task/todo state and delegated output, use session-visible persistence strategies rather than hidden in-memory state only.

For `superpowers_todo`, continue using Pi best practice:
- store state in tool result `details`
- reconstruct from session branch on start/tree changes

For delegated agent output:
- store enough structured result data in tool `details` for rendering and replay

## 8. Keep extension entrypoint thin

`index.ts` should mostly:
- discover/register resources
- hook `session_start`
- hook `before_agent_start`
- register tools/commands

The real logic belongs in modules.

---

## Revised Architecture Recommendation

## Split responsibilities clearly

### `pi-agents` should own
- agent file schema
- prompt assembly
- knowledge/context injection
- conversation log helpers
- metrics tracking
- execution runtime (`runAgent`)
- mode helpers and rendering primitives

### `pi-superpowers` should own
- Superpowers bootstrap injection
- mapping Superpowers concepts onto Pi concepts
- `TodoWrite` compatibility tool (`superpowers_todo`)
- `Task` compatibility tool (`superpowers_subagent` or `superpowers_task`)
- loading bundled Superpowers agents as pi-agents-compatible agent configs
- fallback policies when a Superpowers skill assumes unavailable semantics

---

## Recommended Delegation Architecture

## Prefer library invocation over subprocess spawning where possible

The original design assumed subprocess-based subagents because Pi's example extension does that.

Given `pi-agents`, a better default is:

### Primary path
Use `runAgent()` from `pi-agents` inside the extension runtime.

Benefits:
- no shell/process management complexity
- direct access to metrics and event data
- better type safety
- easier testing
- simpler cancellation wiring
- easier structured rendering

### Fallback path
If a specific parity requirement truly needs full process isolation, keep subprocess spawning as a fallback mode only.

But the default should be **embedded invocation via library**.

### Why this is better
Superpowers cares about:
- isolated delegated work
- specialized prompts
- parallel/chain workflows

It does **not** require OS process boundaries specifically.

If `runAgent()` gives us isolated in-memory sessions with per-agent prompts/tools, that is close enough semantically and much cleaner architecturally.

---

## Proposed Tool Strategy

## `superpowers_todo`
Custom Pi tool, implemented locally in `pi-superpowers`.

This should remain a native `pi-superpowers` concern because it is a compatibility shim for `TodoWrite`, not a generic agent runtime feature.

## `superpowers_subagent`
This should be a thin adapter over `pi-agents` execution.

Suggested flow:

1. resolve requested agent name
2. load bundled Superpowers agent prompt or derived config
3. translate compatibility constraints into an `AgentConfig`
4. call `runAgent()`
5. aggregate/render results using pi-agents metrics/helpers

For parallel/chain:
- reuse `executeParallel` / `executeChain` patterns if possible
- otherwise keep their shape and data model

---

## Agent File Strategy

## Make Superpowers packaged agents conform to pi-agents expectations

If possible, the cleanest path is to store `pi-superpowers` bundled agents in a format that already satisfies `pi-agents`'s schema.

That means each bundled agent file should eventually look like a proper pi-agents agent:

- identity block
- domain
- capabilities
- skills
- knowledge
- conversation
- body prompt

### Two ways to do this

#### Option A — adapter-generated config
Keep upstream `obra/superpowers/agents/*.md` unchanged and transform them into `AgentConfig` programmatically.

Pros:
- no changes to upstream agent files

Cons:
- more adapter logic
- hidden defaults live in code

#### Option B — maintain Pi-native bundled agent definitions
Create Pi-native equivalents for the few Superpowers agents we need, using pi-agents schema.

Pros:
- explicit
- validated
- simpler runtime

Cons:
- some duplication

### Recommendation
Use **Option A first**, but only for a very small set of bundled agents:
- `code-reviewer`
- any reviewer/implementer/scout/planner agents required for parity

If the transformation gets messy, move to Option B.

---

## Prompt Assembly Strategy

We should not hand-roll prompt assembly if `pi-agents` already does it well.

### Recommendation
Use:
- `assembleSystemPrompt`
- `resolveVariables`
- `loadSkillContents`
- `discoverContextFiles`

for delegated agent runs.

Then layer Superpowers-specific additions on top:
- compatibility notes
- bootstrap instructions
- Task/TodoWrite mapping
- Pi harness guidance

This gives us consistency with the rest of the Pi ecosystem.

---

## Suggested Module Boundaries in `pi-superpowers`

```text
pi-superpowers/
  src/
    index.ts                    # thin extension entrypoint
    bootstrap/
      superpowers-bootstrap.ts  # before_agent_start additions
    compatibility/
      tool-mapping.ts           # TodoWrite/Task/etc mapping
      fallback-policy.ts        # when to degrade to single-session
    todo/
      tool.ts                   # superpowers_todo
      state.ts                  # reconstruct state from tool results
    agents/
      bundled.ts                # resolve bundled superpowers agents
      transform.ts              # upstream superpowers agent -> pi-agents AgentConfig
    delegation/
      run.ts                    # thin wrapper around pi-agents runAgent
      modes.ts                  # thin wrappers around executeSingle/Parallel/Chain
      render.ts                 # tool output shaping using pi-agents formatting/events
```

---

## Updated Recommendation for the Main Design Doc

The main implementation design should be revised in three important ways:

1. **Replace “custom agent runtime” language with “pi-agents-backed runtime”**
2. **Prefer embedded `runAgent()` execution over subprocess-spawn subagents by default**
3. **Explicitly adopt pi-agents best practices:**
   - boundary validation
   - async fs
   - functional modules
   - append-only logs
   - thin extension entrypoint

---

## Final Recommendation

Yes — we should explicitly design `pi-superpowers` around **best practices proven in `pi-agents`**.

The right architecture is:

- **Pi extension shell** in `pi-superpowers`
- **Superpowers compatibility layer** implemented there
- **pi-agents library** underneath for generic agent runtime concerns

That is cleaner, more testable, and more aligned with the emerging Pi ecosystem than building a custom orchestration stack from scratch.

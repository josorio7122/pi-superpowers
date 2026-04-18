# Superpowers for Pi — Full Parity Implementation Design

## Goal

Build first-class Pi support for [obra/superpowers](https://github.com/obra/superpowers) with parity for the workflow model Superpowers expects on other harnesses:

- automatic Superpowers bootstrap behavior
- native use of the shared `skills/` library
- task tracking comparable to `TodoWrite`
- subagent delegation comparable to `Task`
- support for packaged agent prompts like `agents/code-reviewer.md`
- installable as a Pi package without forking core skills

This design assumes we are creating a new integration package/workspace in:

- `/Users/josorio/Code/pi-superpowers`

The package should be usable either as a standalone adapter package or as a blueprint for an upstream contribution to `obra/superpowers`.

---

## Non-Goals

- Rewriting Superpowers skills for Pi
- Changing Superpowers methodology or voice
- Adding Pi core changes unless adapter limitations force it
- Achieving literal tool-name identity with Claude Code internals

The adapter should preserve Superpowers behavior with the thinnest possible Pi-specific compatibility layer.

---

## Design Principles

1. **Single source of truth for skills**
   - Reuse upstream `skills/` whenever possible.
   - Do not create Pi-only copies of core skills.

2. **Thin adapter, not a fork**
   - Pi-specific behavior lives in a dedicated extension layer.
   - Skill text changes should be minimal and limited to harness mapping.

3. **Parity by semantics, not exact implementation**
   - `TodoWrite` parity means durable task tracking.
   - `Task` parity means isolated delegated work with specialist prompts.
   - Exact internal implementation can differ from Claude/Cursor/OpenCode.

4. **Use Pi-native mechanisms first**
   - skills via Pi package resources
   - bootstrap via `before_agent_start`
   - dynamic resource contribution via `resources_discover`
   - subagents via Pi subprocess pattern
   - persistent task state via tool result `details`

5. **Graceful degradation**
   - If subagents are disabled/unavailable, fall back to single-session workflows.
   - If package agents fail to load, still allow core skills to function.

---

## High-Level Architecture

The `pi-superpowers` package contains two resource types:

1. **Skills**
   - Provided by the upstream Superpowers `skills/` directory.
2. **Pi extension**
   - Provides bootstrap, task-tracking, subagent execution, and agent loading.

### Proposed package layout

```text
pi-superpowers/
├── package.json
├── README.md
├── docs/
│   ├── architecture.md
│   ├── install.md
│   └── testing.md
├── skills/
│   └── superpowers -> ../vendor/superpowers/skills   # symlink or copied snapshot
├── agents/
│   └── superpowers -> ../vendor/superpowers/agents   # symlink or copied snapshot
├── extensions/
│   └── pi-superpowers/
│       ├── index.ts
│       ├── bootstrap.ts
│       ├── resources.ts
│       ├── todo-tool.ts
│       ├── subagent-tool.ts
│       ├── agent-loader.ts
│       ├── compatibility.ts
│       ├── state.ts
│       └── types.ts
└── vendor/
    └── superpowers/
        └── ... upstream checkout or managed mirror
```

### Preferred packaging model

For local development, vendor the upstream repo as a git clone in `vendor/superpowers/`.

For distributable packaging, either:
- publish `pi-superpowers` with bundled `skills/` and `agents/`, or
- generate package contents from upstream at release time.

---

## Resource Loading Strategy

### Skills

Pi already supports package `skills/` directories. The package should expose Superpowers skills directly.

Two supported approaches:

#### Option A: package-local `skills/` mirror
- Pros: simplest runtime behavior
- Cons: duplicate files at package build time

#### Option B: extension contributes skill paths via `resources_discover`
- Pros: less duplication during development
- Cons: slightly more indirection

### Recommendation
Use both:
- include `skills/` conventionally in package output
- also allow `resources_discover` to add explicit paths during local dev or alternative layouts

---

## Bootstrap Strategy

## Problem

Superpowers depends on the model internalizing `using-superpowers` at the start of the session. Pi does not have a built-in equivalent of Claude/Cursor session hook injection for package-defined behavior.

## Solution

Implement bootstrap in the extension using two mechanisms:

1. `session_start`
   - notify the user that Superpowers is active
   - optionally register status widget/footer text

2. `before_agent_start`
   - inject compact Superpowers bootstrap instructions into the system prompt for every turn

### Bootstrap content requirements

The injected bootstrap must:
- tell the model it has Superpowers installed
- require checking and using relevant skills before acting
- explain Pi equivalents for referenced tools
- explain fallback behavior when a skill references unsupported concepts

### Bootstrap source

Do **not** inject the full contents of `skills/using-superpowers/SKILL.md` every turn.

Instead:
- create a compact Pi bootstrap template in `bootstrap.ts`
- include a reference that the authoritative workflow instructions live in `superpowers/using-superpowers`
- instruct the model to load that skill when relevant

### Example bootstrap responsibilities

The bootstrap should communicate:
- Superpowers skills are available
- if a task may match a skill, load and follow it
- Pi-native tool mappings:
  - `TodoWrite` -> `superpowers_todo`
  - `Task` -> `superpowers_subagent`
  - `Skill` -> Pi skill commands / skill loading
  - `Read`/`Write`/`Edit`/`Bash` -> Pi native tools
- when subagent workflows are not appropriate, use single-session fallback

### Why compact injection is preferable

- lower token cost
- easier maintenance
- keeps upstream `using-superpowers` as the canonical methodology document

---

## TodoWrite Parity

## Problem

Superpowers expects a task tracking primitive (`TodoWrite`) that Pi intentionally does not provide by default.

## Solution

Provide a custom tool:

- `superpowers_todo`

This tool becomes the Pi semantic equivalent of `TodoWrite`.

### Tool schema

```ts
{
  action: "replace" | "add" | "update" | "complete" | "remove" | "clear" | "list",
  items?: Array<{
    id?: string,
    content: string,
    status?: "pending" | "in_progress" | "completed",
    priority?: "low" | "medium" | "high"
  }>,
  id?: string,
  content?: string,
  status?: "pending" | "in_progress" | "completed",
  priority?: "low" | "medium" | "high"
}
```

### Behavioral rules

- `replace` is important because Superpowers skills often treat todo state as a whole checklist.
- `update` allows changing text/status/priority.
- `complete` is a convenience alias.
- `list` should return current todo state in a concise format.

### Persistence model

State should be reconstructed from session history using tool result `details`, following Pi best practices.

This ensures:
- correct behavior across `/tree`
- correct behavior across forks/resumes
- no hidden state drift

### UI behavior

Provide:
- compact renderer in tool output
- optional `/todos` command
- optional widget above editor showing current checklist summary

### Prompt integration

The tool should use:
- `promptSnippet`
- `promptGuidelines`

to strongly signal usage for checklist/task tracking requests.

---

## Task Parity via Subagents

## Problem

Superpowers relies heavily on `Task` for:
- specialist subagents
- parallel work
- chain workflows
- reviewer/implementer delegation

Pi has no built-in subagent system, but its extension API supports this pattern.

## Solution

Provide a custom tool:

- `superpowers_subagent`

This is the Pi semantic equivalent of `Task`.

### Execution model

Spawn separate `pi` subprocesses in JSON mode, similar to Pi's subagent example.

Each delegated call gets:
- isolated context window
- explicit task prompt
- specialist instructions loaded from a packaged agent definition or inline template
- optional model/tool restrictions

### Supported modes

#### Single
```json
{ "agent": "code-reviewer", "task": "Review step 2 implementation" }
```

#### Parallel
```json
{
  "tasks": [
    { "agent": "reviewer", "task": "Review backend changes" },
    { "agent": "reviewer", "task": "Review frontend changes" }
  ]
}
```

#### Chain
```json
{
  "chain": [
    { "agent": "scout", "task": "Find auth code" },
    { "agent": "planner", "task": "Create plan using: {previous}" }
  ]
}
```

### Subprocess invocation requirements

Each subprocess should:
- inherit cwd unless overridden
- use `--mode json -p --no-session`
- optionally inherit model unless agent specifies one
- optionally restrict tools based on agent definition
- receive appended system prompt for the agent persona/instructions

### Abort/cancellation

The parent extension must:
- propagate abort signals
- terminate subprocesses on cancellation
- surface partial results cleanly

### Streaming

While running, the tool should stream partial updates into Pi tool output.

Minimum acceptable streaming:
- current task status
- latest assistant text or tool activity
- completion counts in parallel mode

---

## Agent Loading Strategy

## Problem

Pi packages do not define `agents/` as a first-class package resource type.

## Solution

The extension owns agent discovery and parsing.

### Agent sources

Load in this priority order:

1. package-bundled Superpowers agents
2. user-level Pi agents (`~/.pi/agent/agents/*.md`) if explicitly enabled
3. project-level Pi agents (`.pi/agents/*.md`) if explicitly enabled/trusted

### Default behavior

For strict parity with Superpowers package behavior, package-bundled agents should always be available.

User/project agents should be optional because they introduce ambiguity and trust concerns.

### Agent file format

Use frontmatter-compatible markdown similar to Pi's subagent example:

```md
---
name: code-reviewer
description: Review completed implementation against plan
model: inherit
tools: read,grep,find,ls,bash
---

[system prompt body]
```

### Loader responsibilities

`agent-loader.ts` should:
- resolve package agent directory
- recursively find `.md` files
- parse frontmatter
- validate required fields
- return normalized `AgentConfig[]`
- support name lookup and conflict detection

### Compatibility mapping

When a skill says:
- `Task tool with superpowers:code-reviewer`

the Pi adapter should resolve that to:
- bundled agent named `code-reviewer`

The `superpowers:` namespace should be treated as an adapter-level alias, not a filesystem requirement.

---

## Compatibility Contract

Create `compatibility.ts` to centralize all harness mapping behavior.

### Required mappings

- `TodoWrite` => `superpowers_todo`
- `Task` => `superpowers_subagent`
- `Skill` => Pi skill loading mechanism
- `Read` => `read`
- `Write` => `write`
- `Edit` => `edit`
- `Bash` => `bash`
- `Grep` => `grep`
- `Glob` => `find`/`ls` guidance depending context

### Skill compatibility policy

If a skill references unsupported harness-specific behavior:
- prefer semantic substitution
- if not possible, instruct fallback to `executing-plans`

### Examples

#### `subagent-driven-development`
- uses `superpowers_subagent` when available
- otherwise falls back to `executing-plans`

#### `requesting-code-review`
- load bundled `code-reviewer` agent
- run via `superpowers_subagent`

#### `using-superpowers`
- add Pi-specific access/tool guidance

---

## Package Metadata

## package.json requirements

The package should advertise itself as a Pi package.

### Minimum suggested fields

```json
{
  "name": "pi-superpowers",
  "keywords": ["pi-package"],
  "dependencies": {
    "@sinclair/typebox": "*"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-ai": "*",
    "@mariozechner/pi-tui": "*"
  },
  "pi": {
    "extensions": ["./extensions/pi-superpowers/index.ts"],
    "skills": ["./skills"]
  }
}
```

### Notes

- If the package bundles external runtime dependencies, put them in `dependencies`.
- Pi core packages should remain peer deps per Pi docs.

---

## File-by-File Responsibilities

## `extensions/pi-superpowers/index.ts`
Primary entry point.

Responsibilities:
- register event handlers
- register tools
- register commands/widgets/status
- wire all modules together

## `extensions/pi-superpowers/bootstrap.ts`
Responsibilities:
- generate compact bootstrap system prompt additions
- provide helper to decide what to inject per turn

## `extensions/pi-superpowers/resources.ts`
Responsibilities:
- optional `resources_discover` contribution for dev/flexible layouts
- resolve package skill paths if needed

## `extensions/pi-superpowers/todo-tool.ts`
Responsibilities:
- define schema
- execute todo actions
- reconstruct/store todo state
- render tool calls/results
- optional `/todos` command helpers

## `extensions/pi-superpowers/subagent-tool.ts`
Responsibilities:
- define schema
- spawn subprocesses
- support single/parallel/chain
- stream partial updates
- cancellation handling
- format results

## `extensions/pi-superpowers/agent-loader.ts`
Responsibilities:
- locate agent markdown files
- parse frontmatter
- return normalized agent configs
- name/namespace resolution

## `extensions/pi-superpowers/compatibility.ts`
Responsibilities:
- tool name mapping definitions
- fallback policy
- reusable prompt snippets for Pi adaptation

## `extensions/pi-superpowers/state.ts`
Responsibilities:
- shared state reconstruction helpers
- widget/status state if any

## `extensions/pi-superpowers/types.ts`
Responsibilities:
- shared TS types for agents, todo items, tool result details

---

## Documentation Changes Required

## In `pi-superpowers`
- `README.md`
- `docs/install.md`
- `docs/testing.md`
- `docs/architecture.md`

## In upstream Superpowers if contributing back
- add Pi section to `README.md`
- add Pi docs page if desired
- add `skills/using-superpowers/references/pi-tools.md`
- minimally update `skills/using-superpowers/SKILL.md` to mention Pi explicitly

### Proposed `pi-tools.md` content

It should explain:
- how Pi loads skills
- how `/skill:name` works
- `TodoWrite` replacement
- `Task` replacement
- fallback behavior when subagents are unavailable

---

## Testing Strategy

## 1. Installation tests

Verify:
- package installs with `pi install /path/to/pi-superpowers`
- extension loads
- skills are discovered
- bootstrap is active

## 2. Bootstrap tests

Verify that on a fresh session:
- model is told Superpowers is available
- skill usage discipline is in effect
- bootstrap does not duplicate excessively across turns

## 3. Todo tool tests

Verify:
- add/replace/update/complete/remove/clear/list all work
- state survives session reload
- state branches correctly via `/tree`

## 4. Subagent tests

Verify:
- single mode
- parallel mode
- chain mode
- cancellation
- missing agent handling
- packaged agent resolution

## 5. Workflow tests against real Superpowers skills

Smoke test at least:
- `using-superpowers`
- `brainstorming`
- `writing-plans`
- `executing-plans`
- `requesting-code-review`
- `subagent-driven-development`

## 6. Degradation tests

Verify:
- if subagent tool disabled, workflows fall back sanely
- if todo tool unavailable, bootstrap warns or instructs alternative behavior

---

## Risks and Mitigations

## Risk: bootstrap too verbose
Mitigation:
- keep compact
- inject only concise mapping + enforcement
- do not inline full skill content per turn

## Risk: subagent implementation drifts from Pi norms
Mitigation:
- reuse Pi example subprocess architecture
- keep API small and explicit

## Risk: agent packaging ambiguity
Mitigation:
- package-bundled agents are default source of truth
- user/project agents opt-in only

## Risk: over-editing skills
Mitigation:
- prefer compatibility layer and mapping docs
- only change skill text where absolutely necessary

## Risk: branch-unsafe todo state
Mitigation:
- persist via tool result `details`, not hidden in-memory state only

---

## Milestones

## Milestone 1 — Bootstrap + packaging
Deliver:
- package scaffold
- extension loads
- skills visible
- bootstrap injected
- docs for install and usage

## Milestone 2 — Todo parity
Deliver:
- `superpowers_todo`
- `/todos`
- state persistence and renderer

## Milestone 3 — Subagent parity
Deliver:
- `superpowers_subagent`
- packaged agent loading
- single/parallel/chain support

## Milestone 4 — Upstream mapping/docs
Deliver:
- `pi-tools.md`
- minimal updates to `using-superpowers`
- README Pi support docs

## Milestone 5 — Workflow verification
Deliver:
- tested end-to-end flows for planning, execution, and review

---

## Recommended First Implementation Slice

To reduce risk, build in this exact order:

1. scaffold package + extension entrypoint
2. bootstrap injection
3. static packaged skill loading
4. `superpowers_todo`
5. packaged agent loader
6. `superpowers_subagent` single mode
7. `superpowers_subagent` parallel + chain modes
8. docs + compatibility references

This sequence makes it possible to test incrementally while keeping core parity goals visible early.

---

## Final Recommendation

Proceed with `pi-superpowers` as a **thin Pi adapter package** around upstream Superpowers.

The adapter should provide:
- bootstrap discipline
- todo/task tracking
- subagent delegation
- packaged agent loading

while leaving the shared Superpowers methodology and skill corpus intact.

That is the lowest-drift path to full parity support in Pi.

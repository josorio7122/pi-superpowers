# pi-superpowers — Design Spec

**Date:** 2026-04-18
**Status:** Approved for implementation planning
**Supersedes:** `IMPLEMENTATION-DESIGN.md`, `PI-AGENTS-INTEGRATION.md` (historical context; merged and revised here)

---

## 1. Purpose

A pi package that makes the full [obra/superpowers](https://github.com/obra/superpowers) skills library work natively inside the `pi` coding agent (`@mariozechner/pi-coding-agent`). Behavioral parity with other hosts (Claude Code, Cursor, OpenCode, Gemini CLI, Codex) via pi-native mechanisms.

**Primary non-functional requirement:** *easy to update when upstream superpowers releases a new version.* Every other design choice is evaluated against this goal.

## 2. Non-goals

- Forking `obra/superpowers` or editing upstream skill content.
- Re-implementing agent orchestration already available in `pi-agents`.
- Literal tool-name identity with Claude Code internals.
- Changing superpowers' methodology or voice.

## 3. Locked decisions

| # | Decision | Rationale (one-line) |
|---|---|---|
| 1 | Downstream adapter, not a fork. | Avoids rebase burden on every upstream release. Mirrors Jesse's own `sync-to-codex-plugin.sh` pattern. |
| 2 | `scripts/sync-upstream.sh` snapshot script populates `vendor/superpowers/`. | Self-contained repo; `pi install git:…` works atomically. Matches precedent. |
| 3 | Standalone repo at `github.com/josorio7122/pi-superpowers`; git-install only; version tracks upstream (`v5.0.7` → wraps `superpowers@5.0.7`). | Clear release cadence; `pi list` shows the upstream version directly. |
| 4 | Full `using-superpowers/SKILL.md` injected once per session via `before_agent_start` + compact pi tool-mapping addendum. | Matches Claude Code, Cursor, OpenCode, Gemini. First-turn only. |
| 5 | In-process subagent dispatch via `pi-agents.runAgent()` / `executeParallel` / `executeChain`. Peer dep via git URL. Runtime frontmatter transform. | No subprocess overhead. Clean streaming + cancellation. Upstream agent files stay read-only. |
| 6 | Feature-based code layout, pi-agents conventions applied verbatim (biome, vitest, strict TS, co-located tests, single `api.ts` surface). | Consistency with the wider pi ecosystem. |
| 7 | TUI is a first-class product surface. Dedicated `ui/` component library with theme tokens, box primitives, progress/spinners, responsive breakpoints (40/80/120), color-off fallback, snapshot-tested goldens. Interactive `/todos` command via `ctx.ui.custom()`. Reuses `pi-agents` render primitives for metrics + streaming. | Visual consistency with pi-teams / pi-crew; quality bar matching pi-agents output. |

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      pi-superpowers package                          │
│                                                                      │
│  ┌────────────────────────┐     ┌──────────────────────────────┐     │
│  │  vendor/superpowers/   │     │  src/ (pi adapter)           │     │
│  │  (read-only snapshot)  │     │                              │     │
│  │  skills/*              │◄────│  feature-based modules       │     │
│  │  agents/*              │     │  thin extension entrypoint   │     │
│  │  (hooks/.claude/ ign.) │     │  pi-agents runtime below     │     │
│  │  Synced via            │     │                              │     │
│  │  scripts/              │     │                              │     │
│  │  sync-upstream.sh      │     │                              │     │
│  └────────────────────────┘     └──────────────────────────────┘     │
│                                                                      │
│  pi hooks:  before_agent_start · resources_discover · session_start  │
│  peer dep:  pi-agents (runAgent, executeParallel, executeChain)      │
└──────────────────────────────────────────────────────────────────────┘
```

Three invariants:

1. **`vendor/superpowers/` is read-only.** Only `scripts/sync-upstream.sh` writes here.
2. **`src/` is thin and pi-native.** Async fs only, zod/typebox at boundary, runtime via pi-agents — no generic orchestration code.
3. **Update surface is two files.** Upstream bump = sync script runs → `package.json` version bumped → one commit. `src/` only changes when upstream alters the `using-superpowers` content structure or named-agent frontmatter schema.

## 5. Package manifest (pi-package framing)

```json
{
  "name": "pi-superpowers",
  "version": "5.0.7",
  "description": "Superpowers for pi — TDD, debugging, collaboration patterns",
  "keywords": ["pi-package", "superpowers"],
  "type": "module",
  "pi": {
    "extensions": ["./src/index.ts"],
    "skills": ["./vendor/superpowers/skills"]
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "pi-agents": "github:josorio7122/pi-agents"
  },
  "dependencies": {
    "@sinclair/typebox": "^0.34.0",
    "gray-matter": "^4.0.0"
  }
}
```

Install path: `pi install git:github.com/josorio7122/pi-superpowers@v5.0.7` → clone → `npm install` → extensions + skills auto-register on next pi start.

Agents are **not** a pi-package resource key. Our extension reads `vendor/superpowers/agents/*.md` at runtime via `subagents/loader.ts`.

## 6. Repository layout (feature-based)

```
pi-superpowers/
├── package.json
├── tsconfig.json              # ES2022 · strict · noUncheckedIndexedAccess · exactOptionalPropertyTypes · bundler resolution
├── biome.json                 # kebab-case · noBarrelFile · noNamespaceImport · useMaxParams:2 · noNonNullAssertion · noNestedTernary
├── vitest.config.ts
├── scripts/
│   └── sync-upstream.sh       # vendor refresh + version bump
├── vendor/
│   └── superpowers/           # read-only snapshot of obra/superpowers
└── src/
    ├── index.ts               # thin pi extension entrypoint
    ├── api.ts                 # public surface, explicit exports only (never a barrel)
    ├── bootstrap/             # FEATURE — inject using-superpowers + pi tool mapping
    │   ├── inject.ts
    │   ├── inject.test.ts
    │   ├── addendum.ts
    │   ├── addendum.test.ts
    │   └── inject-e2e.test.ts
    ├── skills/                # FEATURE — contribute vendored skill paths
    │   ├── discover.ts
    │   └── discover.test.ts
    ├── todos/                 # FEATURE — superpowers_todo
    │   ├── tool.ts
    │   ├── tool.test.ts
    │   ├── schema.ts
    │   ├── state.ts
    │   ├── state.test.ts
    │   ├── render.ts
    │   ├── render.test.ts
    │   └── todos-e2e.test.ts
    ├── subagents/             # FEATURE — superpowers_subagent
    │   ├── tool.ts
    │   ├── tool.test.ts
    │   ├── schema.ts
    │   ├── loader.ts
    │   ├── loader.test.ts
    │   ├── transform.ts
    │   ├── transform.test.ts
    │   ├── dispatch.ts
    │   ├── dispatch.test.ts
    │   ├── render.ts
    │   ├── render.test.ts
    │   └── subagents-e2e.test.ts
    ├── compat/                # CROSS-FEATURE — tool name mapping source of truth
    │   ├── tool-mapping.ts
    │   └── tool-mapping.test.ts
    ├── ui/                    # CROSS-FEATURE — TUI component library
    │   ├── theme.ts                   # colors, tokens, glyphs — extends pi-agents RenderTheme
    │   ├── theme.test.ts
    │   ├── icons.ts                   # semantic icons (superpowers/todo/subagent/states)
    │   ├── box.ts                     # panel + title-bar + divider box-drawing helpers
    │   ├── box.test.ts
    │   ├── progress.ts                # progress bars, spinners, state glyphs
    │   ├── progress.test.ts
    │   ├── truncate.ts                # width-aware truncation + wrapping
    │   ├── truncate.test.ts
    │   ├── status.ts                  # ctx.ui.setStatus wrapper
    │   ├── status.test.ts
    │   ├── widget.ts                  # ctx.ui.setWidget wrapper
    │   ├── widget.test.ts
    │   ├── compact-todo.ts            # one-line todo summary for widgets
    │   ├── compact-todo.test.ts
    │   ├── todo-picker.ts             # ctx.ui.custom interactive /todos component
    │   ├── todo-picker.test.ts
    │   └── ui-snapshots.test.ts       # width=40/80/120 · color-on/off snapshots
    └── common/                # shared utilities (mirror pi-agents' common/)
        ├── fs.ts
        ├── paths.ts
        └── types.ts
```

**`src/index.ts` responsibilities only:**

```ts
export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", injectSuperpowers);
  pi.on("resources_discover", contributeSkillPaths);
  pi.registerTool(superpowersTodoTool);
  pi.registerTool(superpowersSubagentTool);
}
```

## 7. Conventions (mirrored from `pi-agents` verbatim)

- **Biome** with kebab-case filenames, `noBarrelFile`, `noNamespaceImport`, `useMaxParams: 2`, `noNonNullAssertion`, `noNestedTernary`.
- **Co-located tests** (`foo.ts` + `foo.test.ts`).
- **E2E tests** named `<feature>-e2e.test.ts`, live in the feature dir they exercise.
- **Single public surface `src/api.ts`**, explicit exports, never a barrel.
- **Async fs only** (`node:fs/promises`); `common/fs.ts` enforces.
- **Zod / Typebox validation at boundary**; `*/schema.ts` per feature.
- **`.js` import extensions**, ESM, bundler resolution.
- **Scripts**: `test`, `test:watch`, `typecheck`, `lint`, `lint:fix`, `check` (aggregator), `format`.

## 8. Data flow

### 8.1 Install + pi startup

```
pi install git:github.com/josorio7122/pi-superpowers@v5.0.7
   ├─► clone → ~/.pi/agent/git/github.com/josorio7122/pi-superpowers/
   ├─► npm install  (resolves pi-agents peer via git URL)
   └─► package.json `pi` key registers skills + extension paths

pi
   ├─► resources_discover  → our handler contributes ./vendor/superpowers/skills
   ├─► pi scans 15 skills, adds names+descriptions to system prompt
   ├─► session_start       → (reserved for status widget)
   └─► loads src/index.ts via jiti → registers tools + before_agent_start hook
```

### 8.2 First user prompt — bootstrap injection

```
user types a prompt
   ├─► before_agent_start fires
   ├─► bootstrap/inject.ts:
   │      if first turn of session:
   │         read vendor/superpowers/skills/using-superpowers/SKILL.md
   │         render compat/tool-mapping.ts → pi addendum
   │         return { message: { customType: "superpowers-bootstrap",
   │                              content: `<EXTREMELY_IMPORTANT>…${SKILL.md}…${addendum}</EXTREMELY_IMPORTANT>`,
   │                              display: false } }
   │      else:
   │         return undefined  (no further injection)
   └─► agent runs with superpowers discipline active
```

Injection mechanism: **persistent message**, not system-prompt mutation — survives `/tree`, `/resume`, `/fork` without re-injection. First-turn detection via `ctx.sessionManager.getEntries()` length.

### 8.3 Subagent dispatch

```
model calls superpowers_subagent({ agent: "code-reviewer", task: "..." })
   ├─► subagents/loader.ts       read vendor/superpowers/agents/code-reviewer.md
   ├─► subagents/transform.ts    CC-style frontmatter → pi-agents AgentConfig
   ├─► subagents/schema.ts       zod validate
   ├─► subagents/dispatch.ts     pi-agents.runAgent({ config, task, onUpdate, signal })
   │                                ├─► streams partial events into subagents/render.ts
   │                                └─► returns { content, metrics, log }
   └─► tool result
          content: [{ type:"text", text: finalAssistantText }]
          details: { agent, metrics, logPath }
```

Parallel uses `executeParallel`; chain uses `executeChain`. Abort signal passes straight to `runAgent`.

### 8.4 Todo state reconstruction

Every `superpowers_todo` tool call returns:

```ts
{
  content: [{ type:"text", text: renderChecklist(items) }],
  details: { todos: items, action }
}
```

On each invocation, `state/todo-state.ts` scans `ctx.sessionManager.getEntries()` for the most recent `superpowers_todo` tool result in the current branch and rebuilds `items[]` from its `details.todos`. **No hidden in-memory state.** `/tree`, `/fork`, `/resume` are automatic.

### 8.5 Upstream sync (the update flow)

```
upstream: obra/superpowers tags v5.0.8
   └─► ./scripts/sync-upstream.sh v5.0.8
         ├─► clone obra/superpowers@v5.0.8 → tmp
         ├─► rsync (excluding .git, .github, .claude, node_modules) → vendor/superpowers.staging/
         ├─► atomic mv vendor/superpowers.staging/ → vendor/superpowers/
         ├─► bump package.json version → 5.0.8
         ├─► git add -A && git commit -m "Sync superpowers to v5.0.8"
         └─► (human) review diff · npm run check · git tag v5.0.8 · git push

consumer: pi update  → pi-superpowers@latest pulled; new skills + agents live.
```

**Blast radius by upstream change class:**

| Upstream change | Detected | `src/` impact |
|---|---|---|
| Skill text edits | Silent — models see new content | Zero |
| New skill added | pi auto-discovers from `vendor/superpowers/skills/` | Zero |
| New agent added | `subagents/loader.ts` auto-picks up (if frontmatter valid) | Zero |
| Agent frontmatter schema changes | `subagents/transform.test.ts` fails on `npm run check` | One file |
| `using-superpowers` path/structure changes | `bootstrap/inject.test.ts` fails | One file |
| Upstream restructures `skills/` tree | `skills/discover.ts` still resolves root path; individual skill dirs discovered automatically | Rare; single-file fix if hit |

## 9. Error handling & degradation

Three-tier degradation:

1. **Full parity.** Skills path registered, bootstrap injected, both tools registered, pi-agents resolves.
2. **Partial.** Skills registered but subagent tool disabled (pi-agents missing or invalid agent file). `subagent-driven-development` skill falls back to single-session workflow per its own instructions. Extension state flag `subagentAvailable = false` adjusts bootstrap addendum wording.
3. **Minimum.** Bootstrap + skills path only. No tools registered. User can still load skills via pi's native `/skill:name`.

### Specific failures

| Failure | Detected at | Response |
|---|---|---|
| `vendor/superpowers/` missing | `bootstrap/inject.ts`, `skills/discover.ts` | `ctx.ui.notify` warning; register no skills; skip bootstrap; pi keeps running. |
| `using-superpowers/SKILL.md` unreadable | `bootstrap/inject.ts` | Inject only pi tool-mapping addendum; log warning. |
| `pi-agents` peer dep missing | `src/index.ts` load | Clear error message pointing at install command. |
| Agent frontmatter zod failure | `subagents/loader.ts` | Skip that agent, log diagnostic, others still work. |
| Unknown agent name | `subagents/tool.ts` | Tool error result listing available agents. |
| `runAgent()` throws | `subagents/dispatch.ts` | Surface error + partial metrics in tool result. |
| Abort mid-run | `subagents/dispatch.ts` | Forward signal; return `{ cancelled: true, partial }`. |
| Todo state drift (schema change) | `state/todo-state.ts` | `safeParse`; on failure, start empty + one-time diagnostic. |
| Sync script failure | `scripts/sync-upstream.sh` | `set -euo pipefail` + staging dir + atomic rename. Failed sync leaves vendor untouched. |

### Explicit non-responses

- We **never** patch upstream skill text at runtime. Tool-mapping addendum conveys pi equivalents; skills remain byte-identical to upstream.
- We **never** catch-and-swallow to hide bugs. All diagnostics surface via `ctx.ui.notify` or `setStatus`.
- We **never** retry flakily. Idempotent reconstruction; atomic sync.

## 10. TUI rendering

Top-tier TUI is a first-class product concern, not an afterthought. Every surface users see gets a hand-designed component with snapshot-tested output, width-responsive layout, color-theming, and graceful color-off fallback. All components live under `src/ui/` and are composed into per-feature renderers.

### 10.1 Design tokens (`ui/theme.ts`, `ui/icons.ts`)

Single source of truth, extends pi-agents' `RenderTheme`. Every other renderer reads from here — no ad-hoc colors or glyphs anywhere else.

| Token | Value | Used by |
|---|---|---|
| `colors.primary` | superpowers brand (amber/gold) | headers, title bars |
| `colors.accent` | cyan | in-progress states |
| `colors.success` | green | ✓ completed |
| `colors.warn` | yellow | degradation, partial |
| `colors.error` | red | failures, unknown agent |
| `colors.dim` | gray | completed text, secondary metadata |
| `icons.brand` | `🦸` | superpowers marker everywhere |
| `icons.todo` | `📝` | todos tool header |
| `icons.agent` | `🤖` | subagents tool header |
| `icons.pending` / `inProgress` / `done` | `[ ]` / `[⋯]` / `[✓]` | checklist states |
| `icons.ok` / `err` / `warn` / `paused` | `✓` / `✗` / `⚠` / `⏸` | result badges |
| `icons.spinner` | `⣾⣽⣻⢿⡿⣟⣯⣷` (braille frames) | running indicators |
| `box.light` | `─│┌┐└┘├┤┬┴┼` | panels (default) |
| `box.heavy` | `━┃┏┓┗┛┣┫┳┻╋` | strong emphasis (rarely) |
| `progress.filled` / `empty` | `▰` / `▱` | progress bars |

**Color-off mode:** every glyph has a plain-ASCII fallback (`[x]` → `[x]`, `⋯` → `...`, `▰` → `#`). Detected via `ctx.ui.colorEnabled` or env.

### 10.2 Component primitives (`ui/box.ts`, `progress.ts`, `truncate.ts`)

Composable building blocks used by every feature renderer:

- **`panel({ title, icon, badge, width, rows })`** — returns a boxed panel with an icon-prefixed title bar, optional right-aligned badge (`✓`, `⋯`, `⏸`), and truncated/wrapped body. Width-responsive.
- **`divider(width, char?)`** — single-line horizontal rule.
- **`progressBar(current, total, width)`** — `▰▰▰▱▱ 3/5` with smart sizing.
- **`spinner(tick)`** — returns the current frame; tick managed by caller.
- **`truncate(text, width, mode)`** — `mode: "end" | "middle" | "wrap"`. Strips ANSI before measuring.
- **`badge({ kind, text })`** — themed pill: `kind: "success" | "warn" | "error" | "info"`.

All primitives are pure functions: `(props) => string[]`. No pi runtime needed. Easy to test.

### 10.3 Per-feature component spec

#### Bootstrap (`ui/status.ts` called from `bootstrap/inject.ts`)

One-time session marker on first injection:

```
🦸 Superpowers · v5.0.7 · 15 skills · 1 agent
```

Set via `ctx.ui.setStatus("superpowers", …)`, auto-cleared after first user turn completes.

#### Todos — tool call header (one line)

```
📝 superpowers_todo · add (3)
```

#### Todos — tool result (multiline panel)

```
┌─ 📝 Todos ─────────────────────────────────────────── 2/5 ─┐
│ [✓] write brainstorming doc                                │
│ [✓] confirm upstream-sync approach                         │
│ [⋯] draft implementation plan                              │
│ [ ] ! review with Jesse                                    │
│ [ ]   publish v5.0.7 tag                                   │
└────────────────────────────────────────────────────────────┘
```

- `!` before item text = high priority (from `priority: "high"`).
- Completed rows dim + strikethrough (via theme).
- Title-bar right badge shows `done/total`.
- Empty state: panel with `(no todos yet — use add)` placeholder row.

#### Todos — persistent widget (above editor)

```
🦸 ▰▰▰▱▱ 3/5 · [⋯] draft implementation plan
```

Updates after every `superpowers_todo` call with non-empty state. Cleared via `setWidget(..., [])` when all done or list cleared. At very narrow widths (<40), collapses to `🦸 3/5`.

#### Todos — interactive `/todos` command

Registered via `pi.registerCommand("todos", ...)`. Opens full-screen TUI via `ctx.ui.custom()`:

```
┌─ 📝 Todos · session ──────────────────────────── 2/5 done ─┐
│                                                            │
│ › [✓] write brainstorming doc                              │
│   [✓] confirm upstream-sync approach                       │
│   [⋯] draft implementation plan                            │
│   [ ] ! review with Jesse                                  │
│   [ ]   publish v5.0.7 tag                                 │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  j/k move · space toggle · a add · x remove · q quit       │
└────────────────────────────────────────────────────────────┘
```

Keyboard: `j/k` or `↑↓` nav, `space` toggle status, `a` add (opens input), `x` remove, `1/2/3` set priority, `q` / `esc` quit. State changes call through to the tool execute path — no backdoor writes.

#### Subagents — tool call header (running)

```
🤖 code-reviewer · single · ⣾ 12.3s · 2,341 tok
```

Spinner frame rotates; token/duration update on each streamed partial.

#### Subagents — tool result (single mode)

```
┌─ 🤖 code-reviewer ─────────────────────────────────── ✓ ─┐
│                                                          │
│  <final assistant text, wrapped to width-4>              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  12.4s · 1,245 in / 892 out · 4 tools · $0.018           │
└──────────────────────────────────────────────────────────┘
```

Metrics footer built via pi-agents' `formatUsageStats`. Title-bar badge shows run state: `✓` done, `⋯` running, `⏸` cancelled, `✗` error.

#### Subagents — tool result (parallel mode)

```
┌─ 🤖 parallel (3) ──────────────────────────────────── 2/3 ─┐
│ [✓] reviewer-backend   12.4s · 1,245 tok · $0.018          │
│ [✓] reviewer-frontend   9.8s ·   892 tok · $0.014          │
│ [⋯] reviewer-tests      running · 412 tok                  │
├────────────────────────────────────────────────────────────┤
│ 22.2s total · 2,549 tok · $0.032                           │
└────────────────────────────────────────────────────────────┘
```

Per-row state glyph + agent name + live metrics. Aggregate footer.

#### Subagents — tool result (chain mode)

```
┌─ 🤖 chain (3) ─────────────────────────────────────── 2/3 ─┐
│ [✓] scout       found auth code across 12 files            │
│ [⋯] planner     drafting plan…                             │
│ [ ] implementer queued                                     │
├────────────────────────────────────────────────────────────┤
│ 8.1s elapsed · 1,803 tok · $0.022                          │
└────────────────────────────────────────────────────────────┘
```

Each step shows a short summary when complete; current step shows latest activity.

#### Subagents — streaming updates

`onUpdate` receives partial events from `runAgent`. Render strategy:

1. Title bar stays stable (name, mode, run state).
2. Body shows rolling last-N lines of assistant text (width-truncated).
3. Footer shows live token/duration/tool-count counters (refreshed at ~4Hz max).

Uses `buildPartialEvents` + `renderConversation` from pi-agents for the body so output matches pi-teams / pi-crew exactly.

#### Subagents — status footer while running

```
🤖 code-reviewer · 2,341 tok · 8.4s
```

Set via `ctx.ui.setStatus("superpowers-subagent", …)`; cleared on completion.

#### Errors & degradation

Notifications via `ctx.ui.notify(msg, level)` for transient events (missing agent, malformed frontmatter on load).

Persistent degradation banner via `ctx.ui.setWidget("superpowers-degraded", …)` when the extension boots in degraded mode:

```
⚠ Superpowers degraded · subagents disabled (pi-agents missing)
```

Error panel (tool result):

```
┌─ ⚠ superpowers_subagent ───────────────────────────── ✗ ─┐
│ Agent not found: "code-reviewer-v2"                      │
│                                                          │
│ Available agents:                                        │
│   · code-reviewer                                        │
└──────────────────────────────────────────────────────────┘
```

### 10.4 Responsive breakpoints

All components implement three width modes:

| Width | Mode | Example (todos widget) |
|---|---|---|
| ≥ 80 | full | `🦸 ▰▰▰▱▱ 3/5 · [⋯] draft implementation plan` |
| 40–79 | compact | `🦸 3/5 · draft implementation plan` |
| < 40 | minimal | `🦸 3/5` |

`ui/truncate.ts` owns the "which mode" decision based on measured available width.

### 10.5 Reuse from pi-agents

```ts
import {
  formatTokens, formatUsageStats,
  buildPartialEvents, buildFinalEvents, renderConversation,
  type RenderTheme, type ConversationEvent,
} from "pi-agents";
```

- **`formatTokens`, `formatUsageStats`** — footer metrics formatting (identical to pi-teams / pi-crew output).
- **`buildPartialEvents`, `renderConversation`** — streaming subagent body.
- **`RenderTheme`** — base theme we extend with superpowers tokens.

Cross-package visual consistency is enforced by reuse, not by copy.

### 10.6 Testing TUI (applies in section 11)

- **Snapshot tests per component** in `ui/*.test.ts` — stable golden strings.
- **Width matrix**: every renderer tested at widths 40, 80, 120 — no overflow, correct mode selection.
- **Color-on/off**: each renderer runs twice; color-off output must be plain ASCII with no zero-width artifacts.
- **Animation frames**: spinner tested at specific tick values (0, 1, 7, 8); progress bar tested at 0/5, 3/5, 5/5.
- **`todo-picker.ts`** interactive component: simulated keyboard events → expected state transitions + rendered output.
- **End-to-end TUI regression** in `ui-snapshots.test.ts`: composite render of every surface at every breakpoint, diffed against committed golden files. Changes require explicit golden update — no silent drift.

## 11. Testing strategy (TDD)

### Pyramid

```
┌───────────────────┐
│  E2E (~4)         │   real pi subprocess, vendored snapshot
├───────────────────┤
│  Integration (~6) │   extension in a mock pi harness
├───────────────────┤
│  Unit (~30-40)    │   pure functions, co-located
└───────────────────┘
```

### Build order (one feature at a time, tests first)

1. **`compat/tool-mapping.ts`** — pure data, ideal starting point.
2. **`ui/` primitives** — theme, icons, truncate, box, progress, status, widget. All pure functions, easy to TDD in isolation. Built first because every other renderer depends on them.
3. **`bootstrap/`** — addendum → inject → e2e. Uses `ui/status.ts`.
4. **`skills/discover.ts`** — path contribution.
5. **`todos/`** — schema → state → render (uses `ui/box`, `ui/progress`) → `ui/compact-todo` → `ui/todo-picker` → tool → e2e.
6. **`subagents/`** — schema → transform → loader → dispatch → render (uses `ui/box`, `ui/progress`, pi-agents render helpers) → tool → e2e.
7. **`ui/ui-snapshots.test.ts`** — composite golden snapshots at widths 40/80/120, color-on/off. Locked last, after all renderers stable.

For each file: write `.test.ts` first; implement until green; lint + typecheck; commit.

### E2E contract

```ts
test("dispatches code-reviewer against a trivial task", async () => {
  const out = await runPi({
    args: ["--mode", "json", "-p", "--no-session", "-e", "./src/index.ts"],
    prompt: 'Use superpowers_subagent with { agent: "code-reviewer", task: "echo ok" }',
    timeoutMs: 60_000,
  });
  expect(out.toolCalls).toContainEqual(
    expect.objectContaining({ name: "superpowers_subagent" })
  );
  expect(out.finalMessage).toMatch(/ok/i);
});
```

Gated by `PI_BIN` env var so CI skips when pi isn't installed.

### Fixtures

- `tests/fixtures/agents/code-reviewer.md` — snapshot of upstream's current agent file (transform tests are independent of vendor sync).
- `tests/fixtures/sessions/with-todos.json` — 3 prior todo entries for state reconstruction tests.
- `tests/fixtures/sessions/empty.json` — fresh-session tests.

### Testing contract

1. No feature lands without tests; `npm run check` is the commit gate.
2. Every `sync-upstream.sh` run re-runs `npm run check` before the sync commit is written.
3. E2E is ground truth; unit mocks can drift, E2E can't.

## 12. Milestones

Each milestone ends with `npm run check` green and a tagged release.

| # | Name | Deliverable |
|---|---|---|
| M1 | Package scaffold | `package.json`, biome/tsconfig/vitest, `scripts/sync-upstream.sh`, empty `src/index.ts` registering nothing, vendor populated. `pi install` works, does nothing visible. |
| M2 | Skills + bootstrap | `skills/discover.ts`, `bootstrap/inject.ts`, `bootstrap/addendum.ts`, `compat/tool-mapping.ts`, `ui/status.ts`. Using-superpowers inline on first turn; skills discoverable via `/skill:name`. |
| M3 | Todos | `todos/*`, `ui/compact-todo.ts`, interactive `/todos` via `ui/todo-picker.ts`. Full TodoWrite parity. Widget renders at all breakpoints. `/tree` / `/fork` / `/resume` work. |
| M4 | Subagents | `subagents/*` — loader, transform, dispatch, tool, render. Single mode first (with full box/metrics rendering). Parallel + chain next (with live multi-row panels). |
| M5 | Polish + docs | README, install doc, testing doc, troubleshooting. |

## 13. Open questions

- **pi-agents public API stability.** We pin via git tag in the peer dep URL. If pi-agents surface changes, we bump the tag on our side; breakages localized to `subagents/dispatch.ts` and `subagents/render.ts`.
- **Second agent beyond `code-reviewer`?** Upstream currently ships only one in `agents/`. If upstream adds more, `subagents/loader.ts` handles them automatically; transform may need tweaks if new frontmatter fields appear.
- **Do we register pi slash commands mirroring upstream's deprecated `commands/`?** Leaning no — pi's `/skill:name` is the pi-native idiom, and upstream commands are deprecated redirects.

## 14. References

- Upstream repo: <https://github.com/obra/superpowers>
- Pi docs: `@mariozechner/pi-coding-agent/docs/{extensions,skills,packages}.md`
- pi-agents (peer dep): `/Users/josorio/Code/pi-agents/` (private; distributed via git)
- OpenCode plugin precedent: `obra/superpowers/.opencode/plugins/superpowers.js`
- Codex sync precedent: `obra/superpowers/scripts/sync-to-codex-plugin.sh`
- Superseded: `IMPLEMENTATION-DESIGN.md`, `PI-AGENTS-INTEGRATION.md` (historical; their key decisions are merged here).

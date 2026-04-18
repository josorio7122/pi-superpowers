# pi-superpowers v5.2 — TUI Redesign Design

**Date:** 2026-04-18
**Status:** Approved for planning

## 1. Purpose

Replace the heavy-box TUI in tool-call rendering with a Claude-Code-inspired tree-and-bullet style, keeping pi-superpowers' brand in session-start status and the (now-replaced) todos widget. Add a pi-agents-style animated simulator so design iterations can be reviewed in the real terminal.

## 2. Scope

Redesigned surfaces:

1. `superpowers_todo` tool-call header
2. `superpowers_todo` tool-result panel
3. `superpowers_subagent` tool-call header
4. `superpowers_subagent` tool-result panel (single / parallel / chain)
5. **Replaces** the one-line todos widget with an always-visible multi-line checklist above the editor

Unchanged:

- Session-start status (keeps `🦸 Superpowers · vX.Y.Z · …` — brand moment)
- `/todos` interactive picker (heavy-panel design retained; deferred to v5.3)

## 3. Style decisions (locked)

- **Approach B** — CC-inspired bullet/tree structure, no boxes, keep superpowers brand (`🦸`) in status + widget only.
- **Glyphs** — `☐` pending / `◐` in-progress / `☒` done. `●` bullet for tool-call headers. `⎿` for nested branches (results under headers).
- **Priority marker** — `!` (warn color) prefixed to high-priority todo items.
- **Colors** — existing `ui/theme.ts` palette, no new color tokens. Dim for done/metadata, accent for in-progress, success for `✓`, warn for `!`, error for `✗`.
- **Widths** — no explicit breakpoints. Render wraps/truncates at `process.stdout.columns` (or passed `width`) using existing `ui/truncate` helpers. Matches pi-agents/CC behavior.

## 4. Wireframes

### 4.1 `superpowers_todo` tool call

Empty:
```
● superpowers_todo(clear)  ⎿  no todos
```

Add:
```
● superpowers_todo(add "review with Jesse")
  ⎿  3 todos · 0/3 done
     ☐  write brainstorming doc
     ☐  confirm upstream-sync approach
     ☐  review with Jesse
```

Mid-flight (2 done, 1 in-progress, 2 pending, 1 high-priority):
```
● superpowers_todo(complete "2")
  ⎿  5 todos · 2/5 done
     ☒  write brainstorming doc
     ☒  confirm upstream-sync approach
     ◐  draft implementation plan
     ☐  ! review with Jesse
     ☐  publish v5.0.7 tag
```

Guard error:
```
● superpowers_todo(complete "1")
  ⎿  ✗ error: no prior todos in session — use 'add' or 'replace' first
```

### 4.2 `superpowers_subagent` tool call

Single running:
```
● superpowers_subagent(code-reviewer: "review step 2")
  ⎿  ⣾ running · 0.8s · 142 tok
```

Single done:
```
● superpowers_subagent(code-reviewer: "review step 2")
  ⎿  ✓ done · 12.4s · 1,245 in / 892 out · 4 tools · $0.018
     <final assistant text, wrapped to width-5, indented 5 spaces>
```

Parallel (mid-flight, then done):
```
● superpowers_subagent(parallel: 3 tasks)
  ⎿  ✓ reviewer-backend   · 12.4s · 1,245 tok · $0.018
  ⎿  ⣾ reviewer-frontend  · running · 823 tok
  ⎿  ☐ reviewer-tests     · queued

● superpowers_subagent(parallel: 3 tasks)
  ⎿  ✓ reviewer-backend   · 12.4s · 1,245 tok · $0.018
  ⎿  ✓ reviewer-frontend   ·  9.8s ·   892 tok · $0.014
  ⎿  ✓ reviewer-tests      · 14.2s · 1,502 tok · $0.020
  ⎿  total: 22.2s · 3,639 tok · $0.052
```

Chain:
```
● superpowers_subagent(chain: 3 steps)
  ⎿  ✓ scout       · found auth code across 12 files
  ⎿  ⣾ planner     · drafting plan…
  ⎿  ☐ implementer · queued
```

Error (unknown agent):
```
● superpowers_subagent(code-reviewer: "…")
  ⎿  ✗ error: Agent 'backend-dev' not found. Available: code-reviewer, general-purpose
```

### 4.3 Todos widget (always-visible, multi-line)

Non-empty:
```
🦸 Todos · 2/5 done
   ☒  write brainstorming doc
   ☒  confirm upstream-sync approach
   ◐  draft implementation plan
   ☐  ! review with Jesse
   ☐  publish v5.0.7 tag
```

Empty → widget cleared (no visual footprint). Replaces today's one-liner `🦸 no todos` + `🦸 ▰▰▰▱▱ 3/5 · …`.

### 4.4 Session-start status (unchanged brand)

```
🦸 Superpowers · v5.2.0 · 15 skills · subagents
```

3-second flash, then clears.

## 5. Architecture

### 5.1 New module: `src/ui/tree.ts`

Pure string-producing primitives. Replaces `ui/box.ts` as the go-to for new renders. Exports:

- `bullet({ label, theme })` → `● <label>` line (primary-colored label)
- `branch({ text, theme, indent? })` → `⎿  <text>` line (dim `⎿`, configurable indent for further nesting)
- `indent(text, spaces)` → prefix each line of `text` with N spaces (used to align continuation lines under a branch)
- `checkbox(status)` → `☐`/`◐`/`☒` glyph token (color applied by caller via theme)
- `priorityMark(priority, theme)` → `!` (warn color) for high, empty string otherwise

All pure functions. No side effects. No pi runtime dependency.

### 5.2 Rewritten renderers

- `src/todos/render.ts` → `renderTodosCallHeader(...)`, `renderTodosResult(...)` using `tree.bullet` + `tree.branch`. Drops `panel()`.
- `src/subagents/render.ts` → `renderSubagentCallHeader`, `renderSingleResult`, `renderMultiResult`. Drops `panel()`.
- `src/ui/compact-todo.ts` → returns `string[]` (multi-line) instead of a single string. Empty input → `[]`. Header uses `🦸 Todos · N/M done`, rows use `checkbox` + priority + content.

### 5.3 Icons

`src/ui/icons.ts` audited against live callers after render rewrites. Explicit final state:

| Key | New value | Fallback | Rationale |
|---|---|---|---|
| `brand` | `🦸` | `[SP]` | Session-start status + widget header |
| `bullet` | `●` | `*` | Tool-call header prefix (new) |
| `branch` | `⎿` | `-` | Nested-result prefix (new) |
| `pending` | `☐` | `[ ]` | Checklist state |
| `inProgress` | `◐` | `[*]` | Checklist state |
| `done` | `☒` | `[x]` | Checklist state |
| `ok` | `✓` | `OK` | Success marker in subagent result (`✓ done · …`) |
| `err` | `✗` | `X` | Error marker (`✗ error: …`) |

Deleted keys (grep-verified unused after rewrites): `todo`, `agent`, `warn`, `paused`. Remove both from `ICONS` and `ASCII_FALLBACK`. If grep surfaces remaining callers, update those first before deletion.

### 5.4 Cleanup audit

`ui/box.ts` exports audited after rewrites:

- `panel()` — live (used by `ui/todo-picker.ts`). Stays.
- `divider()` — grep-verify; delete if orphan.
- `badge()` — grep-verify; delete if orphan.
- Associated types (`PanelProps`, `BadgeProps`, `BadgeKind`) — deleted alongside their functions if orphaned.

No `@deprecated` markers. Live code only. Pre-commit grep check:

```bash
rg -n '\[ \]|\[x\]|\[⋯\]|panel\(\{|┌─|┐\s*$' src/ --type ts
```

Expected: zero hits outside `src/ui/todo-picker.ts` (picker keeps old style until v5.3).

### 5.5 Simulator: `scripts/simulate-ui.ts` + `scripts/simulate-helpers.ts`

Mirrors `pi-agents/scripts/simulate-ui.ts` exactly:

- Subcommand dispatch: `todos | subagent-single | subagent-parallel | subagent-chain | widget | all`
- Helpers (`animatedWait`, `clearAndPrint`, `sleep`, `randomMetrics`, `theme`) copied (not imported) into `scripts/simulate-helpers.ts` to keep repo self-contained
- `~10Hz` frame rate via `animatedWait`
- Default subcommand: `all`, with banner separators between surfaces
- Usage: `npx tsx scripts/simulate-ui.ts [mode]`

Non-goals: regression testing (unit snapshots own that), TTY width resize, dev live-reload.

## 6. Data flow

Runtime pipelines unchanged. Render functions keep same input types (`TodoItem[]`, `RunResult`, `RunResult[]`) and output types (`string[]`). The 194 non-render unit tests pass without modification. Only render tests and snapshot fixtures change.

## 7. Testing

**Unit** (fast, always run):

- `src/ui/tree.test.ts` (new) — primitives at widths 40/80/120, color-on/off.
- `src/todos/render.test.ts` (rewritten snapshots) — every action variant + empty + error-guard.
- `src/ui/compact-todo.test.ts` (rewritten) — empty → `[]`, populated → ≥2 lines, priority/in-progress rendering.
- `src/subagents/render.test.ts` (rewritten snapshots) — running/done/error × single/parallel/chain.

**E2E** — no new tests. Existing 8 fast E2E tests assert marker events, not render strings; pass unchanged.

**Simulator** — not a test. On-demand design review only. Not wired into `npm run test` or `npm run check`.

**Pre-merge grep gate** — the regex above. Zero hits outside picker.

## 8. Release

- Version: `5.1.2` → `5.2.0` (minor bump: visible UI redesign, no API-level breaking changes).
- `package.json` gains `simulate-ui` script + `tsx` devDep.
- `README.md` adds a dev subsection with `npx tsx scripts/simulate-ui.ts` examples.
- Release notes include before/after ASCII samples, preview command, note on what's deferred (picker → v5.3).

## 9. Non-goals

- `/todos` interactive picker redesign (v5.3).
- Snapshot regression tooling beyond vitest snapshot tests (already in place).
- Per-terminal theming overrides beyond what `ui/theme.ts` already supports.
- Compatibility shim for legacy glyph callers — we delete old code in the same commit.

# pi-superpowers Subagents (M4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `superpowers_subagent` tool that dispatches named superpowers agents via pi-agents' `runAgent`. Supports single / parallel / chain modes with full TUI rendering. Releases as `v5.0.9`.

**Architecture:** Extension discovers agents from `vendor/superpowers/agents/*.md`, transforms CC-style frontmatter into whatever minimal config pi-agents accepts, dispatches in-process via pi-agents runtime (with subprocess fallback reserved for a future release). All rendering uses the `ui/` primitives built in Plan 1.

**Tech Stack:** `pi-agents` (peer dep via git URL), `gray-matter` (frontmatter parsing), `@sinclair/typebox`.

**Reference spec:** `docs/specs/2026-04-18-pi-superpowers-design.md` §8.3, §10.3 (Subagents section).

---

## File Structure

| Path | Purpose |
|---|---|
| `src/subagents/schema.ts` | Typebox input schema (single/parallel/chain discriminated union) |
| `src/subagents/schema.test.ts` | validation tests |
| `src/subagents/frontmatter.ts` | parse CC-style agent frontmatter into `AgentFrontmatterLike` |
| `src/subagents/frontmatter.test.ts` | unit tests |
| `src/subagents/loader.ts` | async scan of `vendor/superpowers/agents/*.md` |
| `src/subagents/loader.test.ts` | unit tests with fixture dir |
| `src/subagents/transform.ts` | CC frontmatter → pi-agents minimal run config |
| `src/subagents/transform.test.ts` | unit tests |
| `src/subagents/dispatch.ts` | single/parallel/chain wrappers calling pi-agents |
| `src/subagents/dispatch.test.ts` | unit tests with mocked `runAgent` |
| `src/subagents/render.ts` | panel + per-mode rendering |
| `src/subagents/render.test.ts` | snapshot tests |
| `src/subagents/tool.ts` | `superpowers_subagent` tool |
| `src/subagents/tool.test.ts` | action coverage |
| `src/subagents/subagents-e2e.test.ts` | gated e2e |
| Update `src/index.ts` | register tool only if pi-agents available |
| Update `src/api.ts` | export public surface |

---

## Task 1: Subagent schema

**Files:** `src/subagents/schema.ts` + test.

- [ ] Write failing tests validating: single `{ agent, task }`, parallel `{ tasks: [...] }`, chain `{ chain: [...] }`. Invalid variants rejected.
- [ ] Implement Typebox discriminated union via `detectMode(input)` helper.
- [ ] `npm run check` green. Commit.

## Task 2: Frontmatter parser

**Files:** `src/subagents/frontmatter.ts` + test.

- [ ] Write failing test: given a markdown string with `---\nname: x\ndescription: y\ntools: a,b\nmodel: inherit\n---\nbody`, return `{ name, description, tools, model, body }`.
- [ ] Implement using `gray-matter`. Normalize `tools` (may be comma-list or array).
- [ ] Handle missing frontmatter (returns `null`). Handle body-only (returns partial).
- [ ] `npm run check` green. Commit.

## Task 3: Agent loader

**Files:** `src/subagents/loader.ts` + test.

- [ ] Write failing test: given a fixture dir with `code-reviewer.md` and `invalid.md`, `loadAgents(dir)` returns only valid entries with diagnostics for invalid ones.
- [ ] Implement using `node:fs/promises` readdir + frontmatter parser. Validate `name` non-empty.
- [ ] `npm run check` green. Commit.

## Task 4: Transform to runtime config

**Files:** `src/subagents/transform.ts` + test.

- [ ] Write failing test: given an `AgentFrontmatterLike` and a task string, returns `{ systemPrompt, task, tools, modelHint }` ready for `runAgent`.
- [ ] Implement: `systemPrompt = body + pi-compat note`; `tools = frontmatter.tools ?? defaultTools`; `modelHint = frontmatter.model ?? "inherit"`.
- [ ] `npm run check` green. Commit.

## Task 5: Dispatch wrapper

**Files:** `src/subagents/dispatch.ts` + test.

- [ ] Write failing tests for single/parallel/chain using a `runAgent`-like injected mock. Assert call shapes, cancellation propagation via AbortSignal, error surfacing in metrics.
- [ ] Implement dispatch helpers that take `(runAgent, config, signal, onUpdate)` and return `{ content, metrics, perRunResults? }`.
- [ ] `npm run check` green. Commit.

## Task 6: Render

**Files:** `src/subagents/render.ts` + test.

- [ ] Write failing tests: header `🤖 code-reviewer · single`, panel with metrics footer (tokens, duration, cost), parallel per-row glyphs `[✓]/[⋯]/[ ]`, chain step summaries.
- [ ] Implement using `ui/box.panel` + `ui/progress.spinnerFrame`. Accept metrics shape `{ inTok, outTok, durationMs, usd?, toolCalls? }`.
- [ ] Snapshot tests at widths 60/90/120.
- [ ] `npm run check` green. Commit.

## Task 7: Tool wiring

**Files:** `src/subagents/tool.ts` + test.

- [ ] Write failing test with mocked pi-agents: call tool with single/parallel/chain, assert result content + details.
- [ ] Implement `buildSubagentTool({ loadAgents, runAgent, subagentAvailable })` factory so `runAgent` can be injected for tests and real pi-agents loaded lazily in production.
- [ ] If not available, tool returns a clear error result; do not register.
- [ ] `npm run check` green. Commit.

## Task 8: Wire into index.ts + api.ts

- [ ] Dynamic `import("pi-agents")` inside `index.ts`; if present, build dispatch via `runAgent` and register `superpowers_subagent`. Otherwise skip registration.
- [ ] Update `api.ts` exports.
- [ ] `npm run check` green. Commit.

## Task 9: E2E gate

**Files:** `src/subagents/subagents-e2e.test.ts`.

- [ ] Write gated e2e (`E2E_SUBAGENTS=1 + PI_BIN`): spawn real pi session, call `superpowers_subagent` with `{ agent: "code-reviewer", task: "..." }`, assert result contains expected structure.
- [ ] Commit.

## Task 10: Release v5.0.9

- [ ] Bump `package.json` → `5.0.9`.
- [ ] Commit `chore: release v5.0.9 — subagents feature`.
- [ ] Tag `v5.0.9`, push `--follow-tags`.
- [ ] `gh release create v5.0.9`.

---

## Definition of Done

- 107 + ~25 new unit tests pass.
- `pi install git:github.com/josorio7122/pi-superpowers@v5.0.9` installs cleanly.
- If `pi-agents` is installed alongside, `superpowers_subagent` tool is registered and callable with the bundled `code-reviewer` agent.
- If `pi-agents` is absent, extension loads without error; tool is not registered; bootstrap addendum warns about unavailability.

## Spec coverage

- §8.3 subagent dispatch flow → Tasks 3, 4, 5, 7.
- §10.3 subagent rendering (single/parallel/chain panels, streaming header, cancelled state) → Task 6.
- §3 decision 5 (pi-agents peer, git URL, runtime transform) → Tasks 2, 4, 5.
- §9 degradation: pi-agents missing → tool not registered, bootstrap addendum adjusts → Task 8.

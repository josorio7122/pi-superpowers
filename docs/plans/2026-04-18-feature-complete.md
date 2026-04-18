# pi-superpowers v5.0.10 Feature-Complete Implementation Plan

**Goal:** Close all gaps in v5.0.9 and ship `v5.0.10` that is genuinely feature-complete *for what it ships*. Subagent tool is **feature-flagged off** pending proper pi-agents integration design in v5.1.

**Architecture:** No new features. Five fix tasks + one honest scope reduction + one deferred-to-v5.1 design note.

**Rationale for scope cut:** pi-agents' `runAgent` requires a fully-structured `AgentConfig` (strict zod schema with role/color/icon/domain/skills/knowledge/conversation fields) + `modelRegistry` / `sessionDir` / `conversationLogPath` from pi's runtime. Upstream superpowers agent files only have minimal CC-style frontmatter. Synthesizing a working `AgentConfig` from that needs design + coordination with `pi-agents` maintainer. Ship the rest feature-complete now; do subagents properly in v5.1.

**Reference specs:**
- `docs/specs/2026-04-18-pi-superpowers-design.md`
- Prior plans: `2026-04-18-foundation.md`, `2026-04-18-todos.md`, `2026-04-18-subagents.md`

---

## File Structure Changes

| Path | Action | Purpose |
|---|---|---|
| `src/bootstrap/inject-e2e.test.ts` | Modify | Assert injection via session entries, not model output |
| `src/todos/todos-e2e.test.ts` | Create | Exercise tool through pi's real runtime |
| `src/index.ts` | Modify | Feature-flag off subagent registration (env var); verify `ctx.ui.custom` signature |
| `src/subagents/dispatch.ts` | Modify | Remove (was wrong abstraction); keep types used elsewhere |
| `src/subagents/tool.ts` | Modify | Move integration to `if (SUPERPOWERS_SUBAGENT_ENABLED)` gate |
| `docs/specs/2026-04-23-subagents-v5.1-design.md` | Create | Design for real pi-agents integration (not for implementation now) |
| `README.md` | Modify | Honest feature matrix; flag subagent tool as deferred |

---

## Task 1: Bootstrap E2E — check injection, not model output

**Problem:** Current assertion `expect(output).toContain("superpowers_todo")` is brittle — depends on LLM behavior. Many reasons the model might not use that exact phrase.

**Fix:** Write an assertion that checks the bootstrap **was injected** by looking at the JSON stream for our `customType: "superpowers-bootstrap"` message event.

**Files:** Modify `src/bootstrap/inject-e2e.test.ts`.

- [ ] Rewrite the test: run `pi --mode json -p --no-session -e ./src/index.ts` with prompt "hi". Buffer stdout JSON lines. Assert at least one JSON line contains `"customType":"superpowers-bootstrap"` OR the content `"<EXTREMELY_IMPORTANT>\\nYou have superpowers"` (our injected sentinel).
- [ ] Remove `E2E_BOOTSTRAP` gate — this is now a reliable assertion, should run whenever PI_BIN is set.
- [ ] Run with `PI_BIN=$(which pi) npx vitest run src/bootstrap/inject-e2e.test.ts`, must pass.

## Task 2: Todos E2E — exercise the tool

**Problem:** Plan 2 Task 9 was never written.

**Files:** Create `src/todos/todos-e2e.test.ts`.

- [ ] Write an E2E test that runs a pi session with prompt like: *"Use the superpowers_todo tool to add the item 'write tests' then list all todos, and print the result."*
- [ ] Assert stdout JSON stream contains a `toolCall` for `superpowers_todo` AND a tool result with details that include `"write tests"`.
- [ ] Gate behind `PI_BIN` presence (no opt-in flag — must work).

## Task 3: Verify `/todos` command against real `ctx.ui.custom`

**Problem:** I guessed `ctx.ui.custom(render, onKey)` signature without reading pi's docs.

**Files:** Read pi docs, modify `src/todos/command.ts` if signature is different.

- [ ] Read `/Users/josorio/Library/pnpm/global/5/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md` sections on `ctx.ui.custom`.
- [ ] If signature differs, adjust `src/todos/command.ts` and its tests.
- [ ] Run `/todos` in a real pi session (manual smoke), paste keystrokes j/k/space/a/test/q, verify behavior works or report findings.
- [ ] Update tests if the shape needed adjustment.

## Task 4: Verify widget rendering in real pi

**Problem:** Never actually saw `🦸 ▰▰▰▱▱ 2/5 · ...` in a real pi TUI.

**Files:** No code — verification task.

- [ ] Run real pi, trigger `superpowers_todo` with a few `add` calls.
- [ ] Observe: does the widget area show our string? Screenshot or note output.
- [ ] If widget API differs (e.g., pi uses different id format), adjust `src/ui/widget.ts`.

## Task 5: Remove `src/subagents/dispatch.ts`, use pi-agents primitives (where kept)

**Problem:** My dispatch layer reimplements pi-agents' `executeSingle/Parallel/Chain`. Even though the tool is about to be feature-flagged off, the code shouldn't stay in repo if it's the wrong abstraction.

**Decision:** Keep `dispatch.ts` for now since feature-flag hides the caller. Better to keep it coherent than half-refactor. v5.1 design will replace it with pi-agents primitives. Task is a no-op — just document the decision.

- [ ] No code change. Add a single comment at top of `src/subagents/dispatch.ts`: *"Feature-flagged off in v5.0.10. v5.1 will replace with pi-agents executeSingle/Parallel/Chain — see docs/specs/2026-04-23-subagents-v5.1-design.md."*

## Task 6: Feature-flag off `superpowers_subagent` tool

**Problem:** Current `src/index.ts` registers the tool if `pi-agents` is importable, but the call will crash because `RunConfig` ≠ `RunAgentParams`. Don't ship a crashing tool.

**Files:** Modify `src/index.ts`.

- [ ] Gate registration behind `process.env.SUPERPOWERS_SUBAGENT_ENABLED === "1"`. When unset (the default), do NOT register the tool, do NOT import pi-agents. Bootstrap addendum still reflects `subagentAvailable: false`.
- [ ] When gate is on AND pi-agents available AND the adapter exists (v5.1), register. Until then gate is effectively off for all users.
- [ ] Add a short log via `ctx.ui.notify` on session_start if the env var is set but the adapter is missing (future guard for v5.1).
- [ ] Keep bootstrap addendum text that already says "subagents unavailable" when `subagentAvailable` is false — tested already.

## Task 7: Write v5.1 subagent design (research spec, not implementation)

**Files:** Create `docs/specs/2026-04-23-subagents-v5.1-design.md`.

- [ ] One-pager design covering:
  - **Goal:** real `superpowers_subagent` that dispatches via `pi-agents` primitives (`executeSingle`/`Parallel`/`Chain`).
  - **Open questions** to resolve with Mario: (1) how to obtain `modelRegistry`/`sessionDir`/`conversationLogPath` from a pi extension context? (2) what are reasonable synthesized defaults for `role`, `color`, `icon`, `domain`, `skills`, `knowledge`, `conversation.path` when only minimal CC-style frontmatter exists upstream? (3) should pi-agents grow an adapter intake mode, or should pi-superpowers synthesize?
  - **Proposed architecture:** factory `buildAgentRunFn(agentConfig, pi ctx) → RunAgentFn`, then `executeSingle({ task, runAgent })` style. Delete local `dispatch.ts`.
  - **Testing:** real e2e against `code-reviewer` + one other bundled agent.
  - **Non-goals:** subprocess mode, agent-file editing, pi-agents core changes.

## Task 8: Honest README + release notes update

**Files:** `README.md`, release body for v5.0.10.

- [ ] README: change "What you get" to distinguish **shipped** vs **planned**. Remove `superpowers_subagent` from shipped, move to planned/v5.1.
- [ ] Release notes for v5.0.10: *"Feature-complete corrections to v5.0.9. Bootstrap + todos now with real E2E coverage. Widget verified. `superpowers_subagent` feature-flagged off pending proper pi-agents integration in v5.1 — see `docs/specs/2026-04-23-subagents-v5.1-design.md`."*

## Task 9: Release v5.0.10

- [ ] `npm run check` green.
- [ ] `PI_BIN=$(which pi) npx vitest run --reporter=verbose` — all E2E green (bootstrap + todos).
- [ ] Bump `package.json` → `5.0.10`.
- [ ] Commit, tag `v5.0.10`, push `--follow-tags`.
- [ ] `gh release create v5.0.10`.

---

## Definition of Done

- 150+ unit tests pass.
- **Bootstrap E2E** passes against real pi, no gates.
- **Todos E2E** passes against real pi, no gates.
- `/todos` command verified to open an interactive picker in real pi (manual smoke captured in notes).
- Widget rendering verified in real pi TUI (manual smoke captured in notes).
- `superpowers_subagent` tool is NOT registered when `SUPERPOWERS_SUBAGENT_ENABLED` is unset (i.e. default); verified by inspecting `pi list --tools` output or equivalent.
- `README.md` reflects truth.
- `v5.0.10` tagged, pushed, release notes published.
- `docs/specs/2026-04-23-subagents-v5.1-design.md` exists and enumerates the real integration questions.

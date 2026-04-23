# Fix `/skill:name` Adapter Lie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove pi-superpowers' false `/skill:name` promise from model-facing text so the model stops trying to invoke a user-only slash command and instead uses `read` on skill `<location>` paths, matching Pi's own system-prompt language.

**Architecture:** Two source files own misleading strings that tell the model it can load skills via `/skill:name`. That slash command is implemented in Pi only for user-input expansion (`dist/core/agent-session.js:_expandSkillCommand`, called from `steer()` / `followUp()`), not as a tool the model can invoke. We rewrite the adapter's tool-mapping footer and bootstrap intro to reference the `read` + `<available_skills>` + `<location>` flow that already works. Scope is intentionally narrow: adapter-owned text only — vendor skills, README user docs, and historical plan/spec documents stay untouched.

**Tech Stack:** TypeScript strict ESM, vitest, Biome. No dependency changes.

---

## File structure

| Path | Change |
|---|---|
| `src/compat/tool-mapping.ts` | Remove `Skill` entry from `TOOL_MAPPING`; rewrite footer line to point at `read` + `<location>` |
| `src/compat/tool-mapping.test.ts` | Drop `Skill` mapping assertion; replace `/skill:/` regex test with new read-on-location assertion |
| `src/bootstrap/inject.ts` | Rewrite intro string on line 69 so it references `read` on SKILL.md `<location>` instead of `/skill:name` loader |
| `src/bootstrap/inject.test.ts` | Add regression test: bootstrap body contains `<available_skills>` + `read` guidance; does not contain the literal `/skill:name` |
| `src/bootstrap/addendum.test.ts` | Replace `"mentions pi-native /skill:name"` test with new read-on-location assertion |

### Out of scope

- `vendor/superpowers/skills/**` — upstream `obra/superpowers`, not touched.
- `README.md:27` — user-facing marketing; user typing `/skill:brainstorming` in the Pi TUI is the correct Pi idiom and works (`dist/core/agent-session.js:828`).
- `docs/plans/**`, `docs/specs/**` — historical plans kept as-is; they describe past decisions, not runtime behavior.
- No new announcement rules or re-assertion added to `addendum.ts`. Thin-adapter principle: vendor SKILL.md bodies own workflow discipline; the adapter only bridges tool-name and skill-loading mechanics.

---

## Task 1: Tool mapping — drop `Skill` entry and rewrite footer

**Files:**
- Modify: `src/compat/tool-mapping.ts:13` (remove line), `src/compat/tool-mapping.ts:22-28` (rewrite return block)
- Modify: `src/compat/tool-mapping.test.ts:14` (drop assertion), `src/compat/tool-mapping.test.ts:33-35` (replace test)

- [ ] **Step 1: Update the tool-mapping tests first (TDD — failing tests drive change)**

Replace `src/compat/tool-mapping.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { renderToolMappingMarkdown, TOOL_MAPPING } from "./tool-mapping.js";

describe("TOOL_MAPPING", () => {
  it("maps every critical CC tool to a pi equivalent", () => {
    expect(TOOL_MAPPING.Read).toBe("read");
    expect(TOOL_MAPPING.Write).toBe("write");
    expect(TOOL_MAPPING.Edit).toBe("edit");
    expect(TOOL_MAPPING.Bash).toBe("bash");
    expect(TOOL_MAPPING.Grep).toBe("grep");
    expect(TOOL_MAPPING.Glob).toBe("glob");
    expect(TOOL_MAPPING.TodoWrite).toBe("task");
    expect(TOOL_MAPPING.Task).toBe("agent");
  });

  it("does not expose Skill as a model-invokable mapping", () => {
    expect((TOOL_MAPPING as Record<string, string>).Skill).toBeUndefined();
  });

  it("has no duplicate pi values", () => {
    const values = Object.values(TOOL_MAPPING);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    expect(dupes).toEqual([]);
  });
});

describe("renderToolMappingMarkdown", () => {
  it("produces a markdown table with all mappings", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toContain("| Claude Code | pi equivalent |");
    expect(md).toContain("| `Read` | `read` |");
    expect(md).toContain("| `TodoWrite` | `task` |");
    expect(md).toContain("| `Task` | `agent` |");
  });

  it("does not include a Skill row (not a model-invokable tool)", () => {
    const md = renderToolMappingMarkdown();
    expect(md).not.toContain("| `Skill` |");
  });

  it("directs the model to read SKILL.md at the location listed in <available_skills>", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toContain("<available_skills>");
    expect(md).toContain("<location>");
    expect(md).toContain("`read`");
  });

  it("does not tell the model to invoke /skill:name", () => {
    expect(renderToolMappingMarkdown()).not.toMatch(/\/skill:/);
  });
});
```

- [ ] **Step 2: Run the tool-mapping tests — expect fail**

Run: `npx vitest run src/compat/tool-mapping.test.ts`

Expected: at least three failures — `TOOL_MAPPING.Skill` still equals `"/skill:name (pi-native)"`, the footer still matches `/\/skill:/`, and the footer does not contain `<available_skills>`.

- [ ] **Step 3: Update `src/compat/tool-mapping.ts`**

Replace the file contents with:

```ts
// Single source of truth for Claude Code → pi tool name mapping.
// Used by bootstrap addendum and (optionally) runtime guards.

export const TOOL_MAPPING = {
  Read: "read",
  Write: "write",
  Edit: "edit",
  Bash: "bash",
  Grep: "grep",
  Glob: "glob",
  TodoWrite: "task",
  Task: "agent",
} as const;

export type ClaudeCodeToolName = keyof typeof TOOL_MAPPING;

export function renderToolMappingMarkdown(): string {
  const rows = (Object.keys(TOOL_MAPPING) as ClaudeCodeToolName[])
    .map((cc) => `| \`${cc}\` | \`${TOOL_MAPPING[cc]}\` |`)
    .join("\n");
  return [
    "| Claude Code | pi equivalent |",
    "|---|---|",
    rows,
    "",
    "To load a skill listed in `<available_skills>`, use `read` on its `<location>` path (e.g. `read /Users/.../vendor/superpowers/skills/brainstorming/SKILL.md`). The `/skill:name` command is a user-only TUI shortcut and cannot be invoked from assistant tool calls.",
  ].join("\n");
}
```

Rationale for the `Skill` removal: `Skill` is not a pi tool. The pi-coding-agent harness exposes `/skill:name` only through `AgentSession._expandSkillCommand`, which is reachable from `steer()` and `followUp()` — both consume user input text from the TUI. An assistant-side tool call named `Skill` or a string starting with `/skill:` in assistant output has no effect. Keeping the row in the table invited the model to try it and silently fail.

- [ ] **Step 4: Run the tool-mapping tests — expect pass**

Run: `npx vitest run src/compat/tool-mapping.test.ts`

Expected: all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/compat/tool-mapping.ts src/compat/tool-mapping.test.ts
git commit -m "fix(compat): drop Skill from TOOL_MAPPING and rewrite footer to point at read+<location>"
```

---

## Task 2: Addendum — replace `/skill:name` mention with read-on-location assertion

**Files:**
- Modify: `src/bootstrap/addendum.test.ts:12-14`

(`src/bootstrap/addendum.ts` itself calls `renderToolMappingMarkdown()`, so the user-visible addendum updates automatically once Task 1 lands.)

- [ ] **Step 1: Update `src/bootstrap/addendum.test.ts`**

Replace the `it("mentions pi-native /skill:name", ...)` test (lines 12-14 in the current file) with:

```ts
it("directs the model to read SKILL.md at the location listed in <available_skills>", () => {
  const text = renderPiAddendum({ subagentAvailable: true });
  expect(text).toContain("<available_skills>");
  expect(text).toContain("<location>");
  expect(text).toContain("`read`");
});

it("does not tell the model to invoke /skill:name", () => {
  expect(renderPiAddendum({ subagentAvailable: true })).not.toMatch(/\/skill:/);
});
```

Leave every other test in this file as-is.

- [ ] **Step 2: Run the addendum tests — expect pass (source already fixed in Task 1)**

Run: `npx vitest run src/bootstrap/addendum.test.ts`

Expected: all tests green. If the two new tests fail, re-check that Task 1 actually edited `tool-mapping.ts` — `renderPiAddendum` delegates to `renderToolMappingMarkdown`.

- [ ] **Step 3: Commit**

```bash
git add src/bootstrap/addendum.test.ts
git commit -m "test(addendum): replace /skill:name assertion with read+<location> expectation"
```

---

## Task 3: Bootstrap inject — rewrite the intro string

**Files:**
- Modify: `src/bootstrap/inject.ts:69`
- Modify: `src/bootstrap/inject.test.ts` (add regression test)

- [ ] **Step 1: Add a regression test to `src/bootstrap/inject.test.ts`**

Append this `it` block to the `describe("buildInjectHandler", ...)` suite (after the existing `"injects only the addendum if skill file missing"` test):

```ts
it("does not tell the model to use /skill:name; points at read + <available_skills> + <location>", async () => {
  const skillPath = await fixtureSkill("# using-superpowers\n\nBody content");
  const handler = buildInjectHandler({ usingSkillPath: skillPath, subagentAvailable: true });
  const out = await handler(
    { prompt: "hi", images: [], systemPrompt: "" },
    mockCtx([{ role: "user", content: "hi" }]),
  );
  const content = out?.message?.content ?? "";
  expect(content).not.toMatch(/\/skill:/);
  expect(content).toContain("<available_skills>");
  expect(content).toContain("<location>");
  expect(content.toLowerCase()).toContain("read");
});
```

- [ ] **Step 2: Run the inject tests — expect fail on the new case**

Run: `npx vitest run src/bootstrap/inject.test.ts`

Expected: the new test fails — the bootstrap content still contains the string `` pi's `/skill:name` loader ``.

- [ ] **Step 3: Rewrite `src/bootstrap/inject.ts:69`**

Open `src/bootstrap/inject.ts`. Replace line 69:

```ts
"**Below is the full content of your 'superpowers:using-superpowers' skill — your introduction to using skills. For all other skills, use pi's `/skill:name` loader.**",
```

with:

```ts
"**Below is the full content of your 'superpowers:using-superpowers' skill — your introduction to using skills. For every other skill, find it in the `<available_skills>` section of the system prompt and `read` the SKILL.md at the `<location>` path shown there.**",
```

Do not change any other line in this file.

- [ ] **Step 4: Run the inject tests — expect pass**

Run: `npx vitest run src/bootstrap/inject.test.ts`

Expected: all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/inject.ts src/bootstrap/inject.test.ts
git commit -m "fix(bootstrap): replace /skill:name loader reference with read+<location> instruction"
```

---

## Task 4: Full check — lint, typecheck, test suite, parity-check

**Files:** none modified (verification only)

- [ ] **Step 1: Run the project check pipeline**

Run: `npm run check`

(That alias runs `biome check src/` → blank-line lint → `tsc --noEmit` → `vitest run` → `tsx scripts/parity-check.ts`, per `package.json`.)

Expected: all stages pass.

- [ ] **Step 2: If lint auto-fixes modified any files, review and commit**

Run: `git status`

If there is any staged/unstaged diff from the lint stage, inspect it with `git diff`, confirm it is mechanical (whitespace / import order) and not semantic. Then:

```bash
git add -u
git commit -m "style: biome auto-fix after /skill:name removal"
```

If no diff, skip this step.

- [ ] **Step 3: Run the full E2E suite (opt-in)**

Run: `PI_E2E=1 npm run test:e2e`

Expected: pass. If it fails on something unrelated to the three files modified here (e.g. Pi harness changes, network), note the failure but do not block the PR — the unit + parity-check coverage is what this plan is validating.

- [ ] **Step 4: Manual smoke check — the addendum is human-readable**

Run: `node --input-type=module -e "import {renderPiAddendum} from './src/bootstrap/addendum.js'; console.log(renderPiAddendum({subagentAvailable: true, availableAgents: ['general-purpose', 'code-reviewer']}))"`

Expected: the printed markdown mentions `<available_skills>` and `<location>`, uses the word `read` in the skill-loading footer, and does not contain the substring `/skill:`.

(If module resolution complains because `src/` is TS, run `npx tsx -e "..."` instead.)

---

## Self-review checklist (written against the spec before handing off)

**Spec coverage**
- `src/compat/tool-mapping.ts:13` Skill entry removal — Task 1, Step 3 ✓
- `src/compat/tool-mapping.ts:27` footer rewrite — Task 1, Step 3 ✓
- `src/bootstrap/inject.ts:69` intro rewrite — Task 3, Step 3 ✓
- Test updates in `tool-mapping.test.ts` and `addendum.test.ts` — Tasks 1 and 2 ✓
- New regression test in `inject.test.ts` — Task 3, Step 1 ✓
- Final verification via `npm run check` — Task 4 ✓
- Out-of-scope items explicitly listed so reviewers don't ask — File-structure section ✓

**Placeholder scan:** No `TBD`, `TODO`, `similar to Task N`, or "add validation" patterns. Every code step shows exact code or exact command.

**Type consistency:** No new types introduced. `ClaudeCodeToolName = keyof typeof TOOL_MAPPING` naturally narrows from 9 keys to 8 once `Skill` is removed; this is the intended effect and no other file imports `"Skill"` specifically (verified via the `grep -rn "skill:name\|/skill:" src/` survey — all hits are inside the three files modified or inside `.test.ts` files already covered).

**Remaining risks flagged for the reviewer**
1. The `README.md:27` line `| **14 superpowers skills** | /skill:brainstorming, /skill:writing-plans, etc. |` is intentionally kept — it describes the user experience (users type `/skill:X` in the TUI to force-load a skill), not what the agent should do. Reviewer may still want to clarify the wording later, but it is not causing the adapter bug this plan targets.
2. `docs/plans/**` and `docs/specs/**` still reference `/skill:name`. These are historical documents describing past decisions; rewriting them would be ahistorical. Any new plans should use the updated phrasing from this PR.
3. This plan does NOT fix the broader inconsistencies observed in sessions 710/788/79f (skill-announcement drop, subagent-driven-development loop not followed, verification-before-completion bypass, compaction dropping user intent, pi-tasks silent failures on bad `add {status}` / `complete {bad id}`). Those are vendor / Pi-core / pi-tasks upstream issues tracked separately.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-23-fix-skill-name-adapter-lie.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Works well here because each task is genuinely independent (test → source → commit).

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints for review.

Which approach?

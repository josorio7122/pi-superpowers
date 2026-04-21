# Harness Parity with pi-agents / pi-tasks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring pi-superpowers' repo harness (governance docs, TS/Biome config, pre-commit, test config, GitHub CI) to parity with the `pi-agents` / `pi-tasks` reference repos.

**Architecture:** Port the harness skeleton from `pi-tasks` (smaller surface than `pi-agents`) and adapt for pi-superpowers' specifics: (1) this repo ships `pi-agents` / `pi-tasks` / `chalk` / `gray-matter` / `typebox` as **`dependencies`** not `peerDependencies` because it bundles them rather than coexisting in a host, (2) there is a `vendor/superpowers/` directory treated as read-only upstream mirror, (3) docs already live under `docs/specs/` + `docs/plans/` which stays. The reformat from tab-indent to 2-space-indent is a single large churn commit isolated from behavior changes.

**Tech Stack:** npm, Biome 2.4.x, TypeScript 6, Vitest 4, `simple-git-hooks`, `lint-staged`, GitHub Actions.

**Reference repos:** `/Users/josorio/Code/pi-agents`, `/Users/josorio/Code/pi-tasks` — treat `pi-tasks` as the canonical minimal template.

**Pre-flight assumption:** Work on `main` or a dedicated branch `feature/harness-parity`. Every task ends in one commit. Do **not** add `Co-Authored-By` trailers — both reference AGENTS.md files ban them.

---

## Phase 1 — Governance docs (zero code risk)

### Task 1: Move loose root-level design docs under `docs/specs/`

Two design markdowns live at the repo root. Both reference repos keep the root clean — only README / LICENSE / governance files at root, everything else under `docs/`.

**Files:**
- Move: `IMPLEMENTATION-DESIGN.md` → `docs/specs/2026-04-18-implementation-design.md`
- Move: `PI-AGENTS-INTEGRATION.md` → `docs/specs/2026-04-18-pi-agents-integration.md`
- Modify (if it references either): `README.md`

- [ ] **Step 1: Move files with `git mv`** (preserves history)

```bash
cd /Users/josorio/Code/pi-superpowers
git mv IMPLEMENTATION-DESIGN.md docs/specs/2026-04-18-implementation-design.md
git mv PI-AGENTS-INTEGRATION.md docs/specs/2026-04-18-pi-agents-integration.md
```

- [ ] **Step 2: Check for inbound links**

```bash
grep -rn "IMPLEMENTATION-DESIGN\|PI-AGENTS-INTEGRATION" README.md docs/ src/ scripts/ 2>/dev/null
```
If matches exist, update them to the new paths.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: move root-level design docs under docs/specs/"
```

---

### Task 2: Add `LICENSE`

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Copy MIT text from pi-tasks**

```bash
cp /Users/josorio/Code/pi-tasks/LICENSE /Users/josorio/Code/pi-superpowers/LICENSE
```

- [ ] **Step 2: Verify copyright line says `Copyright (c) 2026 josorio7122`**

```bash
head -3 LICENSE
```
Expected: `MIT License` / blank / `Copyright (c) 2026 josorio7122`

- [ ] **Step 3: Commit**

```bash
git add LICENSE
git commit -m "docs: add MIT LICENSE"
```

---

### Task 3: Add `CODE_OF_CONDUCT.md` and `SECURITY.md`

**Files:**
- Create: `CODE_OF_CONDUCT.md`
- Create: `SECURITY.md`

- [ ] **Step 1: Copy COC verbatim from pi-tasks**

```bash
cp /Users/josorio/Code/pi-tasks/CODE_OF_CONDUCT.md /Users/josorio/Code/pi-superpowers/CODE_OF_CONDUCT.md
```

- [ ] **Step 2: Create `SECURITY.md`** — adapt pi-tasks' scope section for pi-superpowers surfaces

Write this exact content to `SECURITY.md`:

```markdown
# Security Policy

## Supported versions

Only the latest minor version is supported. Security fixes are released as patch versions against that line.

| Version | Supported |
|---------|-----------|
| 5.6.x   | ✅        |
| < 5.6   | ❌        |

## Reporting a vulnerability

Please report security issues privately via GitHub's security advisory feature:

[Report a vulnerability →](https://github.com/josorio7122/pi-superpowers/security/advisories/new)

You can also email: josorio7122@gmail.com

I'll acknowledge within 72 hours and provide a fix timeline within 7 days. Do not open a public issue for security reports.

## Scope

In scope:
- The bootstrap injector (`src/bootstrap/`) — what gets injected into pi sessions and how.
- The subagent dispatcher (`src/subagents/`) — agent config building, frontmatter parsing, loader boundary.
- The skill broadcaster (`src/skills/`) — skill discovery, frontmatter expansion.
- The multi-session coordinator (`src/multi-session/`) — cross-session state and tmpdir handling.
- The public API (`src/api.ts`).

Out of scope:
- Vulnerabilities in pi's own runtime (`@mariozechner/pi-coding-agent`) — report upstream at [pi-mono](https://github.com/badlogic/pi-mono).
- Upstream Superpowers skills under `vendor/superpowers/` — report at [obra/superpowers](https://github.com/obra/superpowers).
- Dependency vulnerabilities in `gray-matter` / `chalk` / typebox without a pi-superpowers-specific attack vector.
```

- [ ] **Step 3: Commit**

```bash
git add CODE_OF_CONDUCT.md SECURITY.md
git commit -m "docs: add CODE_OF_CONDUCT and SECURITY policy"
```

---

### Task 4: Add `CHANGELOG.md` seeded from git history

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1: Survey recent tags/commits for changelog material**

```bash
git log --oneline -40
git tag --sort=-v:refname | head -10
```

- [ ] **Step 2: Write `CHANGELOG.md`** with one entry per shipped version since v5.1. Scrape commit summaries for bullets.

```markdown
# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Repo harness parity with pi-agents / pi-tasks: AGENTS.md, CONTRIBUTING.md,
  LICENSE, CODE_OF_CONDUCT.md, SECURITY.md, GitHub CI, dependabot, issue
  templates, pre-commit via simple-git-hooks + lint-staged, stricter
  tsconfig (NodeNext, verbatimModuleSyntax), aligned biome config
  (2-space indent, full rule set, test overrides).

## [5.6.0] — 2026-04-20

### Added
- Dynamic skill frontmatter for dispatched agents: every dispatched subagent
  receives the full Superpowers skill corpus inlined into its system prompt.

### Fixed
- Fall back to `mkdtemp("pi-superpowers-ephemeral-")` under `$TMPDIR` when
  `sessionManager.getSessionDir()` returns empty (pi `--no-session` mode).

## [5.5.0] — 2026-04-19

### Changed
- Extracted task + agent tools into standalone pi packages: consumes
  pi-tasks and pi-agents raw instead of in-tree implementations.

## [5.4.0] — 2026-04-18

### Added
- Subagent UX: live streaming of dispatched agent output, abort handling.

## [5.3.0] — 2026-04-18

### Changed
- Upstream parity pass against obra/superpowers — skill/command/agent loaders
  pick up new upstream entries generically.

## [5.1.0] — 2026-04-18

Initial feature-complete release.

- 15 superpowers skills auto-registered from `vendor/superpowers/`.
- First-turn bootstrap injects `using-superpowers` + pi tool mapping.
- Native `superpowers_todo` tool (via pi-tasks).
- Native `superpowers_subagent` tool (via pi-agents) with single / parallel / chain modes.
- Persistent above-editor todo widget.
- Session-start status footer.
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: seed CHANGELOG from git history"
```

---

### Task 5: Add `CONTRIBUTING.md`

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Write `CONTRIBUTING.md`** — adapted from pi-tasks with pi-superpowers specifics:

```markdown
# Contributing to pi-superpowers

Thanks for considering a contribution! This project is small and opinionated — please follow the conventions below.

## Development setup

```bash
git clone https://github.com/josorio7122/pi-superpowers
cd pi-superpowers
npm install
npm run check          # lint + typecheck + unit tests + parity-check
npm run simulate-ui:all  # visual QA of every TUI surface
```

## Running end-to-end tests

E2E tests spawn the real `pi` CLI and assert on its output. They live in `*-e2e.test.ts` files, are excluded from the default `npm run check`, and use a dedicated `vitest.e2e.config.ts`.

```bash
export PI_BIN=/path/to/pi
npm run test:e2e                                # fast lane (~3–5 min)
PI_BIN=$(which pi) E2E_FULL=1 npm run test:e2e:full  # full lane (~10 min, costs tokens)
```

## Code style

- **Pi compliance is non-negotiable.** Never shadow pi's `Theme`, `ThemeColor`, `ToolDefinition`, `ExtensionContext`, `AgentToolResult` types. Import from `@mariozechner/pi-coding-agent`.
- **No raw ANSI escapes** in production code. Use `theme.fg(slot, text)` / `theme.bold(text)` / etc.
- **Strings:** don't assemble literal text with `+` or array-then-`.join()`. Multi-line prose uses a template literal + `.replace(/\s+/g, " ").trim()`.
- **Typebox for schemas**, not zod.
- **Biome enforces:** no `any`, no non-null assertions (`!`), no barrel files (except `src/api.ts`), max 2 params per function, 120-char lines, kebab-case filenames, 2-space indent.
- **File size:** aim for < 200 LOC per file. Split by responsibility when exceeded.
- **Tests colocate:** `foo.ts` → `foo.test.ts`. E2E tests use the `-e2e.test.ts` suffix.
- **`vendor/superpowers/` is read-only** — never hand-edit upstream files; run `./scripts/sync-upstream.sh vX.Y.Z` to refresh.

## Commit messages

- Format: `type(scope): description` — conventional commits. Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`, `style`.
- **No `Co-Authored-By` trailers** — especially no AI attribution.
- Breaking changes use `!`: `feat(api)!: rename buildInjectHandler config`.

## Pull requests

- Branch off `main`. Name: `feature/<short-name>`, `fix/<short-name>`.
- CI (`npm run check`) must pass before merge. PRs squash-merge only.

## What belongs in pi-superpowers

- Bootstrap injection of `using-superpowers` + pi tool mapping.
- Skill / command / agent loaders that consume `vendor/superpowers/`.
- Dispatch-time frontmatter expansion for subagents.
- TUI surfaces (status, widget, progress, panel) specific to superpowers UX.

## What does NOT belong

- Upstream skill content itself — those live in `vendor/superpowers/` and sync from [obra/superpowers](https://github.com/obra/superpowers).
- Generic task / agent infrastructure — belongs in `pi-tasks` / `pi-agents`.
- Changes to pi-core types or contracts — upstream to [pi-mono](https://github.com/badlogic/pi-mono).

## Reporting issues

Use the GitHub issue tracker. For security issues, see [SECURITY.md](SECURITY.md).
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING guide"
```

---

### Task 6: Add `AGENTS.md`

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write `AGENTS.md`** — adapted from pi-tasks with pi-superpowers deltas called out. Key deltas:
  1. Uses `dependencies` not `peerDependencies` for pi packages (intentional — bundles them).
  2. `vendor/superpowers/` is a read-only mirror.
  3. The repo has specs/plans under `docs/`, and they ARE committed.

Write this to `AGENTS.md`:

```markdown
# Agent Instructions

Rules for AI agents (and humans) editing this repo. Short and enforced — read before writing code.

## Package manager

Use **npm**: `npm install`, `npm test`, `npm run check`.

## File-scoped commands

| Task | Command |
|------|---------|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npx biome check path/to/file.ts` |
| Lint fix | `npx biome check --fix path/to/file.ts` |
| Test file | `npx vitest run path/to/file.test.ts` |
| Test watch | `npx vitest path/to/file.test.ts` |
| Blank-line check | `bash scripts/check-blank-lines.sh` |
| Parity check | `npm run parity-check` |
| All checks | `npm run check` |
| E2E (gated) | `PI_BIN=$(which pi) npm run test:e2e` |

## Dependency layout (pi-superpowers-specific)

Unlike `pi-agents` / `pi-tasks`, this repo ships `pi-agents`, `pi-tasks`, `@sinclair/typebox`, `chalk`, and `gray-matter` as **`dependencies`**, not `peerDependencies`. Rationale: pi-superpowers bundles them for install-time self-containment (`pi install git:github.com/josorio7122/pi-superpowers`). The only `peerDependency` is `@mariozechner/pi-coding-agent`. Do not reshuffle these into peer deps without a deliberate discussion.

## Vendor directory (read-only)

`vendor/superpowers/` is a mirror of [obra/superpowers](https://github.com/obra/superpowers). **Never hand-edit files under `vendor/`.** To pick up upstream changes, run `./scripts/sync-upstream.sh vX.Y.Z` and then `npm run parity-check`. The parity-check script fails loudly if upstream adds a surface we don't handle.

## Strings

The rule targets *literal* string assembly, not variable concatenation.

- **Never build a string by joining string literals with `+`.** Use a template literal.
- **Never build a string by pushing literals into an array and `.join()`-ing it.** Same anti-pattern.
- **`a + b` with variables is fine.**
- **`.join()` is fine when the array IS the domain type** — e.g. widget lines.

## Pi compliance (non-negotiable)

- **Never shadow pi's types.** Import `Theme`, `ThemeColor`, `ToolDefinition`, `ExtensionContext`, `AgentToolResult`, `ExtensionAPI` directly from `@mariozechner/pi-coding-agent`.
- **No raw ANSI escapes (`\x1b[...]`) in production code.** Use `theme.fg(slot, text)`, `theme.bold(text)`.
- **Canonical `ThemeColor` slots only:** `accent`, `muted`, `dim`, `text`, `success`, `error`, `warning`.
- **Peer dep `@mariozechner/pi-coding-agent` uses `"*"`** per pi's `docs/packages.md`.

## TypeScript

- **No classes.** Factory functions + closures for stateful behavior.
- **Typebox for schemas**, not zod.
- **No `any`**, **no non-null assertions (`!`)**, **no barrel files except `src/api.ts`**. Enforced by biome.
- **No nested ternaries.** Enforced by biome. Use early returns or a helper.
- **Max 2 params per function.** Options object for anything longer.
- **Blank line between consecutive multi-line blocks at the same scope.** Enforced via `scripts/check-blank-lines.sh`, wired into `npm run check` as `lint:blanks`.
- **File size target: < 200 LOC.** Split by responsibility when exceeded.
- **ESM-only.** `.js` extensions on relative imports. `verbatimModuleSyntax` is on — use `import type` / `export type`.

## Tests

- **Co-locate:** `foo.ts` → `foo.test.ts`.
- **E2E tests use the `-e2e.test.ts` suffix** and run via `vitest.e2e.config.ts`. Gated on `PI_BIN`.
- **Prefer `vi.spyOn` over `vi.mock`** — `vi.mock` is last resort.
- **Prefer fakes and real objects over mocks.**
- `npm run check` before commit; `PI_BIN=$(which pi) npm run test:e2e` for E2E.

## Git

- **Conventional commits:** `type(scope): description`. Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`, `style`.
- **No `Co-Authored-By` trailers.** No AI attribution.
- **Breaking changes use `!`:** `feat(bootstrap)!: rename addendum config`.
- **Branch protection is on `main`** — CI (`check`) must pass before merge. Squash-merge only.

## Docs discipline

- Specs and plans live under `docs/specs/` and `docs/plans/` and **are committed** (maintainer preference for this repo).
- Filename convention: `YYYY-MM-DD-<short-name>.md`.
- **Keep docs current** — when adding/removing/changing files, APIs, or behavior, update `README.md`, `docs/`, JSDoc, AGENTS.md, CHANGELOG.

## When in doubt

See `CONTRIBUTING.md` for the human-facing version. When the two disagree, `AGENTS.md` wins.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md with pi-superpowers-specific rules"
```

---

## Phase 2 — Blank-line script (added but not yet wired)

### Task 7: Add `scripts/check-blank-lines.sh`

**Files:**
- Create: `scripts/check-blank-lines.sh`

- [ ] **Step 1: Copy verbatim from pi-tasks**

```bash
cp /Users/josorio/Code/pi-tasks/scripts/check-blank-lines.sh /Users/josorio/Code/pi-superpowers/scripts/check-blank-lines.sh
chmod +x /Users/josorio/Code/pi-superpowers/scripts/check-blank-lines.sh
```

- [ ] **Step 2: Dry-run to see current violations** (expect many because code is tab-indented; we won't wire it in until Phase 3 is done)

```bash
bash scripts/check-blank-lines.sh | head -20
echo "exit=$?"
```
Record the count — useful later. Do NOT fix violations yet; we reformat first.

- [ ] **Step 3: Commit** (script only — not wired into `check` yet)

```bash
git add scripts/check-blank-lines.sh
git commit -m "chore: add check-blank-lines.sh script (not yet wired)"
```

---

## Phase 3 — Config alignment (the churn phase)

### Task 8: Tighten `tsconfig.json`

Align with pi-tasks: `target: ES2025`, `module: NodeNext`, `moduleResolution: NodeNext`, plus `isolatedModules`, `verbatimModuleSyntax`, `noImplicitOverride`, `allowImportingTsExtensions: false`, `noEmit: true`. Drop `outDir` / `rootDir` / `declaration` (not publishing a dist).

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Replace `tsconfig.json` content**

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2: Typecheck — expect failures from `verbatimModuleSyntax`**

```bash
npx tsc --noEmit
```
Expected: errors like `'X' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.` Capture the list.

- [ ] **Step 3: Fix type-only import violations**

For each error, rewrite the import:
```ts
// before
import { SomeType, someValue } from "./foo.js";
// after
import type { SomeType } from "./foo.js";
import { someValue } from "./foo.js";
```
Or use inline `import { type SomeType, someValue }` if biome's `useImportType` is configured that way (it isn't — inline type imports become two lines).

Work through errors file by file. Re-run `npx tsc --noEmit` after each batch.

- [ ] **Step 4: Verify clean typecheck**

```bash
npx tsc --noEmit
echo "exit=$?"
```
Expected: exit 0.

- [ ] **Step 5: Verify tests still pass**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json src/
git commit -m "chore(tsconfig): align with pi-agents — NodeNext + verbatimModuleSyntax"
```

---

### Task 9: Align `biome.json`

Add full rule set (correctness, suspicious, complexity), `src/api.ts` + `**/*.test.ts` overrides, switch `indentStyle` from `"tab"` to `"space"` with `indentWidth: 2`.

**Files:**
- Modify: `biome.json`

- [ ] **Step 1: Replace `biome.json` content**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "recommended": false,
        "noNestedTernary": "error",
        "noNonNullAssertion": "error",
        "useImportType": "error",
        "useFilenamingConvention": {
          "level": "error",
          "options": {
            "filenameCases": ["kebab-case"]
          }
        }
      },
      "performance": {
        "noBarrelFile": "error",
        "noNamespaceImport": "error"
      },
      "complexity": {
        "useMaxParams": {
          "level": "error",
          "options": {
            "max": 2
          }
        },
        "noExcessiveCognitiveComplexity": {
          "level": "error",
          "options": {
            "maxAllowedComplexity": 25
          }
        }
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noControlCharactersInRegex": "off",
        "noEmptyInterface": "off"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "files": {
    "includes": ["src/**/*.ts"]
  },
  "overrides": [
    {
      "includes": ["src/api.ts"],
      "linter": {
        "rules": {
          "performance": {
            "noBarrelFile": "off"
          }
        }
      }
    },
    {
      "includes": ["**/*.test.ts"],
      "linter": {
        "rules": {
          "style": {
            "noNonNullAssertion": "off"
          },
          "suspicious": {
            "noExplicitAny": "error"
          },
          "correctness": {
            "noUnusedVariables": "off"
          }
        }
      }
    }
  ]
}
```

- [ ] **Step 2: Do NOT commit yet — reformatting happens in the next task.** Verify shape only:

```bash
npx biome check --config-path biome.json --help >/dev/null 2>&1 || true
jq '.formatter.indentStyle' biome.json
```
Expected: `"space"`.

Now also with `src/api.ts` — it has inline `biome-ignore` comments for `noBarrelFile`. These should still work because the override plus the inline comments both disable the rule; the inline comments can stay as belt-and-suspenders. No action needed on `src/api.ts`.

---

### Task 10: Reformat entire `src/` (tabs → 2-space)

This is a **single isolated commit** with only formatting changes. It will be a massive diff (~59 files) but zero behavior change.

**Files:**
- Modify: every file under `src/**/*.ts`

- [ ] **Step 1: Format everything**

```bash
npx biome format --write src/
```

- [ ] **Step 2: Sanity check — typecheck must still pass**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Sanity check — unit tests must still pass**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 4: Commit as a pure formatting change**

```bash
git add src/
git commit -m "style(biome): reformat src/ to 2-space indent"
```

---

### Task 11: Fix lint errors from newly enabled rules

Rules newly enabled: `noUnusedImports`, `noUnusedVariables`, `noExplicitAny`, `noExcessiveCognitiveComplexity`, `useImportType`, `useMaxParams` (max 2), `useFilenamingConvention` (kebab-case), `noBarrelFile`, `noNamespaceImport`, `noNestedTernary`, `noNonNullAssertion`.

**Files:**
- Modify: whatever biome flags

- [ ] **Step 1: Run biome check to enumerate errors**

```bash
npx biome check src/ 2>&1 | tee /tmp/biome-errors.log | tail -60
grep -c "error" /tmp/biome-errors.log || true
```

- [ ] **Step 2: Auto-fix what biome can fix**

```bash
npx biome check --fix src/
```

- [ ] **Step 3: Re-run and handle remaining manually**

```bash
npx biome check src/
```

For each remaining category, fix at the source (not by silencing the rule):
- `noUnusedImports` / `noUnusedVariables` → delete.
- `noExplicitAny` → type properly; if truly dynamic, use `unknown` + narrowing.
- `noExcessiveCognitiveComplexity` (threshold 25) → extract helpers, flatten control flow.
- `useMaxParams` → convert to options object.
- `useFilenamingConvention` → `git mv` the file; update imports (grep for the old name).
- `noNestedTernary` → early returns or helper.
- `noNonNullAssertion` → narrow the type; only silence in tests via the override.

Only silence with inline `biome-ignore` when it's genuinely intentional (like the existing `src/api.ts` barrel case). Document the reason in the comment.

- [ ] **Step 4: Verify clean**

```bash
npx biome check src/
npx tsc --noEmit
npm test
```
All three: exit 0.

- [ ] **Step 5: Commit biome config and any real fixes**

```bash
git add biome.json src/
git commit -m "chore(biome): align rule set with pi-agents/pi-tasks"
```

---

### Task 12: Wire `lint:blanks` into `npm run check` and fix violations

**Files:**
- Modify: `package.json`
- Modify: possibly many `src/**/*.ts` files to add blank lines

- [ ] **Step 1: Add script to `package.json`**

In the `"scripts"` object, add:
```json
"lint:blanks": "bash scripts/check-blank-lines.sh",
```

- [ ] **Step 2: Update `check` script to include it**

Change:
```json
"check": "npm run lint && npm run typecheck && npm run test && npm run parity-check",
```
To:
```json
"check": "npm run lint && npm run lint:blanks && npm run typecheck && npm run test && npm run parity-check",
```

- [ ] **Step 3: Run and fix violations**

```bash
npm run lint:blanks
```
For each violation printed (format: `file:line — missing blank line`), open the file and insert a blank line between the closing `}` / `]` / `])` and the next block-opening line at the same indent.

Repeat until `npm run lint:blanks` exits 0.

- [ ] **Step 4: Full check**

```bash
npm run check
```
Expected: exit 0 (ignore `parity-check` — if it's broken it's unrelated; handle separately).

- [ ] **Step 5: Commit**

```bash
git add package.json src/
git commit -m "chore: wire lint:blanks into npm run check"
```

---

## Phase 4 — Test config split

### Task 13: Split `vitest.e2e.config.ts` and simplify scripts

Currently `package.json` hard-codes the list of e2e test files in the `test:e2e` script. pi-agents/pi-tasks use file-pattern exclusion + a separate e2e config.

**Files:**
- Modify: `vitest.config.ts`
- Create: `vitest.e2e.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Replace `vitest.config.ts`** (add exclusion)

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*-e2e.test.ts", "node_modules/**"],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 2: Create `vitest.e2e.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*-e2e.test.ts"],
    exclude: ["node_modules/**"],
    passWithNoTests: false,
  },
});
```

- [ ] **Step 3: Update `package.json` scripts**

Replace the current test scripts block with:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "PI_E2E=1 vitest run --config vitest.e2e.config.ts",
"test:e2e:full": "PI_E2E=1 E2E_FULL=1 vitest run --config vitest.e2e.config.ts",
```

Note: the current `test:e2e:full` enumerated specific files including `src/multi-session/`. The new `vitest.e2e.config.ts` includes ALL `-e2e.test.ts` files globally; the `E2E_FULL` env var remains as a gating signal inside the test files themselves (where already respected). Verify the existing e2e tests read `process.env.E2E_FULL` and self-skip when absent — grep:

```bash
grep -rn "E2E_FULL" src/
```
If any test doesn't self-skip and would run expensive LLM calls unconditionally, either (a) add a self-skip guard, or (b) keep the old file-enumeration in `test:e2e:full` for now. Default to (a).

- [ ] **Step 4: Verify fast test lane still works**

```bash
npm test
```
Expected: runs unit tests only, all pass, `-e2e.test.ts` files excluded.

- [ ] **Step 5: Verify e2e lane compiles** (don't run unless `PI_BIN` is set)

```bash
npx vitest --config vitest.e2e.config.ts list
```
Expected: lists all `-e2e.test.ts` files without errors.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.e2e.config.ts package.json src/
git commit -m "chore(test): split e2e into vitest.e2e.config.ts"
```

---

## Phase 5 — Pre-commit hook

### Task 14: Add `simple-git-hooks` + `lint-staged`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add devDependencies**

```bash
npm install -D simple-git-hooks lint-staged
```

- [ ] **Step 2: Add `prepare` script and hook/lint-staged config to `package.json`**

In `"scripts"`, add:
```json
"prepare": "simple-git-hooks",
```

At root of `package.json`, add:
```json
"simple-git-hooks": {
  "pre-commit": "npx lint-staged"
},
"lint-staged": {
  "src/**/*.ts": [
    "biome check --fix --no-errors-on-unmatched"
  ]
}
```

- [ ] **Step 3: Install the hook**

```bash
npx simple-git-hooks
```
Expected output: `[INFO] Setting pre-commit hook ...`

- [ ] **Step 4: Verify hook fires on commit**

Make a trivial test edit (add and remove a space) to any file under `src/`, stage, commit. Watch for lint-staged output. Then reset the no-op commit:

```bash
echo "// test" >> src/api.ts
git add src/api.ts
git commit -m "test: verify pre-commit"   # should run biome via lint-staged
git reset --soft HEAD~1                   # undo commit, keep changes staged
git restore --staged src/api.ts
git checkout src/api.ts                   # discard the edit
```

- [ ] **Step 5: Commit the hook setup**

```bash
git add package.json package-lock.json
git commit -m "chore: add simple-git-hooks + lint-staged pre-commit"
```

---

## Phase 6 — Package.json polish

### Task 15: Add `engines`, `files`, align script naming

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `engines` field**

```json
"engines": {
  "node": ">=20"
}
```

- [ ] **Step 2: Add `files` array** — restrict what `npm pack` would include so installs from git are lean

```json
"files": [
  "src",
  "vendor",
  "CHANGELOG.md",
  "LICENSE",
  "README.md"
]
```

Note: `vendor/` is included because the `pi.skills` field in `package.json` points at `./vendor/superpowers/skills` — consumers need it.

- [ ] **Step 3: Verify**

```bash
jq '.engines, .files' package.json
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore(package): add engines + files fields"
```

---

## Phase 7 — GitHub setup

### Task 16: Add `.github/CODEOWNERS`, `dependabot.yml`, issue templates

**Files:**
- Create: `.github/CODEOWNERS`
- Create: `.github/dependabot.yml`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`

- [ ] **Step 1: Create `.github/` directory and CODEOWNERS**

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

Write `.github/CODEOWNERS`:
```
# Everything — solo maintainer
* @josorio7122
```

- [ ] **Step 2: Write `.github/dependabot.yml`** (adapt pi-tasks — change group to match pi-superpowers deps)

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: development
        update-types: [minor, patch]
      pi-peers:
        patterns: ["@mariozechner/*", "@sinclair/*"]
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: monthly
```

- [ ] **Step 3: Write `.github/ISSUE_TEMPLATE/bug.yml`** — pi-superpowers flavor

```yaml
name: Bug report
description: Report something that's broken.
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to file a bug! Please fill out the sections below so we can reproduce the issue.

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: A clear description of the bug.
      placeholder: When I dispatch a subagent via superpowers_subagent, the skill corpus isn't injected…
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: Minimal pi session setup + tool calls that trigger the bug.
      placeholder: |
        1. Start pi with `pi install git:github.com/josorio7122/pi-superpowers@v5.6.0`
        2. Invoke `superpowers_subagent` with `{ agent: "code-reviewer", task: "..." }`
        3. Observe…
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true

  - type: input
    id: pi-superpowers-version
    attributes:
      label: pi-superpowers version
      description: Output of `git describe --tags` or the tag you installed.
      placeholder: v5.6.0
    validations:
      required: true

  - type: input
    id: pi-version
    attributes:
      label: pi / pi-coding-agent version
      placeholder: 0.68.x
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: OS, terminal, Node version, model provider.
      placeholder: |
        - OS: macOS 14.5
        - Node: v20.10.0
        - Model: anthropic/claude-sonnet-4-6
    validations:
      required: false

  - type: textarea
    id: logs
    attributes:
      label: Logs / output
      description: Relevant stack traces, session transcript snippets, or captured tool-call JSON.
      render: shell
    validations:
      required: false
```

- [ ] **Step 4: Write `.github/ISSUE_TEMPLATE/feature.yml`**

```yaml
name: Feature request
description: Suggest an enhancement to pi-superpowers.
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for the idea! Please check the [Contributing guide](../../CONTRIBUTING.md#what-belongs-in-pi-superpowers) first — some proposals belong upstream or in a separate pi-package.

  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What user pain does this solve? Why is the current behavior insufficient?
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: Proposed solution
      description: Concrete shape — bootstrap addendum change, subagent behavior, skill loader extension, TUI surface, etc.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Other approaches you thought about and why you rejected them.
    validations:
      required: false

  - type: checkboxes
    id: scope
    attributes:
      label: Scope confirmation
      description: Please confirm this proposal belongs in pi-superpowers.
      options:
        - label: "This affects bootstrap, subagent dispatch, skill broadcast, or pi-superpowers-specific TUI (in scope)."
        - label: "This is an upstream Superpowers skill change (belongs in [obra/superpowers](https://github.com/obra/superpowers))."
        - label: "This is pi-core / pi-tui functionality (upstream to [pi-mono](https://github.com/badlogic/pi-mono))."
        - label: "This belongs in pi-agents or pi-tasks (generic infrastructure)."
    validations:
      required: true
```

- [ ] **Step 5: Commit**

```bash
git add .github/
git commit -m "ci: add CODEOWNERS, dependabot, issue templates"
```

---

### Task 17: Add `.github/workflows/check.yml` (CI)

**Files:**
- Create: `.github/workflows/check.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: check

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm run check
```

- [ ] **Step 2: Verify `npm run check` passes locally one more time**

```bash
npm run check
```
Expected: exit 0. If it fails, fix before pushing so the first CI run is green.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/check.yml
git commit -m "ci: add GitHub Actions check workflow"
```

---

## Phase 8 — Final verification

### Task 18: End-to-end harness verification

**Files:** none modified — verification only.

- [ ] **Step 1: Clean local state and reinstall**

```bash
rm -rf node_modules
npm ci
```

- [ ] **Step 2: Run full local check**

```bash
npm run check
```
Expected: all gates pass.

- [ ] **Step 3: Verify pre-commit hook fires**

```bash
touch src/_hook_probe.ts   # intentionally violates kebab-case? no, underscore is fine as infix. pick a real bad filename to test:
mv src/_hook_probe.ts src/HookProbe.ts  # PascalCase — violates useFilenamingConvention
git add src/HookProbe.ts
git commit -m "test: probe hook" || echo "hook blocked commit as expected"
git restore --staged src/HookProbe.ts
rm src/HookProbe.ts
```
Expected: the `git commit` fails because biome refuses PascalCase filename.

- [ ] **Step 4: Push and verify CI green**

```bash
git push -u origin HEAD
# visit repo's Actions tab — first run must be green
```
If the branch was already pushed during earlier tasks, just wait for the latest CI run and confirm it's green.

- [ ] **Step 5: Side-by-side harness diff against pi-tasks**

```bash
for f in AGENTS.md CONTRIBUTING.md CHANGELOG.md LICENSE SECURITY.md CODE_OF_CONDUCT.md \
         biome.json tsconfig.json vitest.config.ts vitest.e2e.config.ts \
         scripts/check-blank-lines.sh \
         .github/workflows/check.yml .github/dependabot.yml .github/CODEOWNERS \
         .github/ISSUE_TEMPLATE/bug.yml .github/ISSUE_TEMPLATE/feature.yml; do
  test -f /Users/josorio/Code/pi-superpowers/$f || echo "MISSING: $f"
done
```
Expected: no "MISSING" output.

- [ ] **Step 6: Update CHANGELOG** — move the Unreleased "Added" entry into a dated section, bump version. Example:

```markdown
## [5.7.0] — 2026-04-21

### Added
- Repo harness parity with pi-agents / pi-tasks (see tasks 1-17 of this plan).
```

Bump `package.json` version to `5.7.0`.

```bash
git add CHANGELOG.md package.json
git commit -m "chore(release): bump to v5.7.0 — harness parity"
git tag v5.7.0
```

(Do not `git push --tags` until the user confirms they want to cut a release.)

---

## Self-review notes

- **Coverage against assessment:** every gap identified in the prior assessment (AGENTS.md, CONTRIBUTING, LICENSE, CHANGELOG, SECURITY, COC, tsconfig tightening, biome alignment, 2-space reformat, lint-staged + hook, blank-lines script, vitest e2e split, engines/files, CODEOWNERS, dependabot, issue templates, CI workflow, loose root docs) maps to a task above.
- **Risk concentration:** Task 10 (reformat) and Task 11 (stricter biome) are the only tasks that touch real code. Both land in dedicated commits so they can be reverted independently.
- **Intentional deviations from pi-tasks:** `dependencies` vs `peerDependencies` (documented in AGENTS.md Task 6), `files` array includes `vendor/` (Task 15), `lint:e2e:full` retained as a named script (Task 13).
- **Blockers to watch for:** Task 11's `noExcessiveCognitiveComplexity: 25` threshold may flag existing code; if a function is over budget, prefer extraction over raising the threshold. Task 14's hook install requires a fresh `npm install` — `npx simple-git-hooks` only fires the hook after `prepare` runs.
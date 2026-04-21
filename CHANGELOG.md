# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [5.7.0] — 2026-04-21

### Added
- Repo harness parity with pi-agents / pi-tasks: `AGENTS.md`,
  `CONTRIBUTING.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `CHANGELOG.md`, GitHub CI (`check.yml`), dependabot, issue templates,
  `CODEOWNERS`, pre-commit via `simple-git-hooks` + `lint-staged`,
  `scripts/check-blank-lines.sh` wired into `npm run check`, dedicated
  `vitest.e2e.config.ts`, `engines.node >= 20`, `files` array.

### Changed
- Stricter `tsconfig.json`: `target: ES2025`, `module: NodeNext`,
  `isolatedModules`, `verbatimModuleSyntax`, `noImplicitOverride`,
  `allowImportingTsExtensions: false`, `noEmit: true`.
- Aligned `biome.json` with pi-agents / pi-tasks: 2-space indent (was
  tab), full rule set (`correctness.noUnusedImports`,
  `suspicious.noExplicitAny`, `complexity.noExcessiveCognitiveComplexity`,
  `style.useImportType`), `src/api.ts` + `**/*.test.ts` overrides.
- Root-level design docs moved under `docs/specs/`.
- `test:e2e` / `test:e2e:full` scripts now discover tests via
  `vitest.e2e.config.ts` pattern instead of hard-coded file lists.

## [5.6.0] — 2026-04-20

### Added
- Dynamic skill frontmatter for dispatched agents: every dispatched
  subagent receives the full Superpowers skill corpus inlined into its
  system prompt (`skills:` frontmatter expands at dispatch time).

### Fixed
- Fall back to `mkdtemp("pi-superpowers-ephemeral-")` under `$TMPDIR`
  when `sessionManager.getSessionDir()` returns empty (pi `--no-session`
  mode). The ephemeral tmpdir is not auto-cleaned; see README troubleshooting.

## [5.5.2] — 2026-04-19

### Changed
- Picked up `pi-tasks@v0.2.1`.

## [5.5.1] — 2026-04-19

### Changed
- Dropped `priority` from the task schema (upstream parity).

### Fixed
- E2E prompts updated from `superpowers_todo` → `task`.

## [5.5.0] — 2026-04-19

### Changed
- Consumes `pi-tasks` + `pi-agents` raw instead of in-tree
  implementations. Bootstrap maps CC tool names to library-native
  names (`TodoWrite` → `task`, `Task` → `agent`).
- Deleted in-tree `todos` module — superseded by `pi-tasks`.

## [5.4.1] — 2026-04-18

### Added
- CC-style task display with `activeForm` + elapsed time.
- Model taught todo `in_progress` discipline via tool description +
  addendum.

## [5.4.0] — 2026-04-18

### Changed
- Delegates `superpowers_subagent` to `pi-agents` `createAgentTool`;
  removed custom handlers and renderers superseded by pi-agents.
- Dispatched agents preload the `using-superpowers` skill.
- Eager `buildAllAgentConfigs` with pi-agents validation at
  registration time.

## [5.3.0] — 2026-04-18

### Added
- Upstream parity pass against [obra/superpowers](https://github.com/obra/superpowers):
  skill / command / agent loaders pick up new upstream entries
  generically.
- `runParityCheck` detects vendor/registration drift; `parity-check` CLI
  wired into `npm run check`.
- Sync playbook documented in `docs/sync-playbook.md`.
- Upstream commands loader (`buildCommandHandler` + vendor scanner).

### Removed
- Subagent chain mode (not upstream).
- `/todos` interactive picker (not upstream).

## [5.2.0] — 2026-04-18

### Added
- Tree-style rendering across todos + subagents (CC-inspired visual
  redesign).
- Tree primitives (`bullet`, `branch`, `indent`, `checkbox`,
  `priorityMark`).
- Animated `simulate-ui` scripts with subcommand dispatch.

### Removed
- Orphan UI exports and unused icon tokens.

## [5.1.2] — 2026-04-18

### Fixed
- `reconstructTodos` reads pi's real `message.toolName` shape (bug 1).
- Error on `complete` / `update` / `remove` against empty todo state
  (bug 3 guard).

### Added
- Built-in `general-purpose` agent for unnamed dispatches (bug 2).
- Addendum enumerates available agents + prompt-template pattern
  (bug 2).
- Bundled-agent model pinned to `openai-codex/gpt-5.4` (override via
  `SUPERPOWERS_AGENT_MODEL`).
- E2E regression for todo add → add → complete round-trip.

## [5.1.0] — 2026-04-18

Initial feature-complete release.

- 15 superpowers skills auto-registered from `vendor/superpowers/`.
- First-turn bootstrap injects `using-superpowers` + pi tool mapping
  addendum.
- Native `superpowers_todo` tool.
- Native `superpowers_subagent` tool with single and parallel modes.
- Persistent above-editor todo widget.
- Session-start status footer.

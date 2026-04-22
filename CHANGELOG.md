# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project
adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-04-21

Initial release.

- 15 superpowers skills auto-registered from `vendor/superpowers/`.
- First-turn bootstrap injects `using-superpowers` + pi tool mapping
  addendum.
- Native `superpowers_todo` tool (via `pi-tasks`) with in-progress
  discipline.
- Native `superpowers_subagent` tool (via `pi-agents`) with single and
  parallel modes, live streaming, and abort.
- Dynamic skill frontmatter: every dispatched subagent receives the
  full Superpowers skill corpus inlined into its system prompt.
- Persistent above-editor todo widget that survives `/compact`.
- Session-start status footer.
- Ephemeral tmpdir fallback for pi `--no-session` mode.
- Upstream parity against [obra/superpowers](https://github.com/obra/superpowers):
  generic skill / command / agent loaders, `parity-check` CLI, sync
  playbook (`docs/sync-playbook.md`).
- Repo harness aligned with pi-agents / pi-tasks: strict `tsconfig.json`
  (NodeNext, `verbatimModuleSyntax`, `isolatedModules`), full `biome.json`
  rule set (2-space, `useImportType`, `noExplicitAny`,
  `noExcessiveCognitiveComplexity`, `useMaxParams: 2`), blank-line
  script, dedicated `vitest.e2e.config.ts`, `simple-git-hooks` +
  `lint-staged` pre-commit, GitHub CI (`check.yml`), `dependabot.yml`,
  `CODEOWNERS`, issue templates, `AGENTS.md`, `CONTRIBUTING.md`,
  `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.

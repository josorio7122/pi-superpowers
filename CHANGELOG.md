# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project
adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-04-22

Initial release.

- 14 superpowers skills + 3 commands + 1 agent auto-registered from
  `vendor/superpowers/`.
- First-turn bootstrap injects `using-superpowers` + pi tool-mapping
  addendum.
- Native `task` tool (via `pi-tasks`) with in-progress discipline and
  an above-editor widget that survives `/compact`.
- Native `agent` tool (via `pi-agents`) with single / parallel / chain
  modes (chain uses `{previous}` substitution for prior-step output),
  live streaming, and abort.
- **Progressive skill disclosure for dispatched subagents.** The
  dispatched agent's system prompt carries a compact `<skills>` XML
  manifest (name + description + path) per the
  [agentskills.io spec](https://agentskills.io/integrate-skills); skill
  bodies load on demand via the agent's `read` tool. No more 25–30k
  token baseline per dispatch.
- Model inheritance: dispatched agents run on the parent session's
  current model unless a specific `model: "provider/name"` is declared
  upstream. `SUPERPOWERS_AGENT_MODEL` env override supported.
- Session-start status footer: `🦸 Superpowers · 14 skills · tasks + agents`.
- Ephemeral tmpdir fallback for pi `--no-session` mode (session-scoped
  prompt variable substitution).
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

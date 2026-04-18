# pi-superpowers

[Superpowers](https://github.com/obra/superpowers) skills library as a native pi package.

Wraps a vendored snapshot of `obra/superpowers` and exposes its 15 skills to the `pi` coding agent, plus a session-scoped todos tool. Updates are a single `./scripts/sync-upstream.sh vX.Y.Z` command — zero merge conflicts because we don't edit upstream files.

## Install

```bash
pi install git:github.com/josorio7122/pi-superpowers@v5.0.10
```

(If you later enable experimental subagents, also install `git:github.com/josorio7122/pi-agents`.)

## Shipped in v5.0.10

| Feature | Status |
|---|---|
| **15 superpowers skills** discoverable via `/skill:name` (brainstorming, writing-plans, TDD, debugging, code-review, etc.) | ✅ fully functional, E2E verified |
| **First-turn bootstrap** — injects full `using-superpowers` content + pi tool-mapping addendum on every new pi session | ✅ fully functional, E2E verified |
| **`superpowers_todo` tool** — add / replace / update / complete / remove / clear / list, state reconstructed from session entries, persistent widget above editor | ✅ fully functional, E2E verified |
| **Top-tier `ui/` component library** — theme, icons, box, progress, truncate, status, widget, with ASCII fallback and width-responsive rendering | ✅ 150+ unit tests, snapshot-verified |
| **Session-start status** — `🦸 Superpowers · v5.0.10 · 15 skills` flash on start | ✅ |
| **`sync-upstream.sh`** — atomic snapshot of `obra/superpowers` at any tag | ✅ |

## Deferred to v5.1 (feature-flagged off)

| Feature | Flag | Reason |
|---|---|---|
| `superpowers_subagent` tool (single/parallel/chain via pi-agents) | `SUPERPOWERS_SUBAGENT_ENABLED=1` | pi-agents `runAgent` requires a structured `AgentConfig` + `modelRegistry` / `sessionDir` / `conversationLogPath` sourcing from pi runtime. Proper integration design lives in [`docs/specs/2026-04-23-subagents-v5.1-design.md`](docs/specs/2026-04-23-subagents-v5.1-design.md). |
| `/todos` interactive picker | `SUPERPOWERS_TODOS_PICKER_ENABLED=1` | pi's `ctx.ui.custom` expects a `pi-tui` Component object, not our string-array render. Real Component implementation coming in v5.1. |

Both features have unit-test coverage (150+ tests) for their pure logic; wiring to pi's runtime is what ships in v5.1.

## Updating superpowers

When `obra/superpowers` tags a new release:

```bash
./scripts/sync-upstream.sh v5.0.11   # atomic rsync into vendor/superpowers/ + bump package.json
npm run check                         # lint + typecheck + unit tests
PI_BIN=$(which pi) npx vitest run     # also runs E2E against real pi
git add -A && git commit -m "Sync superpowers to v5.0.11"
git tag v5.0.11 && git push --follow-tags
```

Zero merge conflicts guaranteed — `src/` never edits `vendor/superpowers/`.

## Development

```bash
npm run check          # lint + typecheck + 150 unit tests
npm run test:watch     # vitest in watch mode
PI_BIN=$(which pi) npx vitest run src/bootstrap/inject-e2e.test.ts src/todos/todos-e2e.test.ts
```

Conventions mirrored from pi-agents: biome with kebab-case filenames, `noBarrelFile`, `useMaxParams: 2`; strict TypeScript with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; co-located `*.test.ts` next to every module.

## Architecture

See [`docs/specs/2026-04-18-pi-superpowers-design.md`](docs/specs/2026-04-18-pi-superpowers-design.md) for the full design.

- **`vendor/superpowers/`** — read-only snapshot of `obra/superpowers`, refreshed only by the sync script.
- **`src/`** — thin pi adapter, feature-organized (bootstrap, skills, todos, subagents, ui, compat, common).
- **Versioning** — `pi-superpowers@vX.Y.Z` wraps `obra/superpowers@vX.Y.Z` exactly. `pi list` shows upstream version directly.

## License

MIT. Upstream skills under `vendor/superpowers/` retain the upstream [MIT license](vendor/superpowers/LICENSE).

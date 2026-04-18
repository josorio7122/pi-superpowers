# pi-superpowers

[Superpowers](https://github.com/obra/superpowers) skills library as a native pi package.

Wraps a vendored snapshot of `obra/superpowers` and exposes its 15 skills to the `pi` coding agent. Injects the `using-superpowers` discipline on the first turn of every pi session, plus a pi-specific tool-mapping addendum so skills written for Claude Code work naturally on pi.

## Install

```bash
pi install git:github.com/josorio7122/pi-agents
pi install git:github.com/josorio7122/pi-superpowers@v5.0.7
```

## What you get

- **15 superpowers skills** discoverable via `/skill:name` (e.g. `/skill:brainstorming`, `/skill:writing-plans`, `/skill:test-driven-development`).
- **First-turn bootstrap** that injects the `using-superpowers` skill content + a pi tool-mapping addendum (maps `TodoWrite` → `superpowers_todo`, `Task` → `superpowers_subagent`, `Read/Write/Edit/Bash` → pi natives).
- **Session-start status** `🦸 Superpowers · v5.0.7 · 15 skills` that auto-clears after 3 seconds.
- **Reusable `ui/` component library** (theme, icons, box, progress, truncate, status, widget) used by the todo and subagent features shipping in v5.0.8 / v5.0.9.

## Updating superpowers

When `obra/superpowers` releases a new version:

```bash
./scripts/sync-upstream.sh v5.0.8
npm run check
git add -A && git commit -m "Sync superpowers to v5.0.8"
git tag v5.0.8 && git push --follow-tags
```

The sync script does an atomic rsync of the upstream repo into `vendor/superpowers/`, bumps `package.json` to match, and stamps the ref in `vendor/superpowers/.synced-ref`. If anything goes wrong, `vendor/superpowers/` is left untouched.

## Development

```bash
npm run check          # lint + typecheck + test (~50 unit tests)
npm run test:watch     # vitest in watch mode
PI_BIN=$(which pi) npm run test:e2e   # runs pi subprocess e2e test
```

The tests mirror pi-agents conventions exactly: biome with `kebab-case` filenames, `noBarrelFile`, `useMaxParams: 2`; vitest with co-located `*.test.ts`; strict TypeScript with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

## Architecture

See [`docs/specs/2026-04-18-pi-superpowers-design.md`](docs/specs/2026-04-18-pi-superpowers-design.md) for the full design.

- **`vendor/superpowers/`** — read-only snapshot of `obra/superpowers`, refreshed only by the sync script.
- **`src/`** — thin pi adapter, feature-organized (bootstrap, skills, todos, subagents, ui, compat, common).
- **Versioning** — `pi-superpowers@v5.0.7` wraps `obra/superpowers@v5.0.7` exactly. `pi list` shows the upstream version directly.

## Roadmap

- **v5.0.7 (this release)** — skills discovery + first-turn bootstrap + ui primitives.
- **v5.0.8 (next)** — `superpowers_todo` tool + interactive `/todos` picker.
- **v5.0.9** — `superpowers_subagent` tool with single/parallel/chain modes via pi-agents.

## License

MIT. Upstream skills under `vendor/superpowers/` retain the upstream [MIT license](vendor/superpowers/LICENSE).

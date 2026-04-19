# pi-superpowers

[Superpowers](https://github.com/obra/superpowers) skills library as a native pi package — with full subagent support.

v5.1 ships the complete feature set with no feature flags: 15 skills, first-turn bootstrap, `superpowers_todo` tool + interactive `/todos` picker, `superpowers_subagent` tool with single/parallel/chain modes via `pi-agents`.

## Install

```bash
pi install git:github.com/josorio7122/pi-superpowers@v5.1.1
```

`pi-agents` is bundled as a regular npm dependency — no separate install needed. If you later want to share a single pi-agents install across multiple packages, move it to your pi settings and it'll dedupe via npm.

### Or run from source (dev mode)

```bash
pi -e /path/to/pi-superpowers/src/index.ts
```

The `-e` flag loads the extension directly from source with no install — great for iterating on the code.

## Features

| Feature | How to use |
|---|---|
| **15 superpowers skills** | `/skill:brainstorming`, `/skill:writing-plans`, etc. |
| **First-turn bootstrap** | Automatic — injects `using-superpowers` + pi tool mapping on every new pi session |
| **`superpowers_todo` tool** | Model calls with `{ action: "add", content: "..." }` and variants: replace, update, complete, remove, clear, list |
| **`/todos` interactive picker** | Type `/todos` in pi interactive mode — `j/k` nav, `space` toggle, `a` add, `x` remove, `1/2/3` priority, `q` quit |
| **`superpowers_subagent` tool** | Single: `{ agent, task }`. Parallel: `{ tasks: [...] }`. Chain: `{ chain: [...] }` with `{previous}` substitution |
| **Persistent todo widget** | Above-editor widget showing progress bar + current in-progress item; survives `/compact` |
| **Session-start status** | Footer shows `🦸 Superpowers · v5.1.0 · 15 skills · subagents` on session start |

## Troubleshooting

### `pi-superpowers requires pi-agents to be installed`
Run `pi install git:github.com/josorio7122/pi-agents`, then re-install or restart pi.

### `cannot resolve 'inherit' model — ctx.model is undefined`
Upstream agent has `model: inherit` but your pi session has no active model. Select a model with `/model` or start pi with `--model provider/name`.

### `Unknown agent: "<name>"`
`superpowers_subagent` dispatches only agents from `vendor/superpowers/agents/`. Upstream currently ships `code-reviewer`. Run `./scripts/sync-upstream.sh vX.Y.Z` to refresh if a new agent appears upstream.

## Updating superpowers

See [`docs/sync-playbook.md`](docs/sync-playbook.md) for the full workflow, including what the parity-check guards against. Quick version:

```bash
./scripts/sync-upstream.sh v5.X.Y
npm run parity-check   # fails loudly if upstream adds a surface we don't handle
npm run check
PI_BIN=$(which pi) npm run test:e2e
git add -A && git commit -m "Sync superpowers to v5.X.Y"
git tag v5.X.Y && git push --follow-tags
```

Zero merge conflicts — `src/` never edits `vendor/superpowers/`. Generic loaders pick up new skills, commands, and agents automatically.

## Development

```bash
npm run check           # lint + typecheck + ~175 unit tests (E2E excluded)
npm run test:watch      # vitest in watch mode
PI_BIN=$(which pi) npm run test:e2e                   # fast E2E (~3-5 min)
PI_BIN=$(which pi) E2E_FULL=1 npm run test:e2e:full   # full E2E incl. multi-session (~10 min, costs model tokens)
```

### Previewing the TUI

Watch the tool-call and result panels animate in your terminal:

```bash
npm run simulate-ui:all                        # every surface back-to-back
npm run simulate-ui todos                      # only the todos panel
npm run simulate-ui subagent-single
npm run simulate-ui subagent-parallel
npm run simulate-ui subagent-chain
npm run simulate-ui widget
```

Tweak `src/ui/tree.ts` or any `src/*/render.ts` and re-run to see changes live. The simulator is a design-preview tool — regression safety lives in `*.test.ts` snapshot tests.

## Architecture

See [`docs/specs/2026-04-23-v5.1-feature-complete-design.md`](docs/specs/2026-04-23-v5.1-feature-complete-design.md).

## License

MIT. Upstream skills under `vendor/superpowers/` retain the upstream [MIT license](vendor/superpowers/LICENSE).

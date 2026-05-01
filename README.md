# pi-superpowers

[Superpowers](https://github.com/obra/superpowers) skills library as a native pi package — with full subagent support.

Consumes pi-tasks + pi-agents raw: 14 skills + 3 commands + 1 agent auto-registered from `vendor/superpowers/`, first-turn bootstrap, native four-tool task system (pi-tasks v0.2.0 — `task_create` / `task_update` / `task_list` / `task_get`) with in_progress discipline, native `agent` tool (pi-agents) with live streaming + abort. Dispatched subagents use pi's native **progressive skill disclosure** — only skill descriptions ship in the system prompt; bodies load on demand via `read`.

## Install

```bash
pi install git:github.com/josorio7122/pi-superpowers@v0.1.0
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
| **14 superpowers skills** | `/skill:brainstorming`, `/skill:writing-plans`, etc. |
| **First-turn bootstrap** | Automatic — injects `using-superpowers` + pi tool mapping on every new pi session |
| **Four task tools** | `task_create` (subject + description), `task_update` (status / fields), `task_list` (all tasks), `task_get` (one by id) — V2 plain-text output mirrors Claude Code |
| **`agent` tool** | Single: `{ agent, task }`. Parallel: `{ tasks: [...] }`. Chain: `{ chain: [...] }` with `{previous}` substitution |
| **Progressive skill disclosure** | Dispatched agents receive a compact `<skills>` XML manifest (name + description + path) per [agentskills.io](https://agentskills.io/integrate-skills); bodies load via `read` on demand |
| **Model inheritance** | Dispatched subagents run on the parent session's current model unless overridden upstream; `SUPERPOWERS_AGENT_MODEL` env var also supported |
| **Persistent todo widget** | Above-editor widget showing progress bar + current in-progress item; survives `/compact` |
| **Session-start status** | Footer shows `🦸 Superpowers · 14 skills · tasks + agents` on session start |

## Troubleshooting

### `pi-superpowers requires pi-agents to be installed`
Run `pi install git:github.com/josorio7122/pi-agents`, then re-install or restart pi.

### `cannot resolve 'inherit' model — ctx.model is undefined`
Upstream agent has `model: inherit` but your pi session has no active model. Select a model with `/model` or start pi with `--model provider/name`.

### `Unknown agent: "<name>"`
`superpowers_subagent` dispatches only agents from `vendor/superpowers/agents/`. Upstream currently ships `code-reviewer`. Run `./scripts/sync-upstream.sh vX.Y.Z` to refresh if a new agent appears upstream.

### Dispatched agent didn't load the skill it needed
Pi's progressive disclosure relies on the model choosing to `read` a skill's `SKILL.md` when the manifest description looks relevant. Capable models (Sonnet/Opus-class) handle this reliably; cheaper models sometimes skip the `read` and operate on description alone. If a dispatched agent's output feels shallow, prompt it explicitly: "Read the `brainstorming` skill before you start" or "Use the `test-driven-development` skill."

### `--no-session` creates an ephemeral `pi-superpowers-ephemeral-*` tmpdir
When pi runs with `--no-session` (used by our e2e runner and by ad-hoc one-shot invocations), `sessionManager.getSessionDir()` returns an empty string. pi-superpowers falls back to `mkdtemp("pi-superpowers-ephemeral-")` under `$TMPDIR` so `{{SESSION_DIR}}` substitution in agent prompts always has a valid path. The fallback dir is **not automatically cleaned up**; each one is empty (nothing is written there today). If it accumulates, `rm -rf $TMPDIR/pi-superpowers-ephemeral-*` is safe once no pi session is active.

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

## License

MIT. Upstream skills under `vendor/superpowers/` retain the upstream [MIT license](vendor/superpowers/LICENSE).

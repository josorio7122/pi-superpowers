# Syncing from upstream obra/superpowers

pi-superpowers is a faithful adapter — every skill, command, and agent in upstream's `skills/`, `commands/`, and `agents/` directories is registered automatically. The steps below apply each upstream release.

## One-time setup

Make sure `sync-upstream.sh` is executable: `chmod +x scripts/sync-upstream.sh`.

## Applying an upstream release

```bash
./scripts/sync-upstream.sh v5.X.Y   # atomic snapshot into vendor/superpowers/
npm run parity-check                 # shows drift (missing/extras/unknown categories)
npm run check                        # lint + typecheck + unit tests + parity
PI_BIN=$(which pi) npm run test:e2e  # runtime E2E
git add -A && git commit -m "Sync superpowers to v5.X.Y"
git tag v5.X.Y && git push --follow-tags
```

## What the parity-check guards against

| Upstream change | Outcome |
|---|---|
| New skill directory | Auto-registered via `resources_discover`; parity-check passes |
| New agent file | Auto-loaded via `loadAgents()`; parity-check passes |
| New command file | Auto-registered via commands loader; parity-check passes |
| New top-level category (e.g. `mcp-servers/`) | Parity-check exits 1 with `unknownCategories` → add a loader |
| Renamed or removed upstream file we still reference | Parity-check exits 1 with `extras` → remove our reference |

## Zero-merge-conflict guarantee

`src/` never edits `vendor/superpowers/`. Sync always runs atomically: the script snapshots upstream into a temp dir, then swaps `vendor/superpowers/` into place.

## What stays hand-maintained

The only hand-maintained registration is `src/subagents/builtin-agents.ts` — currently just `general-purpose`, which the upstream Anthropic harness provides natively as a built-in agent and upstream references in skill prompts but does not vendor. Parity-check whitelists these.

Environmental gap-fills (`superpowers_todo` as TodoWrite equivalent, `superpowers_subagent` as Task tool equivalent, first-turn bootstrap as SessionStart hook equivalent) are extension features that make upstream skills runnable on pi — not parity surfaces.

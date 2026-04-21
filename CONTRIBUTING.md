# Contributing to pi-superpowers

Thanks for considering a contribution! This project is small and opinionated — please follow the conventions below.

## Development setup

```bash
git clone https://github.com/josorio7122/pi-superpowers
cd pi-superpowers
npm install
npm run check            # lint + blank-line check + typecheck + unit tests + parity-check
npm run simulate-ui:all  # visual QA of every TUI surface
```

## Running end-to-end tests

E2E tests spawn the real `pi` CLI and assert on its output. They live in `*-e2e.test.ts` files, are excluded from the default `npm run check`, and use a dedicated `vitest.e2e.config.ts`.

```bash
export PI_BIN=/path/to/pi
npm run test:e2e                                     # fast lane (~3–5 min)
PI_BIN=$(which pi) E2E_FULL=1 npm run test:e2e:full  # full lane (~10 min, costs tokens)
```

Two env vars are involved:

- **`PI_E2E=1`** — the intent flag that opts you into e2e runs. Set automatically by `npm run test:e2e`.
- **`PI_BIN`** — the path to the compiled `pi` binary. Without it, the e2e suite self-skips cleanly.

## Code style

- **Pi compliance is non-negotiable.** Never shadow pi's `Theme`, `ThemeColor`, `ToolDefinition`, `ExtensionContext`, or `AgentToolResult` types. Import from `@mariozechner/pi-coding-agent`.
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
- Open a PR early if the change is non-trivial — discuss approach before you invest hours.
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
